import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderFollowupEmail, type FollowupEmailType } from '../_shared/emailFollowups.ts';

interface ClaimedDelivery {
  id: string;
  lead_id: string;
  email: string;
  email_type: FollowupEmailType;
  first_name: string | null;
  business_name: string | null;
  industry: string | null;
  website_url: string | null;
  unsubscribe_token: string;
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function authorized(request: Request): boolean {
  const secret = Deno.env.get('FOLLOWUP_CRON_SECRET');
  if (!secret) return true;
  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${secret}` || request.headers.get('x-leadcheck-cron-secret') === secret;
}

async function sendResendEmail(input: {
  to: string;
  emailType: FollowupEmailType;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}): Promise<string> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('LEADCHECK_EMAIL_FROM') || 'Will from LeadCheck <will@leadcheck.ca>',
      reply_to: Deno.env.get('LEADCHECK_EMAIL_REPLY_TO') || 'william@wstrategiescanada.com',
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: {
        'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
      },
      tags: [
        { name: 'app', value: 'leadcheck' },
        { name: 'email_type', value: input.emailType },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Resend returned HTTP ${response.status}`);
  }

  return String(payload?.id || '');
}

Deno.serve(async request => {
  if (!['POST', 'GET'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!authorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = env('SUPABASE_URL');
  const supabase = createClient(supabaseUrl, env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const url = new URL(request.url);
  const batchSize = Math.min(Number(url.searchParams.get('limit') || '10') || 10, 50);
  const unsubscribeBaseUrl =
    Deno.env.get('LEADCHECK_UNSUBSCRIBE_URL') ||
    `${supabaseUrl.replace(/\/$/, '')}/functions/v1/leadcheck-unsubscribe`;

  const { data, error } = await supabase.rpc('claim_due_lead_followups', {
    batch_size: batchSize,
  });

  if (error) {
    console.error('[LeadCheck followups] Claim failed:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const claimed = (data || []) as ClaimedDelivery[];
  const results: Array<{ id: string; emailType: string; status: string; error?: string }> = [];

  for (const delivery of claimed) {
    const unsubscribeUrl = `${unsubscribeBaseUrl}?token=${encodeURIComponent(delivery.unsubscribe_token)}`;
    const email = renderFollowupEmail(
      delivery.email_type,
      {
        first_name: delivery.first_name,
        business_name: delivery.business_name,
        industry: delivery.industry,
        website_url: delivery.website_url,
      },
      unsubscribeUrl
    );

    try {
      const resendEmailId = await sendResendEmail({
        to: delivery.email,
        emailType: delivery.email_type,
        subject: email.subject,
        html: email.html,
        text: email.text,
        unsubscribeUrl,
      });

      await supabase.rpc('mark_lead_followup_sent', {
        p_delivery_id: delivery.id,
        p_resend_email_id: resendEmailId,
      });
      results.push({ id: delivery.id, emailType: delivery.email_type, status: 'sent' });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unknown email send error';
      console.error('[LeadCheck followups] Send failed:', { deliveryId: delivery.id, message });
      await supabase.rpc('mark_lead_followup_failed', {
        p_delivery_id: delivery.id,
        p_error: message,
      });
      results.push({ id: delivery.id, emailType: delivery.email_type, status: 'failed', error: message });
    }
  }

  return Response.json({
    ok: true,
    claimed: claimed.length,
    results,
  });
});
