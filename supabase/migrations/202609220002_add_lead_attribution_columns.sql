alter table public.leads add column if not exists utm_source text;
alter table public.leads add column if not exists utm_medium text;
alter table public.leads add column if not exists utm_campaign text;
alter table public.leads add column if not exists utm_content text;
alter table public.leads add column if not exists utm_term text;
alter table public.leads add column if not exists fbclid text;
alter table public.leads add column if not exists gclid text;
alter table public.leads add column if not exists referrer text;

notify pgrst, 'reload schema';
