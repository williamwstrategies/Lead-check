import { describe, expect, it } from 'vitest';
import type { NormalizedWebsite, ScanRequest } from '../shared/leadcheck';
import { normalizePitchproofResult, SCANNER_VERSION } from '../server/services/realScanner';

const website: NormalizedWebsite = {
  inputUrl: 'example.com',
  url: 'https://example.com/',
  normalizedDomain: 'example.com',
};

const input: ScanRequest = {
  url: 'example.com',
  businessCategory: 'Home Services',
  primaryCity: 'Toronto',
  clientScanId: 'scan_normalization_test',
};

describe('real scanner normalization', () => {
  it('maps PitchProof scanner output into a non-mock LeadCheck report', () => {
    const report = normalizePitchproofResult(
      {
        url: 'https://example.com/',
        total: 52.4,
        rawTotal: 71.2,
        capApplied: 'Capped at 60 — no clear CTA',
        missingCritical: 2,
        isSinglePage: true,
        pagesAnalyzed: 1,
        pagesCrawled: [{ url: 'https://example.com/', type: 'homepage', source: 'homepage' }],
        scanMethod: 'playwright',
        categories: {
          seoVisibility: { label: 'SEO Visibility', score: 10, max: 20 },
          leadConversion: { label: 'Lead Conversion', score: 17, max: 35 },
          localTrust: { label: 'Local Trust', score: 12, max: 30 },
          technical: { label: 'Technical Health', score: 11, max: 15 },
          visualTrust: { label: 'Visual Trust & Design Quality', score: 9, max: 15 },
        },
        issues: [
          {
            key: 'cta',
            label: 'Strong Call-to-Action',
            severity: 'fail',
            issue: 'No prominent CTA found.',
            fix: 'Add a clear quote button.',
            category: 'leadConversion',
            maxPoints: 8,
            evidence: 'No CTA phrase detected',
            confidence: 'High',
          },
          {
            key: 'reviewsVisible',
            label: 'Reviews & Testimonials Visible',
            severity: 'fail',
            issue: 'No reviews found.',
            fix: 'Add reviews.',
            category: 'localTrust',
            maxPoints: 8,
            evidence: 'No review evidence found',
            confidence: 'High',
          },
          {
            key: 'metaDescription',
            label: 'Meta Description',
            severity: 'partial',
            issue: 'Meta description is short.',
            fix: 'Write a better meta description.',
            category: 'seoVisibility',
            maxPoints: 2.5,
            evidence: 'Meta exists but is generic',
            confidence: 'Medium',
          },
        ],
        recommendations: [
          {
            key: 'cta',
            label: 'Strong Call-to-Action',
            fix: 'Add a clear quote button.',
            impact: 'A clear next step helps ready visitors contact the business.',
            category: 'leadConversion',
            maxPoints: 8,
          },
        ],
        positives: [
          'The site uses HTTPS, which helps create trust and security.',
          'Core services are clearly mentioned on the website.',
        ],
      },
      website,
      input,
      new Date('2026-09-16T10:00:00.000Z'),
      new Date('2026-09-16T10:00:05.000Z')
    );

    expect(report.isMock).toBe(false);
    expect(report.scan.id).toBe('scan_normalization_test');
    expect(report.scannerVersion).toBe(SCANNER_VERSION);
    expect(report.score.score).toBe(52);
    expect(report.categoryScores.leadGeneration.score).toBe(49);
    expect(report.categoryScores.experience.score).toBe(60);
    expect(report.opportunities[0]).toMatchObject({
      findingKey: 'cta',
      category: 'leadGeneration',
      severity: 'high',
      priority: 1,
      title: 'Make the next step obvious',
    });
    expect(report.findings[0].sourceData?.pitchproofEvidence).toBe('No CTA phrase detected');
    expect(report.positiveFindings).toHaveLength(2);
    expect(report.scanMetadata?.capApplied).toContain('no clear CTA');
  });
});
