import type { AttributionFields } from '../../shared/leadcheck';

const STORAGE_KEY = 'leadcheck.attribution.v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CLICK_ID_KEYS = ['fbclid', 'gclid'] as const;
const KNOWN_REFERRER_SOURCES: Array<[string, string]> = [
  ['instagram.com', 'instagram'],
  ['facebook.com', 'facebook'],
  ['l.facebook.com', 'facebook'],
  ['tiktok.com', 'tiktok'],
  ['youtube.com', 'youtube'],
  ['youtu.be', 'youtube'],
  ['google.com', 'google'],
];

function clean(value: string | null, maxLength = 180): string {
  return (value || '').trim().slice(0, maxLength);
}

function safeStore(attribution: AttributionFields): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution should never interrupt the scan flow.
  }
}

function externalReferrer(): string {
  const referrer = clean(document.referrer, 600);
  if (!referrer) return '';

  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.hostname === window.location.hostname) return '';
    return referrer;
  } catch {
    return '';
  }
}

function sourceFromReferrer(referrer: string): string {
  try {
    const hostname = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    const matched = KNOWN_REFERRER_SOURCES.find(([domain]) => hostname === domain || hostname.endsWith(`.${domain}`));
    return matched?.[1] || '';
  } catch {
    return '';
  }
}

function isDirectFallback(attribution: AttributionFields): boolean {
  return (
    attribution.utm_source === 'direct' &&
    attribution.utm_medium === 'none' &&
    !attribution.utm_campaign &&
    !attribution.utm_content &&
    !attribution.utm_term &&
    !attribution.fbclid &&
    !attribution.gclid &&
    !attribution.referrer
  );
}

function hasAttribution(attribution: AttributionFields): boolean {
  return Object.values(attribution).some(Boolean);
}

export function captureAttributionFromUrl(): AttributionFields {
  const existing = loadAttribution();
  const params = new URLSearchParams(window.location.search);
  const attribution: AttributionFields = {};

  for (const key of UTM_KEYS) {
    const value = clean(params.get(key));
    if (value) attribution[key] = value;
  }

  for (const key of CLICK_ID_KEYS) {
    const value = clean(params.get(key), 600);
    if (value) attribution[key] = value;
  }

  const referrer = externalReferrer();
  if (referrer) {
    attribution.referrer = referrer;
  }

  if (!attribution.utm_source) {
    if (referrer) {
      const source = sourceFromReferrer(referrer);
      if (source) {
        attribution.utm_source = source;
        attribution.utm_medium = attribution.utm_medium || 'referral';
      }
    } else {
      attribution.utm_source = 'direct';
      attribution.utm_medium = attribution.utm_medium || 'none';
    }
  }

  if (hasAttribution(existing) && !isDirectFallback(existing)) {
    return existing;
  }

  if (hasAttribution(existing) && isDirectFallback(attribution)) {
    return existing;
  }

  safeStore(attribution);
  return attribution;
}

export function loadAttribution(): AttributionFields {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
