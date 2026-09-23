alter table public.leads add column if not exists industry text;

create or replace function public.claim_due_lead_followups(batch_size integer default 10)
returns table (
  id uuid,
  lead_id text,
  email text,
  email_type text,
  first_name text,
  business_name text,
  industry text,
  website_url text,
  unsubscribe_token text
)
language sql
security definer
set search_path = public
as $$
  with due as (
    select d.id
    from public.lead_email_deliveries d
    join public.leads l on l.id::text = d.lead_id
    join public.email_subscriptions s on s.email = lower(trim(d.email))
    where d.status in ('scheduled', 'failed')
      and d.sent_at is null
      and d.scheduled_for <= now()
      and coalesce(d.attempt_count, 0) < 5
      and coalesce(l.marketing_consent, false) = true
      and coalesce(s.subscribed, false) = true
      and s.unsubscribed_at is null
      and s.bounced_at is null
      and s.complained_at is null
    order by d.scheduled_for asc, d.created_at asc
    limit greatest(batch_size, 1)
    for update of d skip locked
  ),
  claimed as (
    update public.lead_email_deliveries d
      set status = 'sending',
          locked_at = now(),
          attempt_count = d.attempt_count + 1,
          error = null,
          updated_at = now()
    from due
    where d.id = due.id
    returning d.*
  )
  select
    c.id,
    c.lead_id,
    c.email,
    c.email_type,
    l.first_name,
    l.business_name,
    l.industry,
    l.website_url,
    s.unsubscribe_token
  from claimed c
  join public.leads l on l.id::text = c.lead_id
  join public.email_subscriptions s on s.email = lower(trim(c.email));
$$;

notify pgrst, 'reload schema';
