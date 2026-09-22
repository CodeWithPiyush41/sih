import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, UploadCloud, Target, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-primary block leading-tight">
                SkillLens <span className="text-secondary font-semibold">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Official Statistical System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Register Officer Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
          <Award size={14} />
          <span>SIH26101 — AI Competency Intelligence & iGOT Karmayogi Learning Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
          AI Competency Intelligence for <span className="text-primary">India's Official Statistical System</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Continuous competency evaluation, targeted statistical gap analysis, automated question generation from official training materials, and direct iGOT Karmayogi course recommendations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
              <span>Officer Portal Sign In</span>
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link to="/signup" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Create Officer Profile
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Flow Grid */}
      <section className="py-16 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Official Statistical Competency Loop
            </h2>
            <p className="text-slate-500 text-sm">
              From raw training manuals and guidelines to verified competency progression and iGOT integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-primary/30 transition-colors">
              <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                <UploadCloud size={24} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">1. Upload Manuals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload survey manuals, sampling guidelines, and statistical methodology documents.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-secondary/30 transition-colors">
              <div className="p-3 rounded-lg bg-secondary/20 text-secondary-dark w-fit mb-4">
                <Award size={24} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">2. Competency Assessment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete multi-difficulty evaluations on Data Validation, Sampling Methods, and Survey Design.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-info/30 transition-colors">
              <div className="p-3 rounded-lg bg-info-light text-info w-fit mb-4">
                <Target size={24} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">3. Competency Gap Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pinpoint precise competency gaps (e.g. Data Validation 38%) backed by evidence.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-primary-light/30 transition-colors">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 w-fit mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">4. iGOT Recommendations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive matched iGOT Karmayogi learning resources and track reassessment growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck size={18} className="text-primary" />
            <span>SkillLens AI — SIH26101</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Official Statistical System Competency Platform.</p>
        </div>
      </footer>
    </div>
  );
}
