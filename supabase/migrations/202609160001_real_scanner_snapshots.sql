alter table public.scans
  add column if not exists scanner_version text,
  add column if not exists scan_method text,
  add column if not exists pages_analyzed integer,
  add column if not exists failed_pages integer,
  add column if not exists duration_ms integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.scan_pages (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.scans(id) on delete cascade,
  url text not null,
  page_type text,
  source text,
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_report_snapshots (
  id text primary key,
  scan_id text not null,
  normalized_domain text not null,
  website_url text not null,
  scanner_version text,
  status text not null default 'completed',
  score integer,
  report_data jsonb not null default '{}'::jsonb,
  scan_metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_pages_scan_idx on public.scan_pages (scan_id);
create index if not exists scan_report_snapshots_domain_created_idx
  on public.scan_report_snapshots (normalized_domain, created_at desc);
create index if not exists scan_report_snapshots_scan_idx
  on public.scan_report_snapshots (scan_id);

drop trigger if exists set_scan_report_snapshots_updated_at on public.scan_report_snapshots;
create trigger set_scan_report_snapshots_updated_at
before update on public.scan_report_snapshots
for each row execute function public.set_updated_at();

alter table public.scan_pages enable row level security;
alter table public.scan_report_snapshots enable row level security;
