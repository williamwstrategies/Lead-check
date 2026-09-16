import type { AttributionFields } from '../../shared/leadcheck';

const STORAGE_KEY = 'leadcheck.attribution.v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export function captureAttributionFromUrl(): AttributionFields {
  const params = new URLSearchParams(window.location.search);
  const attribution: AttributionFields = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value.slice(0, 180);
  }

  if (Object.keys(attribution).length) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  }

  return loadAttribution();
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
