import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function html(title: string, message: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f7faf8;color:#111827;font-family:Arial,Helvetica,sans-serif;">
    <main style="min-height:100vh;display:grid;place-items:center;padding:28px;">
      <section style="max-width:560px;background:#fff;border:1px solid #dbe5df;border-radius:12px;padding:32px;box-shadow:0 14px 42px rgba(17,24,39,.08);">
        <div style="color:#0f766e;font-weight:800;font-size:20px;margin-bottom:18px;">LeadCheck</div>
        <h1 style="font-size:32px;line-height:1.1;margin:0 0 14px;">${title}</h1>
        <p style="font-size:17px;line-height:1.6;color:#5f6b66;margin:0;">${message}</p>
      </section>
    </main>
  </body>
</html>`,
    {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }
  );
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

Deno.serve(async request => {
  if (!['GET', 'POST'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim() || '';
  if (!token || token.length < 32) {
    return html('Unsubscribe link invalid', 'This unsubscribe link is missing or invalid. Reply to any LeadCheck email and we can help.');
  }

  const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc('unsubscribe_leadcheck_token', {
    p_token: token,
  });

  if (error) {
    console.error('[LeadCheck unsubscribe] Failed:', error);
    return html('Something went wrong', 'We could not process that unsubscribe request. Reply to any LeadCheck email and we can help.');
  }

  if (data !== true) {
    return html('Unsubscribe link not found', 'This unsubscribe link may already have been used or is no longer valid.');
  }

  return html('You are unsubscribed', 'You will no longer receive promotional LeadCheck follow-up emails.');
});
