import { z } from 'zod';
import { ai } from '../orchestrator/router';
import { OllamaProvider } from '../providers/ollama';
import { retrieveRelevantChunks } from '../../../../src/lib/rag';
import { chunkExtractedPdf } from '../../../../src/lib/rag/chunker';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(supabaseUrl, supabaseKey);
}

export const MCQOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string(),
});

export const GroundedQuestionSchema = z.object({
  questionText: z.string(),
  questionType: z.literal('mcq'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  competencyArea: z.string(),
  topic: z.string(),
  options: z.array(MCQOptionSchema).length(4),
  correctOption: z.string(),
  explanation: z.string(),
  evidenceSnippet: z.string(),
  source: z.object({
    materialId: z.string().optional(),
    chunkId: z.string().optional(),
    pageStart: z.number(),
    pageEnd: z.number(),
  }),
});

export type GroundedQuestionInput = z.infer<typeof GroundedQuestionSchema>;

export const OllamaValidationSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.string()).default([]),
  confidence: z.number().default(0.9),
});

export type OllamaValidationResult = z.infer<typeof OllamaValidationSchema>;

export interface GenerateAssessmentParams {
  materialId?: string;
  topic?: string;
  competencyArea?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number;
  userId?: string;
}

/**
 * Algorithmic Quality Guard for MCQ questions
 */
export function validateQuestionQuality(q: GroundedQuestionInput): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!q.questionText || q.questionText.trim().length < 10) {
    issues.push('Question text is too short or ambiguous');
  }

  if (!q.options || q.options.length !== 4) {
    issues.push('Question must have exactly 4 options');
  } else {
    const texts = q.options.map(o => o.text.trim().toLowerCase());
    const unique = new Set(texts);
    if (unique.size !== 4) {
      issues.push('Question options contain duplicate choices');
    }
  }

  const validCorrect = q.options.some(o => o.id === q.correctOption || o.label === q.correctOption);
  if (!validCorrect) {
    issues.push('Specified correct option does not match any choice ID');
  }

  if (!q.explanation || q.explanation.trim().length < 5) {
    issues.push('Explanation is missing or too vague');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate candidate question with local Ollama qwen3:4b
 */
export async function validateWithOllama(
  q: GroundedQuestionInput,
  evidenceText: string
): Promise<OllamaValidationResult> {
  const ollama = new OllamaProvider();
  
  // Check if Ollama is accessible
  const available = await ollama.isAvailable();
  if (!available) {
    // If Ollama is offline, fallback cleanly to algorithmic quality check
    const algoCheck = validateQuestionQuality(q);
    return {
      valid: algoCheck.valid,
      issues: algoCheck.issues,
      confidence: algoCheck.valid ? 0.95 : 0.4,
    };
  }

  const prompt = `Validate the following generated multiple choice question (MCQ) against the provided evidence chunk.

Evidence Context:
"${evidenceText.slice(0, 2000)}"

Question to Validate:
- Question: ${q.questionText}
- Options:
  A: ${q.options[0]?.text}
  B: ${q.options[1]?.text}
  C: ${q.options[2]?.text}
  D: ${q.options[3]?.text}
- Correct Answer Option: ${q.correctOption}
- Explanation: ${q.explanation}

Validation Requirements:
1. Is the correct option factually supported by the evidence context?
2. Are all 4 options distinct without duplicate wording?
3. Is the question free of ambiguity?
4. Is the explanation accurate and aligned with the evidence?

Output ONLY raw JSON format:
{
  "valid": true,
  "issues": [],
  "confidence": 0.95
}`;

  try {
    const response = await ollama.generateStructured(
      { prompt, temperature: 0.1 },
      OllamaValidationSchema,
      'OllamaValidationResult',
      'Validation result from qwen3:4b'
    );
    return response.data;
  } catch (err: any) {
    console.warn('[Ollama Validation Warning]:', err?.message || err);
    // Fallback to strict quality rules if Ollama output parsing fails
    const algoCheck = validateQuestionQuality(q);
    return {
      valid: algoCheck.valid,
      issues: algoCheck.issues,
      confidence: algoCheck.valid ? 0.9 : 0.5,
    };
  }
}

export function generateAlgorithmicGroundedQuestions(
  chunks: any[],
  targetCount: number,
  params: GenerateAssessmentParams
): GroundedQuestionInput[] {
  const questions: GroundedQuestionInput[] = [];

  for (let i = 0; i < chunks.length && questions.length < targetCount; i++) {
    const chunk = chunks[i];
    const text = chunk.content || '';
    if (text.length < 30) continue;

    const lines = text
      .split(/\n|\.\s+/)
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 20 && l.length < 200);

    for (const line of lines) {
      if (questions.length >= targetCount) break;

      let qText = '';
      let correctAns = '';

      if (line.includes(' is ') || line.includes(':') || line.includes(' means ')) {
        const parts = line.split(/ is |: | means /);
        if (parts.length >= 2 && parts[0].length > 4 && parts[1].length > 10) {
          const subject = parts[0].replace(/^[•\-\d\.]+\s*/, '').trim();
          const detail = parts[1].trim();

          qText = `According to the training material, what is specified regarding "${subject}"?`;
          correctAns = detail.slice(0, 110);
        }
      }

      if (!qText && (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./))) {
        const cleanLine = line.replace(/^[•\-\d\.]+\s*/, '').trim();
        if (cleanLine.length > 25) {
          qText = `Which of the following principles is explicitly highlighted in the training document?`;
          correctAns = cleanLine.slice(0, 110);
        }
      }

      if (!qText && line.length > 40) {
        qText = `Based on the uploaded document text, which concept is accurately described?`;
        correctAns = line.slice(0, 110);
      }

      if (qText && correctAns) {
        const pageStart = Number(chunk.page_start || chunk.pageStart || 1);
        questions.push({
          questionText: qText,
          questionType: 'mcq',
          difficulty: ['easy', 'medium', 'hard'].includes(params.difficulty || '') ? (params.difficulty as any) : 'medium',
          competencyArea: params.competencyArea || 'Survey Methodology',
          topic: params.topic || 'Official Statistics',
          options: [
            { id: 'a', label: 'A', text: correctAns },
            { id: 'b', label: 'B', text: 'It is strictly restricted to external non-official research agencies.' },
            { id: 'c', label: 'C', text: 'It eliminates the requirement for survey sampling or data validation.' },
            { id: 'd', label: 'D', text: 'It applies exclusively to legacy manual filing systems.' },
          ],
          correctOption: 'a',
          explanation: `Directly supported by document excerpt: "${line.slice(0, 120)}..."`,
          evidenceSnippet: line.slice(0, 150),
          source: {
            materialId: chunk.material_id || chunk.materialId || params.materialId,
            chunkId: chunk.id || chunk.chunkId,
            pageStart,
            pageEnd: pageStart,
          },
        });
      }
    }
  }

  return questions;
}

/**
 * Main RAG-grounded assessment question generation workflow
 */
export async function generateGroundedAssessmentQuestions(
  params: GenerateAssessmentParams
): Promise<{ questions: GroundedQuestionInput[]; hasSourceMaterial: boolean; message: string }> {
  const query = params.topic || params.competencyArea || 'Official Statistics and Data Quality';
  const targetCount = params.questionCount || 5;
  const targetDifficulty = params.difficulty || 'medium';

  // 1. Retrieve RAG chunks
  let chunks: any[] = [];
  try {
    chunks = await retrieveRelevantChunks({
      query,
      materialId: params.materialId,
      userId: params.userId,
      topK: Math.max(5, targetCount * 2),
      minimumSimilarity: -1.0,
    });
  } catch (ragErr) {
    console.warn('[Generate Grounded Questions] RAG Chunk retrieval warning:', ragErr);
  }

  if (!chunks || chunks.length === 0) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let materialQuery = supabaseAdmin.from('materials').select('id, file_name, extracted_text_json');
      if (params.materialId) {
        materialQuery = materialQuery.eq('id', params.materialId);
      } else {
        materialQuery = materialQuery.not('extracted_text_json', 'is', null).order('created_at', { ascending: false }).limit(1);
      }
      const { data: mats } = await materialQuery;
      const targetMat = Array.isArray(mats) ? mats[0] : mats;
      if (targetMat && targetMat.extracted_text_json) {
        const rawChunks = chunkExtractedPdf(targetMat.extracted_text_json);
        chunks = rawChunks.map((rc, idx) => ({
          id: `chunk-${idx}`,
          materialId: targetMat.id,
          material_id: targetMat.id,
          chunkIndex: rc.chunkIndex,
          pageStart: rc.pageStart,
          page_start: rc.pageStart,
          pageEnd: rc.pageEnd,
          content: rc.content,
        }));
      }
    } catch (fallbackErr) {
      console.warn('[Generate Grounded Questions] Fallback chunk extraction warning:', fallbackErr);
    }
  }

  if (!chunks || chunks.length === 0) {
    return {
      questions: [],
      hasSourceMaterial: false,
      message: 'No indexed learning material is available for assessment generation.',
    };
  }

  const approvedQuestions: GroundedQuestionInput[] = [];

  const combinedContext = chunks
    .map((c, i) => `--- Snippet ${i + 1} (Page ${c.page_start || c.pageStart || c.pageNumber || 1}) [Chunk ID: ${c.id || c.chunkId || ''}] ---\n${c.content}`)
    .join('\n\n');

  const prompt = `Based strictly on the following excerpt(s) from official training material, generate ${targetCount} multiple choice questions (MCQs).

Context Snippets:
${combinedContext.slice(0, 12000)}

Instructions:
- Target Topic: "${params.topic || params.competencyArea || 'Statistical Methods'}"
- Difficulty: ${targetDifficulty}
- Create EXACTLY ${targetCount} distinct high-quality MCQs grounded in the text above.
- Each question MUST have EXACTLY 4 distinct option choices with IDs "a", "b", "c", "d" and labels "A", "B", "C", "D".
- Specify correctOption as "a", "b", "c", or "d".
- Provide a clear, factual explanation grounded in the snippet.
- Include a direct evidenceSnippet excerpt from the snippet text.
- Include pageStart (number) corresponding to where the evidence was found.

Return JSON in exact format:
{
  "questions": [
    {
      "questionText": "...",
      "difficulty": "${targetDifficulty === 'mixed' ? 'medium' : targetDifficulty}",
      "competencyArea": "${params.competencyArea || 'Survey Methodology'}",
      "topic": "${params.topic || 'Official Statistics'}",
      "options": [
        { "id": "a", "label": "A", "text": "..." },
        { "id": "b", "label": "B", "text": "..." },
        { "id": "c", "label": "C", "text": "..." },
        { "id": "d", "label": "D", "text": "..." }
      ],
      "correctOption": "a",
      "explanation": "...",
      "evidenceSnippet": "...",
      "pageStart": 1,
      "pageEnd": 1
    }
  ]
}`;

  const systemInstruction = 'You are an expert assessment question generator for India Official Statistical System. Output valid JSON strictly grounded in evidence.';

  try {
    const aiRes = await ai.generateText('QUESTION_GEN', { prompt, systemInstruction });
    let rawQuestions: any[] = [];
    try {
      const cleaned = aiRes.text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
    } catch (parseErr) {
      console.warn('[Generate Grounded Questions] JSON parse error:', parseErr);
    }

    for (let i = 0; i < rawQuestions.length && approvedQuestions.length < targetCount; i++) {
      const raw = rawQuestions[i];
      if (!raw || !raw.questionText) continue;

      const pageStart = Number(raw.pageStart) || chunks[i % chunks.length]?.page_start || chunks[i % chunks.length]?.pageStart || 1;
      const matchedChunk = chunks.find((c: any) => (c.page_start || c.pageStart) === pageStart) || chunks[i % chunks.length];

      let rawOptions = Array.isArray(raw.options) && raw.options.length === 4
        ? raw.options.map((o: any, oIdx: number) => ({
            id: String(o.id || ['a', 'b', 'c', 'd'][oIdx]).toLowerCase(),
            label: String(o.label || ['A', 'B', 'C', 'D'][oIdx]).toUpperCase(),
            text: String(o.text || '').trim(),
          }))
        : [
            { id: 'a', label: 'A', text: 'Option A' },
            { id: 'b', label: 'B', text: 'Option B' },
            { id: 'c', label: 'C', text: 'Option C' },
            { id: 'd', label: 'D', text: 'Option D' },
          ];

      let correctOption = String(raw.correctOption || 'a').toLowerCase();
      if (!['a', 'b', 'c', 'd'].includes(correctOption)) {
        if (correctOption.includes('a') || correctOption.includes('1')) correctOption = 'a';
        else if (correctOption.includes('b') || correctOption.includes('2')) correctOption = 'b';
        else if (correctOption.includes('c') || correctOption.includes('3')) correctOption = 'c';
        else if (correctOption.includes('d') || correctOption.includes('4')) correctOption = 'd';
        else correctOption = 'a';
      }

      const candidate: GroundedQuestionInput = {
        questionText: String(raw.questionText).trim(),
        questionType: 'mcq',
        difficulty: ['easy', 'medium', 'hard'].includes(raw.difficulty) ? raw.difficulty : 'medium',
        competencyArea: raw.competencyArea || params.competencyArea || 'Survey Methodology',
        topic: raw.topic || params.topic || 'Data Quality',
        options: rawOptions,
        correctOption,
        explanation: raw.explanation || 'Answer grounded in uploaded official material.',
        evidenceSnippet: raw.evidenceSnippet || matchedChunk?.content?.slice(0, 150) || '',
        source: {
          materialId: matchedChunk?.material_id || matchedChunk?.materialId || params.materialId,
          chunkId: matchedChunk?.id || matchedChunk?.chunkId,
          pageStart,
          pageEnd: Number(raw.pageEnd) || pageStart,
        },
      };

      const algoCheck = validateQuestionQuality(candidate);
      if (algoCheck.valid) {
        approvedQuestions.push(candidate);
      } else {
        console.warn('Candidate question failed algorithmic check:', algoCheck.issues);
      }
    }
  } catch (genErr: any) {
    console.error('Batch question generation failed:', genErr?.message || genErr);
  }

  // Fast algorithmic fallback if AI output is empty or unavailable
  if (approvedQuestions.length === 0 && chunks.length > 0) {
    console.log('[Generate Grounded Questions] AI output empty or unavailable. Triggering fast algorithmic fallback from text chunks...');
    const algoQuestions = generateAlgorithmicGroundedQuestions(chunks, targetCount, params);
    approvedQuestions.push(...algoQuestions);
  }

  return {
    questions: approvedQuestions,
    hasSourceMaterial: true,
    message: approvedQuestions.length > 0
      ? `Successfully generated ${approvedQuestions.length} grounded assessment questions.`
      : 'No valid questions could be validated from the selected material.',
  };
}
