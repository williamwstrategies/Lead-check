import { describe, expect, it } from 'vitest';
import { isKnownAnalyticsEvent } from '../server/services/analytics';

describe('analytics event allowlist', () => {
  it('accepts launch funnel events and rejects retired names', () => {
    for (const event of [
      'landing_view',
      'website_submitted',
      'scan_started',
      'lead_info_submitted',
      'scan_completed',
      'report_viewed',
      'opportunity_opened',
      'help_cta_clicked',
    ]) {
      expect(isKnownAnalyticsEvent(event)).toBe(true);
    }

    expect(isKnownAnalyticsEvent('results_viewed')).toBe(false);
    expect(isKnownAnalyticsEvent('service_help_clicked')).toBe(false);
  });
});
