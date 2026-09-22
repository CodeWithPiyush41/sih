import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase/client';
import { Plus, Upload, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { VERIFIED_IGOT_CATALOG } from '@/lib/igot/repository';

export function AdminIGOTImportPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'catalog'>('single');

  // Single Import Form State
  const [title, setTitle] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [igotUrl, setIgotUrl] = useState('');
  const [competencyAreas, setCompetencyAreas] = useState('');
  const [tags, setTags] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk Import State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResults, setBulkResults] = useState<{
    total: number;
    imported: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const isValidUrl = (urlStr: string): boolean => {
    try {
      const parsed = new URL(urlStr.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!title.trim()) {
      setFormMessage({ type: 'error', text: 'Course title is required.' });
      return;
    }

    if (!igotUrl.trim() || !isValidUrl(igotUrl)) {
      setFormMessage({ type: 'error', text: 'A valid official iGOT URL (http:// or https://) is required.' });
      return;
    }

    setSubmitting(true);

    try {
      const externalId = `igot-admin-${Date.now()}`;
      const compAreasList = competencyAreas.split(',').map((s) => s.trim()).filter(Boolean);
      const tagsList = tags.split(',').map((s) => s.trim()).filter(Boolean);
      const outcomesList = learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean);

      const payload = {
        external_id: externalId,
        title: title.trim(),
        organisation: organisation.trim() || 'iGOT Karmayogi',
        duration: duration.trim() || 'Self-paced',
        description: description.trim(),
        igot_url: igotUrl.trim(),
        source_url: igotUrl.trim(),
        competency_area: compAreasList[0] || 'Official Statistics',
        competency_areas: compAreasList.length > 0 ? compAreasList : ['Official Statistics'],
        tags: tagsList,
        learning_outcomes: outcomesList,
        source: 'Curated Admin Import',
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from('igot_courses').insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      setFormMessage({
        type: 'success',
        text: `Resource '${title}' imported successfully${isVerified ? ' as a Verified iGOT Resource' : ''}.`,
      });

      // Clear form
      setTitle('');
      setOrganisation('');
      setDuration('');
      setDescription('');
      setIgotUrl('');
      setCompetencyAreas('');
      setTags('');
      setLearningOutcomes('');
      setIsVerified(false);
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err?.message || 'Failed to import course record.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBulkFile(e.target.files[0]);
      setBulkResults(null);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;
    setBulkProcessing(true);
    setBulkResults(null);

    const errors: { row: number; reason: string }[] = [];
    let imported = 0;
    let total = 0;

    try {
      const text = await bulkFile.text();
      let records: any[] = [];

      if (bulkFile.name.endsWith('.json')) {
        records = JSON.parse(text);
        if (!Array.isArray(records)) throw new Error('JSON file must contain an array of course objects.');
      } else {
        // Simple CSV parser
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        records = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || '';
          });
          return rowObj;
        });
      }

      total = records.length;
      const validPayloads: any[] = [];

      records.forEach((row, idx) => {
        const rowNum = idx + 1;
        const rowTitle = row.title || row.Title;
        const rowUrl = row.igot_url || row.source_url || row.url || row.URL;

        if (!rowTitle || !rowTitle.trim()) {
          errors.push({ row: rowNum, reason: 'Missing course title' });
          return;
        }

        if (!rowUrl || !isValidUrl(rowUrl)) {
          errors.push({ row: rowNum, reason: 'Invalid or missing iGOT URL' });
          return;
        }

        const externalId = row.external_id || `igot-bulk-${Date.now()}-${rowNum}`;
        const compAreas = Array.isArray(row.competency_areas)
          ? row.competency_areas
          : (row.competency_areas || row.competency_area || 'Official Statistics').split(';').map((s: string) => s.trim());

        const tags = Array.isArray(row.tags)
          ? row.tags
          : (row.tags || '').split(';').map((s: string) => s.trim()).filter(Boolean);

        const outcomes = Array.isArray(row.learning_outcomes)
          ? row.learning_outcomes
          : (row.learning_outcomes || '').split(';').map((s: string) => s.trim()).filter(Boolean);

        validPayloads.push({
          external_id: externalId,
          title: rowTitle.trim(),
          organisation: (row.organisation || 'iGOT Karmayogi').trim(),
          duration: (row.duration || 'Self-paced').trim(),
          description: (row.description || '').trim(),
          igot_url: rowUrl.trim(),
          source_url: rowUrl.trim(),
          competency_area: compAreas[0] || 'Official Statistics',
          competency_areas: compAreas,
          tags,
          learning_outcomes: outcomes,
          source: 'Bulk Admin Import',
          is_verified: String(row.is_verified).toLowerCase() === 'true',
          verified_at: String(row.is_verified).toLowerCase() === 'true' ? new Date().toISOString() : null,
        });
      });

      if (validPayloads.length > 0) {
        const { error } = await supabase.from('igot_courses').upsert(validPayloads, { onConflict: 'external_id' });
        if (error) {
          throw new Error(`Database batch insert failed: ${error.message}`);
        }
        imported = validPayloads.length;
      }

      setBulkResults({ total, imported, errors });
    } catch (err: any) {
      setBulkResults({
        total,
        imported: 0,
        errors: [{ row: 0, reason: err?.message || 'Bulk file parsing failed.' }],
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="iGOT Karmayogi Resource Catalog Import"
        subtitle="Manually curate, verify, and bulk-import public iGOT learning resources into the local SkillLens AI catalog."
      />

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-8 border border-slate-200">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'single' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Single Resource Import
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'bulk' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bulk CSV / JSON Import
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'catalog' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Verified Catalog View ({VERIFIED_IGOT_CATALOG.length})
        </button>
      </div>

      {activeTab === 'single' && (
        <Card className="max-w-3xl mx-auto p-6 bg-white border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Curate iGOT Resource</h3>
              <p className="text-xs text-slate-500">Only verified public iGOT resources are recommended to officers.</p>
            </div>
          </div>

          {formMessage && (
            <div
              className={`p-4 rounded-xl mb-6 text-xs flex items-center gap-2 border ${
                formMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {formMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{formMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Course Title *
              </label>
              <Input
                type="text"
                placeholder="e.g. Data Validation, Editing Rules and Quality Control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Organisation / Provider
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Ministry of Statistics & Programme Implementation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 4 Hours 30 Mins"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official iGOT URL *
              </label>
              <Input
                type="url"
                placeholder="https://igotkarmayogi.gov.in/app/toc/do_..."
                value={igotUrl}
                onChange={(e) => setIgotUrl(e.target.value)}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Must be an exact verified public URL on igotkarmayogi.gov.in.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-primary transition-colors"
                rows={3}
                placeholder="Overview of course objectives and target domain..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Competency Areas (comma separated)
                </label>
                <Input
                  type="text"
                  placeholder="Data Validation, Quality Assurance"
                  value={competencyAreas}
                  onChange={(e) => setCompetencyAreas(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tags (comma separated)
                </label>
                <Input
                  type="text"
                  placeholder="range checks, logical edits, microdata"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Learning Outcomes (one per line)
              </label>
              <textarea
                className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-primary transition-colors"
                rows={3}
                placeholder="Apply range and ratio edit checks&#10;Identify anomaly flags in microdata"
                value={learningOutcomes}
                onChange={(e) => setLearningOutcomes(e.target.value)}
              />
            </div>

            {/* Verification Checkbox */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="isVerifiedCheck"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isVerifiedCheck" className="text-xs text-emerald-900 cursor-pointer">
                <span className="font-bold block">I verified this information against the public iGOT portal.</span>
                <span>Checking this box marks the resource as an official Verified iGOT Resource (`is_verified = true`).</span>
              </label>
            </div>

            <Button type="submit" isLoading={submitting} className="w-full">
              <Plus size={16} className="mr-1.5" /> Import Resource
            </Button>
          </form>
        </Card>
      )}

      {activeTab === 'bulk' && (
        <Card className="max-w-2xl mx-auto p-6 bg-white border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bulk CSV / JSON Import</h3>
              <p className="text-xs text-slate-500">Upload batch catalog files collected from iGOT Karmayogi.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
              <Upload className="mx-auto text-slate-400 mb-2" size={32} />
              <p className="text-xs text-slate-600 font-semibold mb-2">Select a CSV or JSON file to batch import</p>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleBulkFileChange}
                className="text-xs text-slate-500 block mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>

            <Button onClick={handleBulkImport} disabled={!bulkFile || bulkProcessing} isLoading={bulkProcessing} className="w-full">
              Process Bulk Import
            </Button>

            {bulkResults && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Total Records: {bulkResults.total}</span>
                  <Badge variant="success">Successfully Imported: {bulkResults.imported}</Badge>
                </div>

                {bulkResults.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                    <p className="font-bold">Rejected Rows ({bulkResults.errors.length}):</p>
                    {bulkResults.errors.map((err, idx) => (
                      <p key={idx}>Row {err.row}: {err.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VERIFIED_IGOT_CATALOG.map((course) => (
              <Card key={course.id} className="p-5 border-l-4 border-l-emerald-500 bg-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Verified iGOT Resource
                  </Badge>
                  <span className="text-xs text-slate-500 font-semibold">{course.duration}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{course.title}</h4>
                <p className="text-xs text-slate-500 mb-2">{course.organisation}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{course.description}</p>
                <a
                  href={course.igot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  <span>Open Official iGOT URL</span>
                  <ExternalLink size={12} />
                </a>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
