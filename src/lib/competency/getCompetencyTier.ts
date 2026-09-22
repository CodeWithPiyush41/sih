export interface CompetencyTier {
  label: 'Proficient' | 'Developing' | 'Needs Development' | 'Not yet evaluated';
  color: 'emerald' | 'amber' | 'rose' | 'slate';
  badgeVariant: 'success' | 'warning' | 'danger' | 'neutral';
  icon: 'check' | 'warning' | 'alert' | 'minus';
}

export function getCompetencyTier(score: number | null | undefined): CompetencyTier {
  if (score == null || isNaN(score)) {
    return {
      label: 'Not yet evaluated',
      color: 'slate',
      badgeVariant: 'neutral',
      icon: 'minus',
    };
  }

  if (score >= 75) {
    return {
      label: 'Proficient',
      color: 'emerald',
      badgeVariant: 'success',
      icon: 'check',
    };
  }

  if (score >= 50) {
    return {
      label: 'Developing',
      color: 'amber',
      badgeVariant: 'warning',
      icon: 'warning',
    };
  }

  return {
    label: 'Needs Development',
    color: 'rose',
    badgeVariant: 'danger',
    icon: 'alert',
  };
}

/**
 * Single source of truth calculation for overall competency average.
 * Returns null if no valid scores exist.
 */
export function calculateOverallScore(scores: (number | null | undefined)[]): number | null {
  const validScores = scores.filter((s): s is number => s != null && !isNaN(s));
  if (validScores.length === 0) return null;
  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / validScores.length);
}
