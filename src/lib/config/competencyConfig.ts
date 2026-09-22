export interface CompetencyDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  isVerifiedOfficialFramework: boolean;
}

/**
 * Configurable prototype competency areas for India's Official Statistical System.
 * Note: These are example competency definitions for the SIH26101 prototype.
 * They will be bound to official Government framework data once verified API/framework mappings are imported.
 */
export const CONFIGURABLE_STATISTICAL_COMPETENCIES: CompetencyDefinition[] = [
  {
    id: 'comp-1',
    name: 'Survey Methodology',
    category: 'Core Field Operations',
    description: 'Design, execution, and oversight of official sample surveys and censuses.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-2',
    name: 'Sampling Methods',
    category: 'Statistical Theory',
    description: 'Probability sampling techniques, frame design, weight calculations, and variance estimation.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-3',
    name: 'Data Collection',
    category: 'Core Field Operations',
    description: 'Field data capture, CAPI/PAPI protocols, enumerator training, and field monitoring.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-4',
    name: 'Data Validation',
    category: 'Data Quality & Audit',
    description: 'Consistency checks, anomaly detection, range validations, and imputation algorithms.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-5',
    name: 'Statistical Analysis',
    category: 'Analytics & Inference',
    description: 'Exploratory data analysis, hypothesis testing, econometric modeling, and time series.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-6',
    name: 'Data Interpretation',
    category: 'Policy & Reporting',
    description: 'Extracting actionable insights, key indicator analysis, and executive summary writing.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-7',
    name: 'Data Quality Assurance',
    category: 'Data Quality & Audit',
    description: 'Total Survey Error framework, data auditing, and accuracy standard enforcement.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-8',
    name: 'Data Dissemination',
    category: 'Policy & Reporting',
    description: 'National Indicator Framework reporting, open data standards, metadata, and data privacy.',
    isVerifiedOfficialFramework: false,
  },
  {
    id: 'comp-9',
    name: 'Statistical Computing',
    category: 'Analytics & Inference',
    description: 'Tool proficiency in R, Python, SAS, STATA, and database query engines for official data.',
    isVerifiedOfficialFramework: false,
  },
];

export type CompetencyStatus = 'Needs Development' | 'Developing' | 'Proficient' | 'Strong';

/**
 * Deterministic threshold logic for competency score classification.
 */
export function getCompetencyStatus(scorePercent: number): CompetencyStatus {
  if (scorePercent < 40) return 'Needs Development';
  if (scorePercent < 60) return 'Developing';
  if (scorePercent < 80) return 'Proficient';
  return 'Strong';
}

export function getStatusColorClass(status: CompetencyStatus): string {
  switch (status) {
    case 'Needs Development':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Developing':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Proficient':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Strong':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}
