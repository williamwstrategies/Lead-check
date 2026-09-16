import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LeadCheckReport } from '../../shared/leadcheck.js';

let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return cachedClient;
  }
  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export async function persistScanReport(report: LeadCheckReport): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.info('[LeadCheck] Supabase persistence skipped: service role config is not set');
    return;
  }

  const { error } = await supabase.from('scan_report_snapshots').upsert({
    id: report.id,
    scan_id: report.scan.id,
    normalized_domain: report.requestedWebsite.normalizedDomain,
    website_url: report.requestedWebsite.url,
    scanner_version: report.scannerVersion || report.scan.scannerVersion || null,
    status: report.scan.status,
    score: report.score.score,
    report_data: report,
    scan_metadata: report.scanMetadata || {},
    started_at: report.scan.startedAt,
    completed_at: report.scan.completedAt || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('[LeadCheck] Supabase persistence failed:', error.message);
  }
}
