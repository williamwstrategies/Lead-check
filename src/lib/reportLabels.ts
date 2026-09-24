import type { CategoryScore, ReportCategoryKey } from '../../shared/leadcheck';

export const reportCategoryLabels: Record<ReportCategoryKey, string> = {
  googleVisibility: 'Google Visibility',
  leadGeneration: 'Turning Visitors Into Leads',
  trust: 'Homeowner Trust',
  performance: 'Website Performance',
  experience: 'Website Experience',
};

export function scoreWithDisplayLabel(score: CategoryScore, label?: string): CategoryScore {
  return {
    ...score,
    label: label || reportCategoryLabels[score.key] || score.label,
  };
}
