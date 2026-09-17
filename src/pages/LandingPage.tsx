import { Link } from 'react-router-dom';
import { GraduationCap, BarChart3, FileText, Target } from 'lucide-react';
import { Button } from '@/components/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} strokeWidth={1.5} className="text-signal" />
          <span className="text-h3 text-ink">SkillLens AI</span>
        </div>
        <Link to="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </header>

      <div className="max-w-[1080px] mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="max-w-[42rem]">
          <h1 className="text-display text-ink mb-6">
            See where understanding breaks down, not just the final score.
          </h1>
          <p className="text-body text-ink-secondary mb-8 text-balance">
            SkillLens AI breaks each subject into topics and competencies, measures them
            individually, and tells students exactly what to review before re-attempting.
            Teachers get a class-wide view of where intervention is needed.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button>Get started</Button>
            </Link>
            <Link to="/signup">
              <Button variant="secondary">Create account</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          <div className="bg-surface border border-border rounded-panel p-6">
            <Target size={20} strokeWidth={1.5} className="text-signal mb-3" />
            <h2 className="text-h3 text-ink mb-2">Per-competency scoring</h2>
            <p className="text-body-sm text-ink-muted">
              Each topic gets its own score, not a single number that hides gaps.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-panel p-6">
            <FileText size={20} strokeWidth={1.5} className="text-signal mb-3" />
            <h2 className="text-h3 text-ink mb-2">AI-assisted question generation</h2>
            <p className="text-body-sm text-ink-muted">
              Upload material, extract topics, generate questions — all teacher-approved.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-panel p-6">
            <BarChart3 size={20} strokeWidth={1.5} className="text-signal mb-3" />
            <h2 className="text-h3 text-ink mb-2">Class-wide analytics</h2>
            <p className="text-body-sm text-ink-muted">
              Spot which students need help and on which topics, at a glance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
