import crypto from 'node:crypto';
import type { ApiErrorBody, AttributionFields, LeadCaptureRequest, LeadRecord } from '../../shared/leadcheck.js';
import { normalizeWebsiteUrl } from '../lib/url.js';
import { getSupabaseAdmin } from './persistence.js';

interface StoredLead {
  record: LeadRecord;
  idempotencyKey: string;
  anonymousId: string;
}

const inMemoryLeads = new Map<string, StoredLead>();

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const ATTRIBUTION_KEYS = [...UTM_KEYS, 'fbclid', 'gclid', 'referrer'] as const;
const OPTIONAL_DB_ATTRIBUTION_KEYS = ['fbclid', 'gclid', 'referrer'] as const;
const OPTIONAL_DB_CONSENT_KEYS = ['marketing_consent', 'marketing_consent_at'] as const;

export class LeadCaptureError extends Error {
  statusCode: number;
  body: ApiErrorBody;

  constructor(statusCode: number, body: ApiErrorBody) {
    super(body.error);
    this.name = 'LeadCaptureError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

function deterministicUuid(value: string): string {
  const bytes = Buffer.from(crypto.createHash('sha1').update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeEmail(value: unknown): string {
  const email = cleanText(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new LeadCaptureError(422, {
      error: 'Enter a valid email address.',
      code: 'invalid_email',
    });
  }
  return email;
}

function normalizePhone(value: unknown): string {
  const raw = cleanText(value, 80);
  const withoutExtension = raw.replace(/\s*(?:ext\.?|x)\s*\d+\s*$/i, '');
  const hasLeadingPlus = withoutExtension.trim().startsWith('+');
  const digits = withoutExtension.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    throw new LeadCaptureError(422, {
      error: 'Enter a valid phone number.',
      code: 'invalid_phone',
    });
  }

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `${hasLeadingPlus ? '+' : ''}${digits}`;
}

function normalizeAttribution(input?: AttributionFields): AttributionFields {
  const attribution: AttributionFields = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = cleanText(input?.[key], key === 'referrer' ? 600 : 180);
    if (value) attribution[key] = value;
  }
  return attribution;
}

function isMissingOptionalAttributionColumn(error: { code?: string; message?: string; details?: unknown }): boolean {
  const details = typeof error.details === 'string' ? error.details : JSON.stringify(error.details || '');
  const message = `${error.message || ''} ${details}`.toLowerCase();
  return (
    error.code === 'PGRST204' &&
    [...OPTIONAL_DB_ATTRIBUTION_KEYS, ...OPTIONAL_DB_CONSENT_KEYS].some(key => message.includes(key.toLowerCase()))
  );
}

function leadId(input: LeadCaptureRequest, normalizedDomain: string, email: string): string {
  const requestedKey = cleanText(input.idempotencyKey, 120);
  return deterministicUuid(requestedKey || `${input.scanId}:${normalizedDomain}:${email}`);
}

function dedupeKeyFor(input: LeadCaptureRequest, normalizedDomain: string, email: string): string {
  const requestedKey = cleanText(input.idempotencyKey, 120);
  return requestedKey || `${input.scanId}:${normalizedDomain}:${email}`;
}

export async function captureLead(input: LeadCaptureRequest, anonymousId = ''): Promise<{ lead: LeadRecord; deduplicated: boolean }> {
  const firstName = cleanText(input.firstName, 80);
  const businessName = cleanText(input.businessName, 160);
  const scanId = cleanText(input.scanId, 96);

  if (!firstName) {
    throw new LeadCaptureError(422, {
      error: 'Enter your first name.',
      code: 'missing_first_name',
    });
  }
  if (!businessName) {
    throw new LeadCaptureError(422, {
      error: 'Enter your business name.',
      code: 'missing_business_name',
    });
  }
  if (!/^scan_[a-zA-Z0-9_-]{12,80}$/.test(scanId)) {
    throw new LeadCaptureError(422, {
      error: 'The scan could not be associated with this lead. Please restart the scan.',
      code: 'invalid_scan_id',
    });
  }

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const website = normalizeWebsiteUrl(String(input.websiteUrl || ''));
  const attribution = normalizeAttribution(input.attribution);
  const marketingConsent = input.marketingConsent === true;
  const idempotencyKey = dedupeKeyFor(input, website.normalizedDomain, email);
  const existing = inMemoryLeads.get(idempotencyKey);

  if (existing) {
    return { lead: existing.record, deduplicated: true };
  }

  const createdAt = new Date().toISOString();
  const lead: LeadRecord = {
    id: leadId(input, website.normalizedDomain, email),
    first_name: firstName,
    phone,
    email,
    business_name: businessName,
    website_url: website.url,
    normalized_domain: website.normalizedDomain,
    scan_id: scanId,
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsent ? createdAt : null,
    created_at: createdAt,
    ...attribution,
  };

  inMemoryLeads.set(idempotencyKey, { record: lead, idempotencyKey, anonymousId });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.info('[LeadCheck] Lead persistence using in-memory store: service role config is not set');
    return { lead, deduplicated: false };
  }

  const leadPayload: Record<string, string | boolean | null> = {
    id: lead.id,
    first_name: lead.first_name,
    phone: lead.phone,
    email: lead.email,
    business_name: lead.business_name,
    website_url: lead.website_url,
    normalized_domain: lead.normalized_domain,
    scan_id: lead.scan_id,
    idempotency_key: idempotencyKey,
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsent ? createdAt : null,
    created_at: lead.created_at,
  };

  for (const key of ATTRIBUTION_KEYS) {
    const value = lead[key];
    if (value) leadPayload[key] = value;
  }

  let { error } = await supabase.from('leads').insert(leadPayload);

  if (error && isMissingOptionalAttributionColumn(error)) {
    const fallbackPayload = { ...leadPayload };
    for (const key of [...OPTIONAL_DB_ATTRIBUTION_KEYS, ...OPTIONAL_DB_CONSENT_KEYS]) {
      delete fallbackPayload[key];
    }
    const retry = await supabase.from('leads').insert(fallbackPayload);
    error = retry.error;
    if (!error) {
      console.warn('[LeadCheck] Lead saved without optional attribution or marketing consent columns. Run the latest Supabase migration.');
    }
  }

  if (error?.code === '23505') {
    return { lead, deduplicated: true };
  }

  if (error) {
    inMemoryLeads.delete(idempotencyKey);
    console.warn('[LeadCheck] Lead persistence failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new LeadCaptureError(502, {
      error: 'We could not save your information. Please try again.',
      code: 'lead_persistence_failed',
    });
  }

  return { lead, deduplicated: false };
}

export function clearInMemoryLeadsForTests(): void {
  inMemoryLeads.clear();
}
