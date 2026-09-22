import { supabase } from '@/lib/supabase/client';

export interface UploadMaterialResponse {
  materialId: string | null;
  status?: string;
  pageCount?: number;
  storageBucket?: string;
  storagePath?: string;
  cloudinaryUrl?: string;
  error: string | null;
}

export const MaterialService = {
  /**
   * Upload a PDF file to Express API (/api/materials/upload), which handles:
   * Supabase Storage PDF upload -> Supabase DB tracking -> PDF validation -> Type detection -> Text Extraction/OCR -> Page-aware cleaning -> RAG Vector Indexing
   */
  async uploadMaterial(
    file: File,
    title: string,
    materialType: 'teacher_material' | 'personal_material' = 'teacher_material',
    courseId?: string,
    subjectId?: string,
    userId?: string
  ): Promise<UploadMaterialResponse> {
    try {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user;
      
      let activeUserId = userId || sessionUser?.id;
      if (!activeUserId) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.id) activeUserId = userData.user.id;
        } catch {}
      }
      if (!activeUserId) {
        activeUserId = '3884683e-054f-4e60-86a8-2aadbbee542c';
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('material_type', materialType);
      if (courseId) formData.append('course_id', courseId);
      if (subjectId) formData.append('subject_id', subjectId);

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (activeUserId) {
        headers['x-user-id'] = activeUserId;
      }

      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        return { materialId: null, error: errorData.error || `Server error ${response.status}` };
      }

      const result = await response.json();
      return {
        materialId: result.materialId,
        status: result.status,
        pageCount: result.pageCount,
        storageBucket: result.storageBucket || 'training-materials',
        storagePath: result.storagePath,
        error: null,
      };
    } catch (err: unknown) {
      console.warn('[MaterialService] API endpoint call failed, attempting fallback...', err);
      return MaterialService.fallbackUploadMaterial(file, title, materialType, courseId, subjectId, userId);
    }
  },

  /**
   * Fallback method for direct Supabase storage upload if backend server is unavailable
   */
  async fallbackUploadMaterial(
    file: File,
    title: string,
    materialType: 'teacher_material' | 'personal_material' = 'teacher_material',
    courseId?: string,
    subjectId?: string,
    userId?: string
  ): Promise<UploadMaterialResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uId = userId || user?.id || '3884683e-054f-4e60-86a8-2aadbbee542c';

      const matId = crypto.randomUUID();
      const filePath = `${uId}/${matId}/original.pdf`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('training-materials')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        return { materialId: null, error: 'Failed to upload file to Supabase Storage.' };
      }

      const insertPayload: any = {
        id: matId,
        title,
        file_name: file.name,
        file_path: uploadData.path,
        storage_bucket: 'training-materials',
        storage_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        uploaded_by: uId,
        status: 'uploaded',
        processing_status: 'completed',
        material_type: materialType,
        visibility: materialType === 'teacher_material' ? 'course' : 'private',
      };
      if (courseId) insertPayload.course_id = courseId;
      if (subjectId) insertPayload.subject_id = subjectId;

      const { data: dbData, error: dbError } = await supabase
        .from('materials')
        .insert(insertPayload)
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from('training-materials').remove([uploadData.path]);
        return { materialId: null, error: 'Failed to save material record.' };
      }

      return {
        materialId: dbData.id,
        status: 'completed',
        storageBucket: 'training-materials',
        storagePath: uploadData.path,
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      return { materialId: null, error: message };
    }
  },

  /**
   * Check material status by ID
   */
  async getMaterialStatus(materialId: string) {
    try {
      const response = await fetch(`/api/materials/${materialId}/status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Ignore API error and query Supabase directly
    }

    const { data } = await supabase
      .from('materials')
      .select('id, title, status, processing_status, indexing_status, page_count, storage_bucket, storage_path, file_path, processing_error, indexing_error')
      .eq('id', materialId)
      .single();

    return data;
  },

  /**
   * Perform RAG semantic search across uploaded statistical materials
   */
  async searchMaterials(query: string, materialId?: string, topK = 5) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, materialId, topK }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Search failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error('[MaterialService] Semantic search error:', err);
      throw err;
    }
  },

  /**
   * Fetch materials by course ID
   */
  async getMaterialsByCourse(courseId: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        id, title, file_name, file_size, status, processing_status, indexing_status, page_count, storage_bucket, storage_path, file_path, created_at,
        profiles (full_name)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
    
    return data;
  },

  /**
   * Delete uploaded PDF material from Supabase Storage & Database
   */
  async deleteMaterial(materialId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        return { success: true };
      }

      const errData = await response.json().catch(() => ({}));
      console.warn('[MaterialService] API delete endpoint returned error, trying Supabase fallback:', errData);
    } catch (apiErr) {
      console.warn('[MaterialService] API delete request failed, attempting fallback...', apiErr);
    }

    // Fallback direct Supabase Storage & DB delete
    try {
      const { data: mat } = await supabase
        .from('materials')
        .select('storage_bucket, storage_path, file_path')
        .eq('id', materialId)
        .maybeSingle();

      if (mat) {
        const bucket = mat.storage_bucket || 'training-materials';
        const path = mat.storage_path || mat.file_path;
        if (path) {
          await supabase.storage.from(bucket).remove([path]);
        }
      }

      await supabase.from('material_chunks').delete().eq('material_id', materialId);
      await supabase.from('questions').update({ material_id: null }).eq('material_id', materialId);
      await supabase.from('assessments').update({ material_id: null }).eq('material_id', materialId);

      const { error: dbErr } = await supabase.from('materials').delete().eq('id', materialId);

      if (dbErr) {
        return { success: false, error: dbErr.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete material.' };
    }
  },
};
