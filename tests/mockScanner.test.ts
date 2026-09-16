import { describe, expect, it } from 'vitest';
import { mockScanner } from '../server/services/mockScanner';

describe('mockScanner', () => {
  it('returns a completed normalized LeadCheck report', async () => {
    const report = await mockScanner.runWebsiteScan({
      url: 'example.com',
      businessCategory: 'Professional Services',
      businessSubcategory: 'Accounting',
      primaryCity: 'Toronto',
      mockScenario: 'default',
    });

    expect(report.isMock).toBe(true);
    expect(report.scan.status).toBe('completed');
    expect(report.requestedWebsite.normalizedDomain).toBe('example.com');
    expect(report.score.score).toBe(64);
    expect(report.opportunities).toHaveLength(4);
    expect(report.positiveFindings.length).toBeGreaterThan(0);
  });

  it('supports a failed mock scan state without throwing', async () => {
    const report = await mockScanner.runWebsiteScan({
      url: 'example.com',
      mockScenario: 'failed',
    });

    expect(report.scan.status).toBe('failed');
    expect(report.scan.failureReason).toBeTruthy();
  });
});
