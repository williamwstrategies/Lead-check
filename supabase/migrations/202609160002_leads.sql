create table if not exists public.leads (
  id text primary key,
  first_name text not null,
  phone text not null,
  email text not null,
  business_name text not null,
  website_url text not null,
  normalized_domain text not null,
  scan_id text not null,
  anonymous_id text,
  idempotency_key text not null unique,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz not null default now()
);

create index if not exists leads_scan_idx on public.leads (scan_id);
create index if not exists leads_domain_created_idx on public.leads (normalized_domain, created_at desc);
create index if not exists leads_email_created_idx on public.leads (email, created_at desc);

alter table public.leads enable row level security;
