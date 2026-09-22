import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { MaterialService } from '@/lib/services/material.service';
import { FileText, Search, Plus, Sparkles, Eye, Lock, Globe, Loader2, Trash2, X, CheckCircle2 } from 'lucide-react';

export function MaterialsLibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = user?.id || session?.user?.id;

      let query = supabase
        .from('materials')
        .select('id, title, file_name, file_size, material_type, status, created_at, uploaded_by, visibility, page_count, extracted_text_json');

      if (currentUserId) {
        query = query.or(`uploaded_by.eq.${currentUserId},uploaded_by.eq.3884683e-054f-4e60-86a8-2aadbbee542c,material_type.eq.teacher_material,visibility.eq.public,visibility.eq.course`);
      } else {
        query = query.or('uploaded_by.eq.3884683e-054f-4e60-86a8-2aadbbee542c,material_type.eq.teacher_material,visibility.eq.public,material_type.eq.personal_material');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const seenNames = new Set<string>();
        const formatted: any[] = [];

        for (const m of data) {
          const name = m.file_name || m.title || 'Training_Material.pdf';
          const nameKey = name.toLowerCase();

          if (!seenNames.has(nameKey)) {
            seenNames.add(nameKey);

            const json = m.extracted_text_json || {};
            const extractedText =
              json.extractedText ||
              (Array.isArray(json.pages)
                ? json.pages.map((p: any) => `--- PAGE ${p.page} ---\n${p.text}`).join('\n\n')
                : null);

            formatted.push({
              id: m.id,
              fileName: name,
              fileSize: Number(m.file_size) || 1024 * 1024,
              uploadedAt: m.created_at || new Date().toISOString(),
              materialType: m.material_type || 'personal_material',
              status: m.status || 'ready',
              pageCount: m.page_count || (json.pages ? json.pages.length : 1),
              extractedText,
              topics: ['Official Statistics', 'Statistical Training', 'Survey Methodology'],
            });
          }
        }
        setMaterials(formatted);
      } else {
        if (error) console.error('Error fetching materials from Supabase:', error);
        setMaterials([]);
      }
    } catch (e) {
      console.error('Error fetching materials from Supabase:', e);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This will remove the PDF and its indexing.`)) {
      return;
    }
    setDeletingId(materialId);
    try {
      const res = await MaterialService.deleteMaterial(materialId);
      if (res.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      } else {
        alert(`Failed to delete material: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error deleting material: ${err?.message || 'Failed to delete'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.topics.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'coordinator' && m.materialType === 'teacher_material') ||
      (filterType === 'personal' && m.materialType === 'personal_material');

    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Training Materials Library"
        subtitle="Access official statistical training manuals and your private study notes."
        action={
          <Button variant="primary" onClick={() => navigate('/student/upload')}>
            <Plus size={16} className="mr-1.5" />
            Upload Personal Material
          </Button>
        }
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 max-w-3xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search statistical manuals by filename or topic..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary shadow-xs"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">All Materials</option>
          <option value="coordinator">Coordinator Materials</option>
          <option value="personal">Personal Study Notes</option>
        </select>
      </div>

      {/* Grid of Material Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading training materials library...</p>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => (
            <Card key={mat.id} hover className="flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {mat.materialType === 'personal_material' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        <Lock size={10} /> Personal (Private)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        <Globe size={10} /> Official Programme
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2" title={mat.fileName}>
                  {mat.fileName}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {formatFileSize(mat.fileSize)} • Uploaded {new Date(mat.uploadedAt).toLocaleDateString()}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {mat.topics.map((topic: string, i: number) => (
                    <Badge key={i} variant="neutral" className="text-[11px]">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setSelectedMaterial(mat)}
                >
                  <Eye size={14} className="mr-1" />
                  View
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() =>
                    navigate(`/student/config-assessment?materialId=${mat.id}&fileName=${encodeURIComponent(mat.fileName)}`)
                  }
                >
                  <Sparkles size={14} className="mr-1" />
                  Generate Quiz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deletingId === mat.id}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 p-2 shrink-0"
                  title="Delete Material PDF"
                  onClick={() => handleDeleteMaterial(mat.id, mat.fileName)}
                >
                  {deletingId === mat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 border-dashed rounded-xl text-center">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Search className="text-slate-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No materials found</h3>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            We couldn't find any materials matching your criteria. Upload official survey guidelines or study notes to begin.
          </p>
          <Button variant="primary" onClick={() => navigate('/student/upload')}>
            <Plus size={16} className="mr-1.5" />
            Upload PDF
          </Button>
        </div>
      )}

      {/* View Material Details Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">{selectedMaterial.fileName}</h3>
                  <p className="text-xs text-slate-500">
                    Uploaded {new Date(selectedMaterial.uploadedAt).toLocaleDateString()} • {formatFileSize(selectedMaterial.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-600 font-medium">Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} /> Ready for RAG & Assessment
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-600 font-medium">Material Visibility</span>
                <span className="font-bold text-slate-800 capitalize">{selectedMaterial.materialType.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indexed Topics</label>
              <div className="flex flex-wrap gap-1.5">
                {selectedMaterial.topics.map((t: string, idx: number) => (
                  <Badge key={idx} variant="neutral" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Extracted PDF Document Text Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <FileText size={12} className="text-primary" />
                  Extracted Document Text Content
                </span>
                {selectedMaterial.pageCount && (
                  <span className="text-[11px] font-normal text-slate-400">{selectedMaterial.pageCount} Pages Extracted</span>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto p-3.5 bg-slate-900 text-slate-200 text-xs rounded-xl font-mono leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner">
                {selectedMaterial.extractedText || 'Extracted document text is ready for RAG vector search & AI quiz generation.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedMaterial(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const id = selectedMaterial.id;
                  const name = selectedMaterial.fileName;
                  setSelectedMaterial(null);
                  navigate(`/student/config-assessment?materialId=${id}&fileName=${encodeURIComponent(name)}`);
                }}
              >
                <Sparkles size={14} className="mr-1.5" />
                Generate Quiz Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
