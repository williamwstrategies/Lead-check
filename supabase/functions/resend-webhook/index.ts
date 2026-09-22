import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ResendWebhookEvent {
  type?: string;
  data?: {
    id?: string;
    email_id?: string;
    to?: string[] | string;
    email?: string;
    recipient?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

async function verifySvixSignature(payload: string, request: Request): Promise<boolean> {
  const id = request.headers.get('svix-id') || '';
  const timestamp = request.headers.get('svix-timestamp') || '';
  const signatureHeader = request.headers.get('svix-signature') || '';
  const secret = env('RESEND_WEBHOOK_SECRET').replace(/^whsec_/, '');

  if (!id || !timestamp || !signatureHeader || !secret) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > 60 * 5) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return signatureHeader
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean)
    .some(part => {
      const [, value] = part.split(',');
      return value ? timingSafeEqual(value, expected) : false;
    });
}

function recipientFromEvent(event: ResendWebhookEvent): string {
  const to = event.data?.to;
  if (Array.isArray(to)) return String(to[0] || '').trim().toLowerCase();
  return String(to || event.data?.email || event.data?.recipient || '').trim().toLowerCase();
}

function resendEmailId(event: ResendWebhookEvent): string {
  return String(event.data?.email_id || event.data?.id || '').trim();
}

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawPayload = await request.text();
  const verified = await verifySvixSignature(rawPayload, request);
  if (!verified) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(rawPayload) as ResendWebhookEvent;
  const eventType = String(event.type || '');
  const eventId = request.headers.get('svix-id') || crypto.randomUUID();
  const emailId = resendEmailId(event);
  const recipient = recipientFromEvent(event);

  const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existing = await supabase.from('resend_webhook_events').select('id').eq('id', eventId).maybeSingle();
  if (existing.data?.id) {
    return Response.json({ ok: true, duplicate: true });
  }

  if (eventType === 'email.bounced') {
    if (emailId) {
      await supabase.rpc('suppress_leadcheck_resend_email', {
        p_resend_email_id: emailId,
        p_reason: 'hard_bounce',
      });
    }
    if (recipient) {
      await supabase.rpc('suppress_leadcheck_email', {
        p_email: recipient,
        p_reason: 'hard_bounce',
      });
    }
  }

  if (eventType === 'email.complained') {
    if (emailId) {
      await supabase.rpc('suppress_leadcheck_resend_email', {
        p_resend_email_id: emailId,
        p_reason: 'complained',
      });
    }
    if (recipient) {
      await supabase.rpc('suppress_leadcheck_email', {
        p_email: recipient,
        p_reason: 'complained',
      });
    }
  }

  if (eventType === 'email.suppressed') {
    if (emailId) {
      await supabase.rpc('suppress_leadcheck_resend_email', {
        p_resend_email_id: emailId,
        p_reason: 'suppressed',
      });
    }
    if (recipient) {
      await supabase.rpc('suppress_leadcheck_email', {
        p_email: recipient,
        p_reason: 'suppressed',
      });
    }
  }

  const { error } = await supabase.from('resend_webhook_events').insert({
    id: eventId,
    event_type: eventType || 'unknown',
    resend_email_id: emailId || null,
    payload: event,
  });

  if (error) {
    console.error('[LeadCheck Resend webhook] Event log failed:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
});
