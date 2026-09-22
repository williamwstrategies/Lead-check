alter table public.leads add column if not exists marketing_consent boolean not null default false;
alter table public.leads add column if not exists marketing_consent_at timestamptz;

create table if not exists public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed boolean not null default true,
  unsubscribe_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  suppression_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  email text not null,
  email_type text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  resend_email_id text,
  status text not null default 'scheduled',
  error text,
  attempt_count integer not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_email_deliveries_status_check
    check (status in ('scheduled', 'sending', 'sent', 'failed', 'bounced', 'complained', 'suppressed', 'cancelled')),
  constraint lead_email_deliveries_type_check
    check (email_type in ('followup_day_1', 'followup_day_3', 'followup_day_6')),
  constraint lead_email_deliveries_unique_email unique (lead_id, email_type)
);

create table if not exists public.resend_webhook_events (
  id text primary key,
  event_type text not null,
  resend_email_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists email_subscriptions_email_idx
  on public.email_subscriptions (email);

create index if not exists email_subscriptions_token_idx
  on public.email_subscriptions (unsubscribe_token);

create index if not exists lead_email_deliveries_due_idx
  on public.lead_email_deliveries (status, scheduled_for)
  where sent_at is null;

create index if not exists lead_email_deliveries_lead_idx
  on public.lead_email_deliveries (lead_id, scheduled_for);

create index if not exists lead_email_deliveries_resend_idx
  on public.lead_email_deliveries (resend_email_id)
  where resend_email_id is not null;

drop trigger if exists set_email_subscriptions_updated_at on public.email_subscriptions;
create trigger set_email_subscriptions_updated_at
before update on public.email_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_lead_email_deliveries_updated_at on public.lead_email_deliveries;
create trigger set_lead_email_deliveries_updated_at
before update on public.lead_email_deliveries
for each row execute function public.set_updated_at();

create or replace function public.schedule_leadcheck_followups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  subscription_record public.email_subscriptions%rowtype;
begin
  if coalesce(new.marketing_consent, false) is not true then
    return new;
  end if;

  normalized_email := lower(trim(new.email));
  if normalized_email = '' then
    return new;
  end if;

  insert into public.email_subscriptions (email, subscribed)
  values (normalized_email, true)
  on conflict (email) do update
    set subscribed = case
        when public.email_subscriptions.bounced_at is null
         and public.email_subscriptions.complained_at is null
        then true
        else public.email_subscriptions.subscribed
      end,
      unsubscribed_at = case
        when public.email_subscriptions.bounced_at is null
         and public.email_subscriptions.complained_at is null
        then null
        else public.email_subscriptions.unsubscribed_at
      end,
      suppression_reason = case
        when public.email_subscriptions.bounced_at is null
         and public.email_subscriptions.complained_at is null
        then null
        else public.email_subscriptions.suppression_reason
      end,
      updated_at = now()
  returning * into subscription_record;

  if subscription_record.subscribed is not true
    or subscription_record.bounced_at is not null
    or subscription_record.complained_at is not null then
    return new;
  end if;

  insert into public.lead_email_deliveries (lead_id, email, email_type, scheduled_for)
  values
    (new.id::text, normalized_email, 'followup_day_1', coalesce(new.created_at, now()) + interval '1 day'),
    (new.id::text, normalized_email, 'followup_day_3', coalesce(new.created_at, now()) + interval '3 days'),
    (new.id::text, normalized_email, 'followup_day_6', coalesce(new.created_at, now()) + interval '6 days')
  on conflict (lead_id, email_type) do nothing;

  return new;
end;
$$;

drop trigger if exists schedule_leadcheck_followups_on_leads on public.leads;
create trigger schedule_leadcheck_followups_on_leads
after insert on public.leads
for each row execute function public.schedule_leadcheck_followups();

create or replace function public.claim_due_lead_followups(batch_size integer default 10)
returns table (
  id uuid,
  lead_id text,
  email text,
  email_type text,
  first_name text,
  business_name text,
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
    l.website_url,
    s.unsubscribe_token
  from claimed c
  join public.leads l on l.id::text = c.lead_id
  join public.email_subscriptions s on s.email = lower(trim(c.email));
$$;

create or replace function public.mark_lead_followup_sent(p_delivery_id uuid, p_resend_email_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.lead_email_deliveries
    set status = 'sent',
        sent_at = now(),
        resend_email_id = p_resend_email_id,
        locked_at = null,
        error = null,
        updated_at = now()
  where id = p_delivery_id
    and status = 'sending'
    and sent_at is null;
$$;

create or replace function public.mark_lead_followup_failed(p_delivery_id uuid, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.lead_email_deliveries
    set status = 'failed',
        error = left(coalesce(p_error, 'Unknown email send error'), 1000),
        locked_at = null,
        updated_at = now()
  where id = p_delivery_id
    and status = 'sending'
    and sent_at is null;
$$;

create or replace function public.unsubscribe_leadcheck_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.email_subscriptions
    set subscribed = false,
        unsubscribed_at = coalesce(unsubscribed_at, now()),
        suppression_reason = 'unsubscribed',
        updated_at = now()
  where unsubscribe_token = p_token;

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

create or replace function public.suppress_leadcheck_email(p_email text, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
begin
  if normalized_email = '' then
    return false;
  end if;

  insert into public.email_subscriptions (
    email,
    subscribed,
    unsubscribed_at,
    bounced_at,
    complained_at,
    suppression_reason
  )
  values (
    normalized_email,
    false,
    case when p_reason = 'unsubscribed' then now() else null end,
    case when p_reason in ('bounced', 'hard_bounce', 'suppressed') then now() else null end,
    case when p_reason = 'complained' then now() else null end,
    p_reason
  )
  on conflict (email) do update
    set subscribed = false,
        unsubscribed_at = case
          when p_reason = 'unsubscribed' then coalesce(public.email_subscriptions.unsubscribed_at, now())
          else public.email_subscriptions.unsubscribed_at
        end,
        bounced_at = case
          when p_reason in ('bounced', 'hard_bounce', 'suppressed') then coalesce(public.email_subscriptions.bounced_at, now())
          else public.email_subscriptions.bounced_at
        end,
        complained_at = case
          when p_reason = 'complained' then coalesce(public.email_subscriptions.complained_at, now())
          else public.email_subscriptions.complained_at
        end,
        suppression_reason = p_reason,
        updated_at = now();

  return true;
end;
$$;

create or replace function public.suppress_leadcheck_resend_email(p_resend_email_id text, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_email text;
begin
  select email into recipient_email
  from public.lead_email_deliveries
  where resend_email_id = p_resend_email_id
  order by updated_at desc
  limit 1;

  if recipient_email is null then
    return false;
  end if;

  update public.lead_email_deliveries
    set status = case
        when p_reason = 'complained' then 'complained'
        when p_reason in ('bounced', 'hard_bounce') then 'bounced'
        else 'suppressed'
      end,
      error = p_reason,
      updated_at = now()
  where resend_email_id = p_resend_email_id;

  return public.suppress_leadcheck_email(recipient_email, p_reason);
end;
$$;

alter table public.email_subscriptions enable row level security;
alter table public.lead_email_deliveries enable row level security;
alter table public.resend_webhook_events enable row level security;

notify pgrst, 'reload schema';
