import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { LearningPath } from '@/components/learning/LearningPath';
import { IGOTRecommendationCard } from '@/components/learning/IGOTRecommendationCard';
import { mockLearningPath } from '@/lib/mock';
import { matchIGOTCourses } from '@/lib/igot/matcher';
import { fetchIGOTCourses } from '@/lib/igot/repository';
import type { IGOTMatchResult, IGOTCourseRecord } from '@/lib/igot/types';
import { CompetencyService, CompetencyProfileOverview } from '@/lib/services/competency.service';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Search, Sparkles, BookOpen, Target, Loader2, Building2, Clock, CheckCircle2 } from 'lucide-react';

export function LearningPathPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompetencyProfileOverview | null>(null);
  const [recommendations, setRecommendations] = useState<IGOTMatchResult[]>([]);
  const [allCourses, setAllCourses] = useState<IGOTCourseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'catalog' | 'path'>('recommendations');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [compProfile, fetchedCatalog] = await Promise.all([
          CompetencyService.getOfficerCompetencyProfile(user?.id).catch(() => null),
          fetchIGOTCourses(false),
        ]);

        setProfile(compProfile);
        setAllCourses(fetchedCatalog);

        // Determine gaps to match
        const gaps: string[] = [];
        if (compProfile?.priorityGap) {
          gaps.push(compProfile.priorityGap);
        }
        if (compProfile?.domains) {
          compProfile.domains
            .filter((d) => (d.averagePercent || 0) < 70)
            .forEach((d) => gaps.push(d.title));
        }

        // Fallback default gaps if no assessment profile yet
        if (gaps.length === 0) {
          gaps.push('Statistical Methodology', 'Data Validation', 'Digital Governance', 'Official Statistics');
        }

        const matched = await matchIGOTCourses({
          priorityGaps: gaps,
          limit: 8,
        });

        setRecommendations(matched);
      } catch (err) {
        console.error('Error loading learning path recommendations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  // Catalog filtering
  const filteredCatalog = allCourses.filter((course) => {
    const courseName = course.course_name || course.title || '';
    const summary = course.summary || course.description || '';
    const provider = course.provider || course.organisation || '';
    const matchesSearch =
      !searchQuery ||
      `${courseName} ${summary} ${provider}`.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedDomain === 'all') return true;
    const text = `${courseName} ${summary}`.toLowerCase();
    if (selectedDomain === 'statistical') {
      return text.includes('statistic') || text.includes('survey') || text.includes('data') || text.includes('excel') || text.includes('accounting') || text.includes('audit');
    }
    if (selectedDomain === 'technical') {
      return text.includes('tech') || text.includes('network') || text.includes('system') || text.includes('cyber') || text.includes('python') || text.includes('ai') || text.includes('5g');
    }
    if (selectedDomain === 'governance') {
      return text.includes('govern') || text.includes('procurement') || text.includes('policy') || text.includes('gem') || text.includes('law') || text.includes('gst');
    }
    if (selectedDomain === 'management') {
      return text.includes('manage') || text.includes('lead') || text.includes('communication') || text.includes('team') || text.includes('ethics') || text.includes('time');
    }

    return true;
  });

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Personalized Learning Path & iGOT Karmayogi Catalog"
        subtitle="AI-matched course recommendations from 150 official iGOT Karmayogi courses based on your assessed competency gaps."
      />

      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'recommendations'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles size={16} />
              <span>Recommended iGOT Courses ({recommendations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen size={16} />
              <span>Explore All 150 iGOT Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab('path')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'path'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Target size={16} />
              <span>Structured Skill Steps</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-indigo-600" />
            <span>150 iGOT Karmayogi Courses Synchronized</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Matching 150 iGOT courses to your profile...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Smart Gap Matching Active</h3>
                      <p className="text-sm text-indigo-200 mt-1">
                        SkillLens AI has analyzed your test results and identified key priority gaps:{' '}
                        <span className="font-semibold text-amber-300">
                          {profile?.priorityGap || 'Statistical Methodology & Data Governance'}
                        </span>
                        . Below are the top-scoring courses selected directly from the 150 uploaded iGOT Karmayogi catalog.
                      </p>
                    </div>
                  </div>
                </div>

                {recommendations.length === 0 ? (
                  <Card className="p-8 text-center text-slate-500">
                    <BookOpen size={36} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-700">No specific gap matches found</p>
                    <p className="text-sm text-slate-500 mt-1">Browse all 150 courses from the iGOT Catalog tab above.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((match, idx) => (
                      <IGOTRecommendationCard key={match.course.id || idx} match={match} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EXPLORE ALL 150 IGOT CATALOG */}
            {activeTab === 'catalog' && (
              <div className="space-y-4">
                {/* Search & Domain Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search 150 courses by title, provider, or topic..."
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setSelectedDomain('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        selectedDomain === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({allCourses.length})
                    </button>
                    <button
                      onClick={() => setSelectedDomain('statistical')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        selectedDomain === 'statistical'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Statistical
                    </button>
                    <button
                      onClick={() => setSelectedDomain('technical')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        selectedDomain === 'technical'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Technical & Tech
                    </button>
                    <button
                      onClick={() => setSelectedDomain('governance')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        selectedDomain === 'governance'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Digital Governance
                    </button>
                    <button
                      onClick={() => setSelectedDomain('management')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        selectedDomain === 'management'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Management
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredCatalog.length} of {allCourses.length} iGOT Karmayogi Courses
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCatalog.map((course, idx) => (
                    <Card key={course.id || idx} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                            iGoT Karmayogi
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{course.course_name || course.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-3">{course.summary || course.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400" />
                          <span className="truncate max-w-[120px]">{course.provider || course.organisation || 'iGOT'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{course.duration || 'Self-paced'}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: STRUCTURED SKILL STEPS */}
            {activeTab === 'path' && (
              <div className="max-w-3xl mx-auto">
                <LearningPath steps={mockLearningPath} topicName={profile?.priorityGap || 'Data Validation'} />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

