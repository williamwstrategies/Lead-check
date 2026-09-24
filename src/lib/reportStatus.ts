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
      headline: 'Your website may be costing you calls and quote requests.',
      supportingCopy: 'LeadCheck found several issues that could make it harder for homeowners to choose your business.',
      scoreCopy:
        'Your website has several issues that could make it harder for visitors to call, request a quote, or trust your business.',
    };
  }

  if (score < 80) {
    return {
      tone: 'needs-improvement',
      label: 'Needs Improvement',
      shortLabel: 'Needs Improvement',
      headline: "Your website has a foundation, but it could be working harder.",
      supportingCopy: 'LeadCheck found opportunities that may help turn more visitors into calls and quote requests.',
      scoreCopy: 'Your website has a workable foundation, but several areas could be improved to support more leads.',
    };
  }

  return {
    tone: 'strong',
    label: 'Strong Website',
    shortLabel: 'Strong',
    headline: 'Your website is doing many of the right things.',
    supportingCopy:
      "You're giving visitors several good reasons to trust and contact your business. Here are the remaining opportunities LeadCheck found.",
    scoreCopy: 'Your website is doing well across most of the lead, trust, Google, and mobile signals LeadCheck reviewed.',
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
