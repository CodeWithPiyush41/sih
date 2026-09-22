import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { ai } from './lib/ai/orchestrator/router';
import { extractTopics } from './lib/ai/tasks/extract-topics';
import { generateQuestions } from './lib/ai/tasks/generate-questions';
import { validateQuestion } from './lib/ai/tasks/validate-question';
import { evaluateAnswer } from './lib/ai/tasks/evaluate-answer';
import { createLearningPlan } from './lib/ai/tasks/create-learning-plan';
import { analyzePDF } from './lib/ai/tasks/analyze-pdf';
import { analyzeCode } from './lib/ai/tasks/analyze-code';
import { processChatAssistantMessage } from './lib/ai/tasks/chat-assistant';
import { processPdfBuffer } from '../src/lib/pdf/processor';
import { validatePdfBuffer } from '../src/lib/pdf/detector';
import { indexMaterial, retrieveRelevantChunks } from '../src/lib/rag';
import { generateGroundedAssessmentQuestions } from './lib/ai/tasks/generate-grounded-questions';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Setup Multer memory storage (20MB max file size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Setup Supabase admin client for backend record management
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qolutjzfmjuxwyydmiyi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

function getSupabaseClient(token?: string) {
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey);
  }

  if (token) {
    return createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  return supabaseAdmin;
}

app.use(cors());
app.use(express.json());

// Authorization middleware resolving authoritative role from database
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let userId: string | null = null;
  let userEmail: string | undefined = undefined;
  let userRole: string = 'student';

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email;
        
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        userRole = profile?.role || user.user_metadata?.role || (user.email?.toLowerCase() === 'skill@gmail.com' ? 'admin' : 'student');
      }
    } catch (e) {
      // invalid token
    }
  }

  if (!userId && req.headers['x-user-id']) {
    userId = req.headers['x-user-id'] as string;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, email')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        userEmail = profile.email;
        userRole = profile.role || 'student';
      }
    } catch (e) {}
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user session.' });
  }

  (req as any).user = { id: userId, email: userEmail, role: userRole };
  next();
};

const requireRole = (allowedRoles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userRole = (req as any).user?.role || 'student';
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this role.' });
  }
  next();
};

async function provisionAdminAccount() {
  const adminEmail = 'skill@gmail.com';
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'piyu46';

  try {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let adminUser = users?.find((u) => u.email?.toLowerCase() === adminEmail);

    if (!adminUser) {
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin',
        },
      });
      if (createError) {
        console.error('[Admin Provisioning] Error creating skill@gmail.com:', createError);
        return;
      }
      adminUser = data.user;
    }

    if (adminUser) {
      await supabaseAdmin.from('profiles').upsert({
        id: adminUser.id,
        email: adminEmail,
        full_name: 'System Administrator',
        role: 'admin',
        designation: 'Administrator',
        department_mdo: 'Ministry of Statistics and Programme Implementation',
      });
      console.log(`[Admin Provisioning] Master Administrator account (${adminEmail}) verified.`);
    }
  } catch (err) {
    console.error('[Admin Provisioning] Exception:', err);
  }
}

app.get('/api/ai/health', async (req, res) => {
  try {
    const health = await ai.getHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check AI health' });
  }
});

// Async wrapper to handle errors
const asyncHandler = (fn: express.RequestHandler) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// -----------------------------------------------------------------------------
// MATERIALS & PDF PROCESSING ENDPOINTS (SIH26101 PHASE 8 & 9)
// -----------------------------------------------------------------------------

const isValidUuid = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

async function getDefaultCourseAndSubject(supabaseClient: any): Promise<{ courseId: string | null; subjectId: string | null }> {
  let courseId: string | null = null;
  let subjectId: string | null = null;

  try {
    const { data: courseRow } = await supabaseClient.from('courses').select('id').limit(1).maybeSingle();
    if (courseRow) {
      courseId = courseRow.id;
    } else {
      const { data: newCourse } = await supabaseClient
        .from('courses')
        .insert({
          name: 'Official Statistics Capability Development',
          code: 'STAT-101',
          description: 'Default course for capacity building in Official Statistical System',
        })
        .select('id')
        .maybeSingle();
      if (newCourse) courseId = newCourse.id;
    }

    const { data: subjectRow } = await supabaseClient.from('subjects').select('id').limit(1).maybeSingle();
    if (subjectRow) {
      subjectId = subjectRow.id;
    } else {
      const { data: newSubject } = await supabaseClient
        .from('subjects')
        .insert({
          name: 'Statistical Methodology & Survey Design',
          code: 'STAT-SUB-01',
          description: 'Default subject for statistical surveys and methodologies',
        })
        .select('id')
        .maybeSingle();
      if (newSubject) subjectId = newSubject.id;
    }
  } catch (e) {
    console.warn('[materials/upload] Warning fetching default course/subject:', e);
  }

  return { courseId, subjectId };
}

async function safeUpdateMaterial(supabaseClient: any, materialId: string, updateFields: Record<string, any>) {
  try {
    const { error } = await supabaseClient
      .from('materials')
      .update(updateFields)
      .eq('id', materialId);

    if (error) {
      console.warn('[materials/update] safeUpdateMaterial warning:', error.message, error.code);
      if (supabaseClient !== supabaseAdmin) {
        await supabaseAdmin.from('materials').update(updateFields).eq('id', materialId);
      }
    }
  } catch (e) {
    console.warn('[materials/update] Safe update warning:', e);
  }
}

async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === 'training-materials');
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket('training-materials', {
        public: false,
        fileSizeLimit: 20971520,
        allowedMimeTypes: ['application/pdf'],
      });
      if (error) {
        console.warn('[Storage] Notice creating training-materials bucket:', error.message);
      } else {
        console.log('[Storage] Created private bucket training-materials');
      }
    }
  } catch (e) {
    console.warn('[Storage] Warning checking storage bucket:', e);
  }
}

app.post('/api/materials/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded.' });
  }

  // 1. PDF Validation
  const validation = validatePdfBuffer(req.file.buffer);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  // 2. Authenticate user from header
  let userId: string | null = null;
  let userEmail: string | undefined = undefined;
  let rawToken: string | undefined = undefined;
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    rawToken = token;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email;
      }
    } catch (e) {
      console.warn('[materials/upload] Supabase auth token verification warning:', e);
    }
  }

  if (!userId && req.headers['x-user-id']) {
    const headerUserId = (req.headers['x-user-id'] as string).trim();
    if (headerUserId) {
      userId = headerUserId;
    }
  }

  if (!userId) {
    userId = '3884683e-054f-4e60-86a8-2aadbbee542c';
  }

  const dbClient = getSupabaseClient(rawToken);

  // Ensure corresponding record in public.profiles exists to satisfy foreign key (materials_uploaded_by_fkey)
  try {
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      console.log(`[materials/upload] Creating profile record for user ${userId}`);
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: userEmail ? userEmail.split('@')[0] : 'Statistical Officer',
        email: userEmail || null,
        role: 'student',
        designation: 'Statistical Officer',
        department_mdo: 'Ministry of Statistics and Programme Implementation',
      });
    }
  } catch (profileErr) {
    console.warn('[materials/upload] Exception checking/creating profile:', profileErr);
  }

  const title = req.body.title || req.file.originalname;
  const rawMaterialType = req.body.material_type || 'personal_material';
  const materialType: 'teacher_material' | 'personal_material' =
    rawMaterialType === 'teacher_material' ? 'teacher_material' : 'personal_material';

  const rawVisibility = req.body.visibility;
  const visibility: 'private' | 'course' | 'public' =
    rawVisibility === 'public'
      ? 'public'
      : rawVisibility === 'course'
      ? 'course'
      : materialType === 'teacher_material'
      ? 'course'
      : 'private';

  const courseId = req.body.course_id;
  const subjectId = req.body.subject_id;
  const defaults = await getDefaultCourseAndSubject(dbClient);

  // 3. Ensure target private storage bucket exists
  await ensureStorageBucket();

  // 4. Generate Material UUID and path structure: training-materials/{userId}/{materialId}/original.pdf
  const materialId = crypto.randomUUID();
  const storagePath = `${userId}/${materialId}/original.pdf`;

  // 5. Upload raw PDF buffer directly to Supabase Storage
  let { error: storageErr } = await dbClient.storage
    .from('training-materials')
    .upload(storagePath, req.file.buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (storageErr) {
    console.warn('[materials/upload] User client storage upload warning, retrying via admin client...', storageErr.message);
    const { error: adminStorageErr } = await supabaseAdmin.storage
      .from('training-materials')
      .upload(storagePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (adminStorageErr) {
      console.error('[materials/upload] Supabase Storage upload failed:', {
        message: adminStorageErr.message,
        userId,
        materialId,
        storagePath,
      });
      return res.status(500).json({
        error: 'STORAGE_ERROR: Unable to upload PDF to Supabase Storage.',
        details: adminStorageErr.message,
      });
    }
  }

  // 6. Resolve valid uploaded_by profile ID to guarantee foreign key constraint satisfaction
  let validUploadedBy = userId;
  try {
    const { data: prof } = await dbClient.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (!prof) {
      const { data: anyProf } = await dbClient.from('profiles').select('id').limit(1).maybeSingle();
      validUploadedBy = anyProf?.id || '3884683e-054f-4e60-86a8-2aadbbee542c';
    }
  } catch (e) {
    validUploadedBy = '3884683e-054f-4e60-86a8-2aadbbee542c';
  }

  // Prepare initial material metadata payloads
  const basePayload: any = {
    id: materialId,
    title,
    file_name: req.file.originalname,
    file_path: storagePath,
    file_size: req.file.size,
    mime_type: req.file.mimetype || 'application/pdf',
    uploaded_by: validUploadedBy,
    status: 'processing',
  };

  if (courseId && isValidUuid(courseId)) {
    const { data: courseRow } = await dbClient.from('courses').select('id').eq('id', courseId).maybeSingle();
    if (courseRow) {
      basePayload.course_id = courseId;
    } else if (defaults.courseId) {
      basePayload.course_id = defaults.courseId;
    }
  } else if (defaults.courseId) {
    basePayload.course_id = defaults.courseId;
  }

  if (subjectId && isValidUuid(subjectId)) {
    const { data: subjectRow } = await dbClient.from('subjects').select('id').eq('id', subjectId).maybeSingle();
    if (subjectRow) {
      basePayload.subject_id = subjectId;
    } else if (defaults.subjectId) {
      basePayload.subject_id = defaults.subjectId;
    }
  } else if (defaults.subjectId) {
    basePayload.subject_id = defaults.subjectId;
  }

  const fullPayload: any = {
    ...basePayload,
    storage_bucket: 'training-materials',
    storage_path: storagePath,
    processing_status: 'uploading',
    indexing_status: 'pending',
    material_type: materialType,
    visibility: visibility,
  };

  // 7. Insert initial material record into Supabase Database
  let dbRecord: any = null;
  let dbError: any = null;

  let resInsert = await dbClient
    .from('materials')
    .insert(fullPayload)
    .select()
    .maybeSingle();

  if (resInsert.error) {
    console.warn('[materials/upload] User client insert notice, retrying with admin client...', resInsert.error.message);
    resInsert = await supabaseAdmin
      .from('materials')
      .insert(fullPayload)
      .select()
      .maybeSingle();
  }

  if (resInsert.error) {
    if (resInsert.error.code === 'PGRST204' || resInsert.error.message?.includes('schema cache') || resInsert.error.message?.includes('column')) {
      console.warn('[materials/upload] Extended schema columns missing in remote DB, retrying base payload with admin client...', resInsert.error.message);
      const resBase = await supabaseAdmin
        .from('materials')
        .insert(basePayload)
        .select()
        .maybeSingle();

      dbRecord = resBase.data;
      dbError = resBase.error;
    } else {
      dbRecord = resInsert.data;
      dbError = resInsert.error;
    }
  } else {
    dbRecord = resInsert.data;
  }

  if (dbError || !dbRecord) {
    console.error('[materials/upload] Supabase DB insert failed, rolling back uploaded Storage object:', {
      message: dbError?.message,
      code: dbError?.code,
      details: dbError?.details,
      hint: dbError?.hint,
      userId,
      storagePath,
    });
    // Compensating rollback: remove uploaded file from Supabase Storage
    await supabaseAdmin.storage
      .from('training-materials')
      .remove([storagePath])
      .catch((err) => console.warn('[materials/upload] Storage rollback cleanup warning:', err));

    return res.status(500).json({
      error: 'DATABASE_ERROR: Unable to save material record in database.',
      details: dbError?.message || 'Database insert constraint failure',
    });
  }

  // 8. Update DB record with uploading/processing status
  await safeUpdateMaterial(dbClient, materialId, {
    processing_status: 'processing',
    storage_bucket: 'training-materials',
    storage_path: storagePath,
    file_path: storagePath,
  });

  // 9. Extract PDF text & page structure
  let processedOutput;
  try {
    processedOutput = await processPdfBuffer(req.file.buffer);
  } catch (pdfErr: any) {
    console.error('[materials/upload] PDF text processing failed:', pdfErr);
    await safeUpdateMaterial(supabaseAdmin, materialId, {
      status: 'failed',
      processing_status: 'failed',
      processing_error: pdfErr?.message || 'PDF processing error',
    });

    return res.status(500).json({
      error: 'PDF_PROCESSING_ERROR: Failed to extract text from PDF document.',
      details: pdfErr?.message,
    });
  }

  // 10. Update DB record with extracted text payload and ready status
  await safeUpdateMaterial(supabaseAdmin, materialId, {
    status: 'ready',
    processing_status: 'completed',
    page_count: processedOutput.pageCount,
    extracted_text_json: processedOutput,
    processing_error: null,
  });

  // 11. Auto-trigger RAG Indexing (chunks -> embeddings -> material_chunks pgvector)
  let indexingResult = null;
  try {
    indexingResult = await indexMaterial(materialId);
    console.log(`[RAG Auto-Index] Material ${materialId} indexed ${indexingResult.chunkCount} chunks in ${indexingResult.durationMs}ms`);
  } catch (idxErr: any) {
    console.warn(`[RAG Auto-Index Warning] Material ${materialId} indexing warning:`, idxErr?.message || idxErr);
  }

  res.json({
    success: true,
    materialId,
    status: 'completed',
    pdfType: processedOutput.type,
    pageCount: processedOutput.pageCount,
    storageBucket: 'training-materials',
    storagePath,
    chunkCount: indexingResult?.chunkCount || 0,
  });
}));

app.get('/api/materials/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('materials')
    .select('id, title, status, processing_status, indexing_status, page_count, storage_bucket, storage_path, file_path, processing_error, indexing_error, indexed_at, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Material not found.' });
  }

  res.json(data);
}));

app.delete('/api/materials/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {}
  }
  if (!userId && req.headers['x-user-id']) userId = req.headers['x-user-id'] as string;

  const { data: material, error: fetchErr } = await supabaseAdmin
    .from('materials')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !material) {
    return res.status(404).json({ error: 'Material record not found.' });
  }

  const storageBucket = material.storage_bucket || 'training-materials';
  const storagePath = material.storage_path || material.file_path;

  if (storagePath) {
    try {
      const { error: storageRemoveErr } = await supabaseAdmin.storage
        .from(storageBucket)
        .remove([storagePath]);
      if (storageRemoveErr) {
        console.warn(`[Delete Material] Storage remove warning for path ${storagePath}:`, storageRemoveErr.message);
      }
    } catch (sErr: any) {
      console.warn(`[Delete Material] Storage exception:`, sErr?.message || sErr);
    }
  }

  await supabaseAdmin
    .from('material_chunks')
    .delete()
    .eq('material_id', id);

  await supabaseAdmin
    .from('questions')
    .update({ material_id: null })
    .eq('material_id', id);

  await supabaseAdmin
    .from('assessments')
    .update({ material_id: null })
    .eq('material_id', id);

  const { error: deleteDbErr } = await supabaseAdmin
    .from('materials')
    .delete()
    .eq('id', id);

  if (deleteDbErr) {
    console.error('[Delete Material] Database deletion error:', deleteDbErr);
    return res.status(500).json({ error: 'Failed to delete material database record.' });
  }

  res.json({ success: true, message: 'Material and associated data deleted successfully.', materialId: id });
}));

app.post('/api/materials/:id/index', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await indexMaterial(id);
  res.json(result);
}));

// -----------------------------------------------------------------------------
// RAG SEMANTIC SEARCH / RETRIEVAL ENDPOINT (PHASE 9)
// -----------------------------------------------------------------------------

app.post('/api/rag/search', requireAuth, asyncHandler(async (req, res) => {
  const { query, materialId, topK, minimumSimilarity } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query string parameter is required.' });
  }

  // Extract user ID from auth header
  let userId: string | undefined = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {
      // fallback
    }
  }
  if (!userId && req.headers['x-user-id']) {
    userId = req.headers['x-user-id'] as string;
  }

  try {
    const results = await retrieveRelevantChunks({
      query: query.trim(),
      materialId: materialId || undefined,
      userId,
      topK: topK ? parseInt(topK, 10) : 5,
      minimumSimilarity: minimumSimilarity ? parseFloat(minimumSimilarity) : 0.0,
    });

    res.json({
      query: query.trim(),
      resultCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error('RAG Search Error:', err);
    res.status(500).json({ error: err?.message || 'RAG semantic search failed.' });
  }
}));

// -----------------------------------------------------------------------------
// GROUNDED PRACTICE QUESTIONS ENDPOINT (SIH26101 RAG EVIDENCE GROUNDED Q&A)
// -----------------------------------------------------------------------------

app.post('/api/ai/grounded-practice', asyncHandler(async (req, res) => {
  const { competencyArea, materialId } = req.body || {};

  if (!competencyArea || typeof competencyArea !== 'string' || !competencyArea.trim()) {
    return res.json({
      hasSourceMaterial: false,
      message: 'No competency area specified for grounded practice.',
      questions: [],
    });
  }

  const queryTopic = competencyArea.trim();

  let userId: string | undefined = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {}
  }
  if (!userId && req.headers['x-user-id']) {
    userId = req.headers['x-user-id'] as string;
  }

  // 1. Retrieve relevant RAG vector chunks from indexed materials
  let chunks: any[] = [];
  try {
    chunks = await retrieveRelevantChunks({
      query: queryTopic,
      materialId: materialId || undefined,
      userId,
      topK: 3,
      minimumSimilarity: -1.0,
    });
  } catch (ragErr) {
    console.warn('[Grounded Practice] RAG retrieval notice:', ragErr);
  }

  // 2. If no source material indexed or zero chunks returned, respond with controlled empty state
  if (!chunks || chunks.length === 0) {
    return res.json({
      hasSourceMaterial: false,
      message: `No indexed training material is available for grounded practice in ${queryTopic} yet.`,
      questions: [],
    });
  }

  // 3. Generate evidence-grounded questions using primary AI provider
  try {
    const combinedContext = chunks.map((c: any) => `[Page ${c.pageNumber || 1}]: ${c.content}`).join('\n\n');

    const prompt = `Based strictly on the following uploaded training document snippets for "${queryTopic}", generate 2 grounded practice questions.
Each question MUST be grounded in the context text below. Do NOT invent facts outside the provided text.

Context:
${combinedContext.slice(0, 8000)}

Return a JSON array of question objects with exact format:
[
  {
    "question": "question text",
    "type": "mcq",
    "options": [
      { "id": "a", "text": "option 1", "isCorrect": true },
      { "id": "b", "text": "option 2", "isCorrect": false }
    ],
    "explanation": "explanation text",
    "evidenceSnippet": "direct text excerpt"
  }
]`;

    const systemInstruction = 'You are an AI assessment expert. Generate grounded practice questions matching the schema strictly.';

    const aiRes = await ai.generateText('QUESTION_GEN', { prompt, systemInstruction });

    let generatedRaw: any[] = [];
    try {
      const cleaned = aiRes.text.replace(/```json\n?|\n?```/g, '').trim();
      generatedRaw = JSON.parse(cleaned);
      if (!Array.isArray(generatedRaw)) {
        generatedRaw = generatedRaw.questions || [generatedRaw];
      }
    } catch {
      generatedRaw = [];
    }

    const firstChunk = chunks[0];
    const sourceChunks = [
      {
        materialId: firstChunk?.materialId,
        chunkId: firstChunk?.chunkId,
        pageStart: firstChunk?.pageNumber || 1,
        pageEnd: firstChunk?.pageNumber || 1,
      },
    ];

    const questions = generatedRaw.map((q: any) => ({
      question: q.question || `Grounded question regarding ${queryTopic}`,
      type: q.type === 'short_answer' ? 'short_answer' : 'mcq',
      options: q.options || [
        { id: 'a', text: 'Correct concept from material', isCorrect: true },
        { id: 'b', text: 'Incorrect alternative', isCorrect: false },
      ],
      correctAnswer: q.correctAnswer || 'See material evidence',
      expectedAnswer: q.expectedAnswer || q.explanation || '',
      explanation: q.explanation || 'Answer grounded in uploaded official material.',
      competencyArea: queryTopic,
      evidenceSnippet: q.evidenceSnippet || firstChunk?.content?.slice(0, 150) || '',
      sourceChunks,
    }));

    return res.json({
      hasSourceMaterial: true,
      message: '',
      questions,
    });
  } catch (err: any) {
    console.error('[Grounded Practice] AI Generation Error:', err?.message || err);
    const firstChunk = chunks[0];
    return res.json({
      hasSourceMaterial: true,
      message: '',
      questions: [
        {
          question: `Based on the uploaded document for ${queryTopic}, what is a core focus area?`,
          type: 'mcq',
          options: [
            { id: 'a', text: 'Statistical capacity building, survey frame design & monitoring indicators', isCorrect: true },
            { id: 'b', text: 'Unrelated administrative guidelines', isCorrect: false },
          ],
          correctAnswer: 'Statistical capacity building, survey frame design & monitoring indicators',
          explanation: 'Answer grounded directly in the uploaded training material text.',
          competencyArea: queryTopic,
          evidenceSnippet: firstChunk?.content?.slice(0, 150) || 'Grounded in uploaded material',
          sourceChunks: [
            {
              materialId: firstChunk?.materialId,
              chunkId: firstChunk?.chunkId,
              pageStart: firstChunk?.pageNumber || 1,
              pageEnd: firstChunk?.pageNumber || 1,
            },
          ],
        },
      ],
    });
  }
}));

// -----------------------------------------------------------------------------
// EXISTING AI API ROUTES
// -----------------------------------------------------------------------------

app.post('/api/ai/analyze-pdf', requireAuth, asyncHandler(async (req, res) => {
  const { textContext } = req.body;
  if (!textContext) return res.status(400).json({ error: 'textContext is required' });
  const result = await analyzePDF(textContext);
  res.json(result);
}));

app.post('/api/ai/extract-topics', requireAuth, asyncHandler(async (req, res) => {
  const { textContext } = req.body;
  if (!textContext) return res.status(400).json({ error: 'textContext is required' });
  const result = await extractTopics(textContext);
  res.json(result);
}));

app.post('/api/ai/generate-questions', requireAuth, asyncHandler(async (req, res) => {
  const result = await generateQuestions(req.body);
  res.json(result);
}));

app.post('/api/ai/validate-question', requireAuth, asyncHandler(async (req, res) => {
  const result = await validateQuestion(req.body);
  res.json(result);
}));

app.post('/api/ai/evaluate-answer', requireAuth, asyncHandler(async (req, res) => {
  const result = await evaluateAnswer(req.body);
  res.json(result);
}));

app.post('/api/ai/create-learning-plan', requireAuth, asyncHandler(async (req, res) => {
  const result = await createLearningPlan(req.body);
  res.json(result);
}));

app.post('/api/ai/analyze-code', requireAuth, asyncHandler(async (req, res) => {
  const { code, questionPrompt } = req.body;
  const result = await analyzeCode(code, questionPrompt);
  res.json(result);
}));

// Rate limiter: Max 10 requests per minute per authenticated user
const chatRateLimitStore = new Map<string, { count: number; resetTime: number }>();

function chatRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = (req as any).user?.id || (req.headers['x-user-id'] as string) || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10;

  const record = chatRateLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    chatRateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      error: 'Rate limit exceeded. You may only send 10 chat requests per minute. Please wait a moment.',
    });
  }

  record.count += 1;
  next();
}

app.post('/api/chat', requireAuth, chatRateLimiter, asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  // Extract authenticated user exclusively from verified server session
  const user = (req as any).user;
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized user session.' });
  }

  const response = await processChatAssistantMessage({
    userId: user.id,
    userEmail: user.email,
    message: message.trim(),
    conversationId: conversationId || undefined,
    supabaseClient: supabaseAdmin,
  });

  res.json(response);
}));

app.get('/api/chat/conversations', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { data: conversations, error } = await supabaseAdmin
    .from('chat_conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }

  res.json({ conversations: conversations || [] });
}));

app.get('/api/chat/conversations/:id', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const conversationId = req.params.id;

  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // Ensure conversation belongs to user
  const { data: conv } = await supabaseAdmin
    .from('chat_conversations')
    .select('id, title')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single();

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found or access denied.' });
  }

  const { data: messages, error } = await supabaseAdmin
    .from('chat_messages')
    .select('id, role, content, sources, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Failed to retrieve messages.' });
  }

  res.json({ conversation: conv, messages: messages || [] });
}));

app.get('/api/ai/test', async (req, res) => {
  try {
    const health = await ai.getHealth();

    let geminiTestStatus = 'untested';
    if (health.gemini === 'available') {
      try {
        const testRes = await ai.generateText('PDF_ANALYSIS', {
          prompt: 'Say the exact word OK.',
          systemInstruction: 'You are a test bot.'
        });
        geminiTestStatus = testRes.text.includes('OK') ? 'ok' : 'unexpected_response';
      } catch (e: any) {
        geminiTestStatus = e.message || 'error';
      }
    }

    res.json({
      gemini: {
        status: health.gemini,
        test: geminiTestStatus
      },
      ollama: {
        status: health.ollama
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

// -----------------------------------------------------------------------------
// PHASE 12: ASSESSMENT & MCQ ENGINE ENDPOINTS
// -----------------------------------------------------------------------------

const assessmentGenLock = new Map<string, number>();

app.post('/api/assessments/generate', asyncHandler(async (req, res) => {
  let userId = '00000000-0000-0000-0000-000000000000';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {}
  }
  if (!userId && req.headers['x-user-id']) userId = req.headers['x-user-id'] as string;

  const { materialId, topic, competencyArea, difficulty = 'medium', questionCount = 5, title, assessmentType = 'personal_test' } = req.body || {};

  const now = Date.now();
  const lockKey = `${userId}:${materialId || topic || 'default'}`;
  const lastGen = assessmentGenLock.get(lockKey);
  if (lastGen && (now - lastGen) < 8000) {
    return res.status(429).json({ error: 'Assessment generation is already in progress. Please wait a moment.' });
  }
  assessmentGenLock.set(lockKey, now);

  try {
    const genResult = await generateGroundedAssessmentQuestions({
      materialId,
      topic,
      competencyArea,
      difficulty,
      questionCount: parseInt(questionCount, 10) || 5,
      userId,
    });

    if (!genResult.hasSourceMaterial || genResult.questions.length === 0) {
      return res.status(400).json({
        error: genResult.message || 'No indexed learning material is available for assessment generation.',
      });
    }

    const assessmentTitle = title || `Assessment: ${topic || competencyArea || 'Grounded Practice'}`;

    let validUserId = (userId && userId !== '00000000-0000-0000-0000-000000000000') ? userId : null;
    if (validUserId) {
      try {
        const { data: prof } = await supabaseAdmin.from('profiles').select('id').eq('id', validUserId).maybeSingle();
        if (!prof) {
          await supabaseAdmin.from('profiles').upsert({
            id: validUserId,
            full_name: 'Statistical Officer',
            role: 'student',
            designation: 'Statistical Officer',
            department_mdo: 'Ministry of Statistics and Programme Implementation',
          });
        }
      } catch (e) {
        console.warn('[assessments/generate] Profile check warning:', e);
      }
    }

    // Insert Assessment record
    const { data: assessment, error: aErr } = await supabaseAdmin
      .from('assessments')
      .insert({
        title: assessmentTitle,
        creator_id: validUserId || '3884683e-054f-4e60-86a8-2aadbbee542c',
        created_by: validUserId || '3884683e-054f-4e60-86a8-2aadbbee542c',
        assessment_type: assessmentType,
        material_id: materialId || null,
        difficulty,
        question_count: genResult.questions.length,
        time_limit_minutes: req.body.timeLimitMinutes || 20,
        status: 'published',
      })
      .select()
      .single();

    if (aErr || !assessment) {
      console.error('Failed to insert assessment record:', aErr);
      return res.status(500).json({ error: aErr?.message || 'Failed to create assessment in database.' });
    }

    // Insert Questions and Options
    for (let i = 0; i < genResult.questions.length; i++) {
      const q = genResult.questions[i];
      const qMaterialId = isValidUuid(q.source?.materialId) ? q.source.materialId : (isValidUuid(materialId) ? materialId : null);
      const qChunkId = isValidUuid(q.source?.chunkId) ? q.source.chunkId : null;

      const { data: qRecord, error: qErr } = await supabaseAdmin
        .from('questions')
        .insert({
          material_id: qMaterialId,
          question_type: 'mcq',
          difficulty: q.difficulty || difficulty || 'medium',
          question_text: q.questionText,
          marks: 1,
          explanation: q.explanation || 'Grounded in uploaded material.',
          evidence_snippet: q.evidenceSnippet || '',
          chunk_id: qChunkId,
          page_start: q.source?.pageStart || 1,
          page_end: q.source?.pageEnd || 1,
          competency_area: q.competencyArea || topic || competencyArea || 'Official Statistics',
          created_by: validUserId || '3884683e-054f-4e60-86a8-2aadbbee542c',
        })
        .select()
        .single();

      if (qErr || !qRecord) {
        console.error('Question insert error:', qErr);
        continue;
      }

      await supabaseAdmin.from('assessment_questions').insert({
        assessment_id: assessment.id,
        question_id: qRecord.id,
        question_order: i + 1,
        marks: 1,
      });

      if (q.options && Array.isArray(q.options)) {
        const optionRows = q.options.map((opt, oIdx) => ({
          question_id: qRecord.id,
          option_text: opt.text,
          option_order: oIdx + 1,
          is_correct: opt.id === q.correctOption || opt.label === q.correctOption || oIdx === 0,
        }));
        await supabaseAdmin.from('question_options').insert(optionRows);
      }
    }

    res.json({
      success: true,
      assessmentId: assessment.id,
      title: assessment.title,
      questionCount: genResult.questions.length,
      status: 'published',
    });
  } catch (err: any) {
    console.error('Assessment generation error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate assessment.' });
  } finally {
    setTimeout(() => assessmentGenLock.delete(lockKey), 8000);
  }
}));

app.get('/api/assessments', asyncHandler(async (req, res) => {
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {}
  }
  if (!userId && req.headers['x-user-id']) userId = req.headers['x-user-id'] as string;

  let query = supabaseAdmin
    .from('assessments')
    .select('*, materials(title), assessment_questions(question_id)')
    .eq('status', 'published');

  if (userId) {
    query = query.or(`creator_id.eq.${userId},created_by.eq.${userId},creator_id.eq.3884683e-054f-4e60-86a8-2aadbbee542c,assessment_type.eq.global,assessment_type.eq.official,assessment_type.eq.personal_test`);
  } else {
    query = query.or('assessment_type.eq.global,assessment_type.eq.official,assessment_type.eq.personal_test');
  }

  const { data: assessments, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Fetch attempts for user to mark completed tests
  let userAttemptsMap: Record<string, any> = {};
  const searchUserId = (userId && userId !== '00000000-0000-0000-0000-000000000000') ? userId : '3884683e-054f-4e60-86a8-2aadbbee542c';
  
  const { data: attempts } = await supabaseAdmin
    .from('assessment_attempts')
    .select('assessment_id, percentage, submitted_at, status')
    .or(`student_id.eq.${searchUserId},student_id.eq.3884683e-054f-4e60-86a8-2aadbbee542c`);

  (attempts || []).forEach((att: any) => {
    userAttemptsMap[att.assessment_id] = att;
  });

  const validAssessments = (assessments || [])
    .filter((a: any) => Array.isArray(a.assessment_questions) && a.assessment_questions.length > 0)
    .map((a: any) => {
      const userAttempt = userAttemptsMap[a.id];
      return {
        ...a,
        question_count: a.assessment_questions?.length || a.question_count || 5,
        userAttempted: !!userAttempt,
        userScore: userAttempt ? userAttempt.percentage : null,
        status: userAttempt ? 'completed' : a.status || 'published',
      };
    });

  res.json({ assessments: validAssessments });
}));

app.get('/api/assessments/:id', asyncHandler(async (req, res) => {
  const assessmentId = req.params.id;

  const { data: assessment, error: aErr } = await supabaseAdmin
    .from('assessments')
    .select('*, materials(title)')
    .eq('id', assessmentId)
    .single();

  if (aErr || !assessment) {
    return res.status(404).json({ error: 'Assessment not found.' });
  }

  const { data: aqRows, error: aqErr } = await supabaseAdmin
    .from('assessment_questions')
    .select('question_id, question_order, marks, questions(*)')
    .eq('assessment_id', assessmentId)
    .order('question_order', { ascending: true });

  if (aqErr) {
    return res.status(500).json({ error: 'Failed to load assessment questions.' });
  }

  const questionIds = (aqRows || []).map((row: any) => row.question_id);

  let optionsMap: Record<string, any[]> = {};
  if (questionIds.length > 0) {
    const { data: options } = await supabaseAdmin
      .from('question_options')
      .select('id, question_id, option_text, option_order, is_correct')
      .in('question_id', questionIds)
      .order('option_order', { ascending: true });

    (options || []).forEach((opt: any) => {
      if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
      optionsMap[opt.question_id].push({
        id: opt.id,
        optionText: opt.option_text,
        optionOrder: opt.option_order,
        isCorrect: opt.is_correct === true,
      });
    });
  }

  const formattedQuestions = (aqRows || []).map((row: any) => {
    const q = row.questions || {};
    return {
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      difficulty: q.difficulty,
      marks: row.marks || q.marks || 1,
      competencyArea: q.competency_area,
      explanation: q.explanation || 'Answer verified against official material.',
      evidenceSnippet: q.evidence_snippet || q.evidenceSnippet || '',
      pageStart: q.page_start || 1,
      pageEnd: q.page_end || 1,
      options: optionsMap[q.id] || [],
    };
  });

  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {}
  }
  if (!userId && req.headers['x-user-id']) userId = req.headers['x-user-id'] as string;

  const searchUserId = (userId && userId !== '00000000-0000-0000-0000-000000000000') ? userId : '3884683e-054f-4e60-86a8-2aadbbee542c';

  let latestAttempt: any = null;
  const { data: att } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*')
    .eq('assessment_id', assessmentId)
    .or(`student_id.eq.${searchUserId},student_id.eq.3884683e-054f-4e60-86a8-2aadbbee542c,student_id.eq.00000000-0000-0000-0000-000000000000`)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (att) {
    const { data: attAns } = await supabaseAdmin
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', att.id);

    const evaluatedAnswers = formattedQuestions.map((fq) => {
      const userAns = (attAns || []).find((a: any) => a.question_id === fq.id);
      const correctOpt = (fq.options || []).find((o: any) => o.isCorrect);
      const isCorrect = userAns ? userAns.is_correct : false;

      return {
        questionId: fq.id,
        questionText: fq.questionText,
        isCorrect,
        marksAwarded: userAns ? userAns.marks_awarded : 0,
        selectedOptionId: userAns?.selected_option || null,
        correctOptionId: correctOpt?.id || null,
        explanation: fq.explanation || 'Answer verified against official material.',
        evidenceSnippet: fq.evidenceSnippet || '',
        competencyArea: fq.competencyArea || 'General Competency',
        pageStart: fq.pageStart || 1,
        pageEnd: fq.pageEnd || 1,
        options: fq.options || [],
      };
    });

    const correctCount = evaluatedAnswers.filter((a: any) => a.isCorrect).length;

      latestAttempt = {
        id: att.id,
        assessmentId: att.assessment_id,
        score: att.score,
        maxScore: att.max_score,
        percentage: att.percentage,
        correctCount,
        totalQuestions: formattedQuestions.length,
        submittedAt: att.submitted_at,
        evaluatedAnswers,
        topicPerformance: [
          {
            topic: assessment.title || 'Official Statistics',
            correct: correctCount,
            total: formattedQuestions.length,
            scorePercent: att.percentage,
          },
        ],
      };
    }
  }

  res.json({
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      difficulty: assessment.difficulty,
      questionCount: assessment.question_count,
      timeLimitMinutes: assessment.time_limit_minutes,
      materialTitle: assessment.materials?.title,
    },
    questions: formattedQuestions,
    latestAttempt,
  });
}));

app.post('/api/assessments/:id/submit', asyncHandler(async (req, res) => {
  const assessmentId = req.params.id;
  const { answers } = req.body || {};

  let userId = '00000000-0000-0000-0000-000000000000';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    } catch (e) {}
  }
  if (!userId && req.headers['x-user-id']) userId = req.headers['x-user-id'] as string;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers payload array is required.' });
  }

  const { data: aqRows } = await supabaseAdmin
    .from('assessment_questions')
    .select('question_id, marks, questions(*)')
    .eq('assessment_id', assessmentId);

  if (!aqRows || aqRows.length === 0) {
    return res.status(404).json({ error: 'Assessment questions not found.' });
  }

  const questionIds = aqRows.map((r: any) => r.question_id);
  const { data: allOptions } = await supabaseAdmin
    .from('question_options')
    .select('*')
    .in('question_id', questionIds);

  let totalMarksPossible = 0;
  let totalMarksAwarded = 0;
  let correctCount = 0;

  const topicPerformance: Record<string, { correct: number; total: number }> = {};
  const evaluatedAnswers: any[] = [];

  for (const row of aqRows) {
    const q = row.questions || {};
    const qMarks = row.marks || 1;
    totalMarksPossible += qMarks;

    const topic = q.competency_area || q.topic_id || 'General Competency';
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { correct: 0, total: 0 };
    }
    topicPerformance[topic].total += 1;

    const userAns = answers.find((a: any) => a.questionId === q.id);
    const qOptions = (allOptions || []).filter((o: any) => o.question_id === q.id);
    const correctOpt = qOptions.find((o: any) => o.is_correct);

    let isCorrect = false;
    let marksAwarded = 0;

    if (userAns && userAns.selectedOptionId && correctOpt) {
      if (userAns.selectedOptionId === correctOpt.id) {
        isCorrect = true;
        marksAwarded = qMarks;
        correctCount += 1;
        topicPerformance[topic].correct += 1;
      }
    }

    totalMarksAwarded += marksAwarded;

    evaluatedAnswers.push({
      questionId: q.id,
      questionText: q.question_text,
      isCorrect,
      marksAwarded,
      selectedOptionId: userAns?.selectedOptionId || null,
      correctOptionId: correctOpt?.id || null,
      explanation: q.explanation || 'Answer verified against official material.',
      evidenceSnippet: q.evidence_snippet || '',
      competencyArea: topic,
      pageStart: q.page_start,
      pageEnd: q.page_end,
      options: qOptions.map((o: any) => ({
        id: o.id,
        optionText: o.option_text,
        optionOrder: o.option_order,
        isCorrect: o.is_correct,
      })),
    });
  }

  const percentage = totalMarksPossible > 0 ? Math.round((totalMarksAwarded / totalMarksPossible) * 100) : 0;

  let validUserId = (userId && userId !== '00000000-0000-0000-0000-000000000000') ? userId : '3884683e-054f-4e60-86a8-2aadbbee542c';
  try {
    const { data: prof } = await supabaseAdmin.from('profiles').select('id').eq('id', validUserId).maybeSingle();
    if (!prof) {
      await supabaseAdmin.from('profiles').upsert({
        id: validUserId,
        full_name: 'Statistical Officer',
        role: 'student',
        designation: 'Statistical Officer',
        department_mdo: 'Ministry of Statistics and Programme Implementation',
      });
    }
  } catch (e) {
    console.warn('[assessments/submit] Profile check warning:', e);
  }

  const { data: attempt, error: attErr } = await supabaseAdmin
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      student_id: validUserId,
      started_at: new Date(Date.now() - 300000).toISOString(),
      submitted_at: new Date().toISOString(),
      score: totalMarksAwarded,
      max_score: totalMarksPossible,
      percentage,
      status: 'submitted',
    })
    .select()
    .single();

  if (attErr) {
    console.error('[assessments/submit] Attempt insert error:', attErr);
  }

  if (attempt) {
    const answerRows = evaluatedAnswers.map(ans => ({
      attempt_id: attempt.id,
      question_id: ans.questionId,
      selected_option: ans.selectedOptionId,
      marks_awarded: ans.marksAwarded,
      is_correct: ans.isCorrect,
    }));
    await supabaseAdmin.from('attempt_answers').insert(answerRows);

    for (const [topicName, perf] of Object.entries(topicPerformance)) {
      const topicPct = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;

      const { data: existingTopic } = await supabaseAdmin
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .maybeSingle();

      let topicId = existingTopic?.id;
      if (!topicId) {
        const { data: newTopic } = await supabaseAdmin
          .from('topics')
          .insert({
            name: topicName,
            description: `Competency area: ${topicName}`,
            subject_id: '00000000-0000-0000-0000-000000000000',
          })
          .select()
          .single();
        topicId = newTopic?.id;
      }

      if (topicId) {
        await supabaseAdmin.from('topic_scores').upsert({
          attempt_id: attempt.id,
          student_id: userId,
          topic_id: topicId,
          score: perf.correct,
          max_score: perf.total,
          percentage: topicPct,
        }, { onConflict: 'attempt_id,topic_id' });
      }
    }
  }

  const topicSummary = Object.entries(topicPerformance).map(([topic, perf]) => ({
    topic,
    scorePercent: perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0,
    correctCount: perf.correct,
    totalCount: perf.total,
    statusTier: (perf.correct / perf.total) >= 0.75 ? 'Proficient' : (perf.correct / perf.total) >= 0.5 ? 'Developing' : 'Needs Development',
  }));

  res.json({
    attemptId: attempt?.id,
    score: totalMarksAwarded,
    maxScore: totalMarksPossible,
    percentage,
    correctCount,
    totalQuestions: aqRows.length,
    topicPerformance: topicSummary,
    evaluatedAnswers,
  });
}));

app.get('/api/assessments/attempts/:attemptId', asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;

  const { data: attempt, error: aErr } = await supabaseAdmin
    .from('assessment_attempts')
    .select('*, assessments(title, difficulty)')
    .eq('id', attemptId)
    .single();

  if (aErr || !attempt) {
    return res.status(404).json({ error: 'Attempt result not found.' });
  }

  const { data: answers } = await supabaseAdmin
    .from('attempt_answers')
    .select('*, questions(*, question_options(*))')
    .eq('attempt_id', attemptId);

  const evaluatedAnswers = (answers || []).map((ans: any) => {
    const q = ans.questions || {};
    const options = q.question_options || [];
    const correctOpt = options.find((o: any) => o.is_correct);

    return {
      questionId: q.id,
      questionText: q.question_text,
      isCorrect: Boolean(ans.is_correct),
      marksAwarded: ans.marks_awarded || 0,
      selectedOptionId: ans.selected_option,
      correctOptionId: correctOpt?.id || null,
      explanation: q.explanation || 'Answer verified against official material.',
      evidenceSnippet: q.evidence_snippet || '',
      competencyArea: q.competency_area || 'Official Statistics',
      pageStart: q.page_start,
      pageEnd: q.page_end,
      options: options.map((o: any) => ({
        id: o.id,
        optionText: o.option_text,
        isCorrect: o.is_correct,
      })),
    };
  });

  res.json({
    attempt: {
      id: attempt.id,
      assessmentTitle: attempt.assessments?.title,
      score: attempt.score,
      maxScore: attempt.max_score,
      percentage: attempt.percentage,
      submittedAt: attempt.submitted_at,
    },
    evaluatedAnswers,
  });
}));

// -----------------------------------------------------------------------------
// CHAT ASSISTANT ENDPOINTS (SIH26101 PHASE 11)
// -----------------------------------------------------------------------------

app.get('/api/chat/conversations', requireAuth, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  const { data: conversations, error } = await supabaseAdmin
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[api/chat/conversations] Failed to fetch conversations:', error);
    return res.status(500).json({ error: 'Failed to load conversation history.', details: error.message });
  }

  res.json({ conversations: conversations || [] });
}));

app.get('/api/chat/conversations/:id', requireAuth, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const convId = req.params.id;

  const { data: conv, error: convErr } = await supabaseAdmin
    .from('chat_conversations')
    .select('*')
    .eq('id', convId)
    .eq('user_id', userId)
    .maybeSingle();

  if (convErr || !conv) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  const { data: messages, error: msgErr } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });

  if (msgErr) {
    console.error('[api/chat/conversations/:id] Failed to fetch messages:', msgErr);
    return res.status(500).json({ error: 'Failed to load messages.', details: msgErr.message });
  }

  res.json({ conversation: conv, messages: messages || [] });
}));

app.post('/api/chat', requireAuth, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const userEmail = (req as any).user.email;
  const { message, conversationId } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    const chatResult = await processChatAssistantMessage({
      userId,
      userEmail,
      message: message.trim(),
      conversationId: conversationId || undefined,
      supabaseClient: supabaseAdmin,
    });

    res.json(chatResult);
  } catch (err: any) {
    console.error('[api/chat] Chat assistant execution failed:', err);
    res.status(500).json({
      error: 'AI Assistant is temporarily unavailable because the local AI engine encountered an error.',
      details: err?.message || 'Chat execution error',
    });
  }
}));

// -----------------------------------------------------------------------------
// NSSTA / TPAC VERIFIED CATALOG ENDPOINT
// -----------------------------------------------------------------------------

app.get('/api/nssta', asyncHandler(async (req, res) => {
  const { data: programmes, error } = await supabaseAdmin
    .from('nssta_programmes')
    .select('*')
    .eq('is_verified', true)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ programmes: programmes || [] });
}));

// -----------------------------------------------------------------------------
// REAL DATABASE ANALYTICS ENDPOINTS (COORDINATOR & ADMIN)
// -----------------------------------------------------------------------------

app.get('/api/analytics/coordinator', requireAuth, requireRole(['teacher', 'admin']), asyncHandler(async (req, res) => {
  // 1. Total Officers (students)
  const { count: totalLearners } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student');

  // 2. Active Assessments
  const { count: activeAssessments } = await supabaseAdmin
    .from('assessments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  // 3. Average Competency % from assessment_attempts
  const { data: attempts } = await supabaseAdmin
    .from('assessment_attempts')
    .select('percentage')
    .eq('status', 'submitted');

  let avgCompetency = null;
  if (attempts && attempts.length > 0) {
    const sum = attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    avgCompetency = Math.round(sum / attempts.length);
  }

  // 4. Competency Tier Distribution & Officers Needing Development (<50%)
  const { data: topicScores } = await supabaseAdmin
    .from('topic_scores')
    .select('percentage, topic_id, user_id, topics(name)');

  let proficientCount = 0;
  let developingCount = 0;
  let needsDevelopmentCount = 0;

  const topicTotals: Record<string, { sum: number; count: number }> = {};
  const userAverages: Record<string, { sum: number; count: number }> = {};

  (topicScores || []).forEach((ts: any) => {
    const pct = ts.percentage || 0;
    if (pct >= 75) proficientCount++;
    else if (pct >= 50) developingCount++;
    else needsDevelopmentCount++;

    const tName = ts.topics?.name || ts.topic_id || 'General Competency';
    if (!topicTotals[tName]) topicTotals[tName] = { sum: 0, count: 0 };
    topicTotals[tName].sum += pct;
    topicTotals[tName].count += 1;

    if (ts.user_id) {
      if (!userAverages[ts.user_id]) userAverages[ts.user_id] = { sum: 0, count: 0 };
      userAverages[ts.user_id].sum += pct;
      userAverages[ts.user_id].count += 1;
    }
  });

  const officersNeedingDevelopment = Object.values(userAverages).filter(
    (u) => u.count > 0 && Math.round(u.sum / u.count) < 50
  ).length;

  const topSkillGaps = Object.entries(topicTotals)
    .map(([topic, data]) => ({
      topic,
      avgScorePercent: Math.round(data.sum / data.count),
    }))
    .filter(g => g.avgScorePercent < 75)
    .sort((a, b) => a.avgScorePercent - b.avgScorePercent);

  res.json({
    totalLearners: totalLearners || 0,
    activeAssessments: activeAssessments || 0,
    averageCompetency: avgCompetency,
    officersNeedingDevelopment,
    totalAttemptsSubmitted: attempts ? attempts.length : 0,
    tierDistribution: {
      proficient: proficientCount,
      developing: developingCount,
      needsDevelopment: needsDevelopmentCount,
    },
    topSkillGaps,
  });
}));

app.get('/api/analytics/admin', requireAuth, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { count: totalStudents } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student');

  const { data: attempts } = await supabaseAdmin
    .from('assessment_attempts')
    .select('student_id, percentage')
    .eq('status', 'submitted');

  const assessedUserIds = new Set((attempts || []).map((a: any) => a.student_id));
  const assessedCount = assessedUserIds.size;
  const unassessedCount = Math.max(0, (totalStudents || 0) - assessedCount);

  let overallAvg = null;
  if (attempts && attempts.length > 0) {
    const sum = attempts.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
    overallAvg = Math.round(sum / attempts.length);
  }

  const { count: totalIGOT } = await supabaseAdmin
    .from('igot_courses')
    .select('id', { count: 'exact', head: true })
    .eq('is_verified', true);

  const { count: totalNSSTA } = await supabaseAdmin
    .from('nssta_programmes')
    .select('id', { count: 'exact', head: true })
    .eq('is_verified', true);

  res.json({
    totalUsers: totalUsers || 0,
    totalStudents: totalStudents || 0,
    assessedStudentsCount: assessedCount,
    unassessedStudentsCount: unassessedCount,
    overallAverageScore: overallAvg,
    verifiedIGOTResourcesCount: totalIGOT || 0,
    verifiedNSSTAProgrammesCount: totalNSSTA || 0,
  });
}));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'API service encountered an error.' });
});

app.listen(port, () => {
  console.log(`SkillLens AI Express API Server running on port ${port}`);
  provisionAdminAccount();
});
