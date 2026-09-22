import { describe, expect, it } from 'vitest';
import { getScoreStatusView } from '../src/lib/reportStatus';

describe('report semantic score status', () => {
  it('uses red status through 59', () => {
    expect(getScoreStatusView(45)).toMatchObject({ tone: 'poor', label: 'Needs Attention' });
    expect(getScoreStatusView(59)).toMatchObject({ tone: 'poor', label: 'Needs Attention' });
  });

  it('uses amber status from 60 through 79', () => {
    expect(getScoreStatusView(60)).toMatchObject({ tone: 'needs-improvement', label: 'Needs Improvement' });
    expect(getScoreStatusView(70)).toMatchObject({ tone: 'needs-improvement', label: 'Needs Improvement' });
    expect(getScoreStatusView(79)).toMatchObject({ tone: 'needs-improvement', label: 'Needs Improvement' });
  });

  it('uses green status from 80 through 100', () => {
    expect(getScoreStatusView(80)).toMatchObject({ tone: 'strong', label: 'Strong Website' });
    expect(getScoreStatusView(92)).toMatchObject({ tone: 'strong', label: 'Strong Website' });
  });
});
