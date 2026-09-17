import { loadAttribution } from './attribution';

const STORAGE_KEY = 'leadcheck.anonymousId';
const DEDUPE_WINDOW_MS = 900;
const META_PIXEL_ID = '1607766497693862';
const recentEvents = new Map<string, number>();

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEventName =
  | 'landing_view'
  | 'website_submitted'
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'report_viewed'
  | 'opportunity_opened'
  | 'account_created'
  | 'report_saved'
  | 'report_revisited'
  | 'rescan_clicked'
  | 'help_cta_clicked'
  | 'lead_form_viewed'
  | 'lead_info_submitted';

function anonymousId(): string {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function getAnonymousId(): string {
  return anonymousId();
}

export async function trackEvent(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): Promise<void> {
  const mergedProperties = {
    ...loadAttribution(),
    ...properties,
  };
  const dedupeKey = `${event}:${JSON.stringify(mergedProperties)}`;
  const now = Date.now();
  const lastTrackedAt = recentEvents.get(dedupeKey) || 0;
  if (now - lastTrackedAt < DEDUPE_WINDOW_MS) return;
  recentEvents.set(dedupeKey, now);

  const payload = {
    event,
    properties: mergedProperties,
    anonymousId: anonymousId(),
  };

  if (import.meta.env.DEV) {
    console.info('[LeadCheck analytics]', payload);
  }

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadCheck-Anonymous-Id': payload.anonymousId,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics should never interrupt the scan or report experience.
  }
}

export function trackMetaPixelEvent(event: string): void {
  if (typeof window.fbq !== 'function') return;
  window.fbq('trackSingle', META_PIXEL_ID, event);
}
