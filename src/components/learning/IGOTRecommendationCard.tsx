import { ExternalLink, Award, Sparkles, CheckCircle2, Clock, Building2, Check } from 'lucide-react';
import type { IGOTMatchResult } from '@/lib/igot/types';
import { Card } from '@/components/ui/Card';

interface IGOTRecommendationCardProps {
  match: IGOTMatchResult;
}

export function IGOTRecommendationCard({ match }: IGOTRecommendationCardProps) {
  const { course, targetGap, matchScore, matchReasons } = match;

  return (
    <Card className="p-5 border-l-4 border-l-primary hover:shadow-md transition-shadow bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Check size={12} className="text-indigo-600" />
              iGoT Karmayogi Catalog
            </span>
            {targetGap && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Target Gap: {targetGap}
              </span>
            )}
            {matchScore > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {matchScore}% Match
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-slate-900 leading-snug">{course.course_name || course.title}</h4>
          <p className="text-xs text-slate-600 mt-1 line-clamp-3">{course.summary || course.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-slate-400" />
          <span>Provider: {course.provider || course.organisation || 'iGoT Karmayogi'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-400" />
          <span>Duration: {course.duration || 'Self-paced'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Award size={14} className="text-slate-400" />
          <span>Source: {course.source || 'iGoT Karmayogi Catalog'}</span>
        </div>
      </div>

      {matchReasons && matchReasons.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-900">Why Recommended</p>
              <ul className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                {matchReasons.map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {course.learning_outcomes && course.learning_outcomes.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Key Competencies Acquired
          </p>
          <ul className="space-y-1">
            {course.learning_outcomes.map((outcome, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {(course.tags || []).slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
              #{tag}
            </span>
          ))}
        </div>
        {(course.igot_url || course.source_url) ? (
          <a
            href={course.igot_url || course.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <span>Open on iGOT</span>
            <ExternalLink size={14} />
          </a>
        ) : null}
      </div>
    </Card>
  );
}
