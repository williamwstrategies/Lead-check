export interface AnalyticsEventInput {
  event: string;
  properties?: Record<string, unknown>;
  anonymousId?: string;
  userId?: string;
}

const KNOWN_EVENTS = new Set([
  'landing_view',
  'website_submitted',
  'scan_started',
  'scan_completed',
  'scan_failed',
  'report_viewed',
  'opportunity_opened',
  'account_created',
  'report_saved',
  'report_revisited',
  'rescan_clicked',
  'help_cta_clicked',
  'lead_form_viewed',
  'lead_info_submitted',
]);

export function isKnownAnalyticsEvent(event: string): boolean {
  return KNOWN_EVENTS.has(event);
}

export async function trackServerEvent(input: AnalyticsEventInput): Promise<void> {
  const event = String(input.event || '').trim();
  if (!event) return;

  if (process.env.ANALYTICS_LOG_TO_CONSOLE !== 'false') {
    console.info('[LeadCheck analytics]', {
      event,
      known: isKnownAnalyticsEvent(event),
      anonymousId: input.anonymousId || '',
      userId: input.userId || '',
      properties: input.properties || {},
    });
  }
}
