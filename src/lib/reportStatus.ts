import type { FindingSeverity } from '../../shared/leadcheck';

export type ScoreTone = 'poor' | 'needs-improvement' | 'strong';
export type FindingTone = 'high' | 'medium' | 'low';

export interface ScoreStatusView {
  tone: ScoreTone;
  label: string;
  shortLabel: string;
  headline: string;
  supportingCopy: string;
  scoreCopy: string;
}

export function getScoreStatusView(score: number): ScoreStatusView {
  if (score < 60) {
    return {
      tone: 'poor',
      label: 'Needs Attention',
      shortLabel: 'Needs Attention',
      headline: 'Your website has some important opportunities.',
      supportingCopy: 'LeadCheck found several areas worth addressing. Start with the highest-priority items below.',
      scoreCopy:
        'Your website has several issues that could make it harder for visitors to find, trust, or contact your business.',
    };
  }

  if (score < 80) {
    return {
      tone: 'needs-improvement',
      label: 'Needs Improvement',
      shortLabel: 'Needs Improvement',
      headline: "Your website has a good foundation, but there's room to improve.",
      supportingCopy: 'LeadCheck found several opportunities that could create a clearer, more effective experience.',
      scoreCopy: 'Your website has a solid foundation, but several areas could be improved.',
    };
  }

  return {
    tone: 'strong',
    label: 'Strong Website',
    shortLabel: 'Strong',
    headline: 'Your website has a strong foundation.',
    supportingCopy:
      "You're doing many of the important things well. Here are the remaining opportunities LeadCheck found.",
    scoreCopy: 'Your website is performing well across most of the areas LeadCheck analyzed.',
  };
}

export function getFindingTone(severity: FindingSeverity): FindingTone {
  if (severity === 'high') return 'high';
  if (severity === 'medium') return 'medium';
  return 'low';
}

export function getFindingPriorityLabel(severity: FindingSeverity): string {
  if (severity === 'high') return 'High Priority';
  if (severity === 'medium') return 'Medium Priority';
  return 'Low Priority';
}
