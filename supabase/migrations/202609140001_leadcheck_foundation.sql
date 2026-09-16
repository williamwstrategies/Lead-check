create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  business_category text,
  business_subcategory text,
  primary_city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url text not null,
  normalized_domain text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  constraint scans_status_check check (status in ('queued', 'running', 'completed', 'failed'))
);

create table if not exists public.scan_scores (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.scans(id) on delete cascade,
  overall_score integer not null,
  google_visibility_score integer not null,
  lead_generation_score integer not null,
  trust_score integer not null,
  performance_score integer not null,
  experience_score integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  finding_key text not null,
  category text not null,
  severity text not null,
  priority integer not null default 0,
  status text not null,
  title text not null,
  summary text not null,
  why_it_matters text not null,
  recommended_action text not null,
  technical_details jsonb not null default '{}'::jsonb,
  source_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint scan_findings_severity_check check (severity in ('low', 'medium', 'high')),
  constraint scan_findings_status_check check (status in ('passed', 'warning', 'failed', 'informational'))
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  report_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists businesses_user_created_idx on public.businesses (user_id, created_at desc);
create index if not exists websites_business_domain_idx on public.websites (business_id, normalized_domain);
create index if not exists scans_website_created_idx on public.scans (website_id, created_at desc);
create index if not exists scan_findings_scan_priority_idx on public.scan_findings (scan_id, priority);
create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);
create index if not exists analytics_events_user_created_idx on public.analytics_events (user_id, created_at desc);
create index if not exists analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists set_websites_updated_at on public.websites;
create trigger set_websites_updated_at
before update on public.websites
for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.websites enable row level security;
alter table public.scans enable row level security;
alter table public.scan_scores enable row level security;
alter table public.scan_findings enable row level security;
alter table public.reports enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Profiles are updateable by owner" on public.profiles;
create policy "Profiles are updateable by owner"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Businesses are owned by users" on public.businesses;
create policy "Businesses are owned by users"
on public.businesses for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Websites follow business ownership" on public.websites;
create policy "Websites follow business ownership"
on public.websites for all to authenticated
using (
  exists (
    select 1 from public.businesses
    where businesses.id = websites.business_id
      and businesses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses
    where businesses.id = websites.business_id
      and businesses.user_id = auth.uid()
  )
);

drop policy if exists "Scans follow website ownership" on public.scans;
create policy "Scans follow website ownership"
on public.scans for all to authenticated
using (
  exists (
    select 1
    from public.websites
    join public.businesses on businesses.id = websites.business_id
    where websites.id = scans.website_id
      and businesses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.websites
    join public.businesses on businesses.id = websites.business_id
    where websites.id = scans.website_id
      and businesses.user_id = auth.uid()
  )
);

drop policy if exists "Scores follow scan ownership" on public.scan_scores;
create policy "Scores follow scan ownership"
on public.scan_scores for all to authenticated
using (
  exists (
    select 1
    from public.scans
    join public.websites on websites.id = scans.website_id
    join public.businesses on businesses.id = websites.business_id
    where scans.id = scan_scores.scan_id
      and businesses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.scans
    join public.websites on websites.id = scans.website_id
    join public.businesses on businesses.id = websites.business_id
    where scans.id = scan_scores.scan_id
      and businesses.user_id = auth.uid()
  )
);

drop policy if exists "Findings follow scan ownership" on public.scan_findings;
create policy "Findings follow scan ownership"
on public.scan_findings for all to authenticated
using (
  exists (
    select 1
    from public.scans
    join public.websites on websites.id = scans.website_id
    join public.businesses on businesses.id = websites.business_id
    where scans.id = scan_findings.scan_id
      and businesses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.scans
    join public.websites on websites.id = scans.website_id
    join public.businesses on businesses.id = websites.business_id
    where scans.id = scan_findings.scan_id
      and businesses.user_id = auth.uid()
  )
);

drop policy if exists "Reports are owned by users" on public.reports;
create policy "Reports are owned by users"
on public.reports for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Analytics events can be inserted by clients" on public.analytics_events;
create policy "Analytics events can be inserted by clients"
on public.analytics_events for insert to anon, authenticated
with check (true);

drop policy if exists "Analytics events are viewable by owner" on public.analytics_events;
create policy "Analytics events are viewable by owner"
on public.analytics_events for select to authenticated
using (user_id = auth.uid());
