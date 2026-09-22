do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select distinct c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.conrelid = 'public.leads'::regclass
      and c.contype = 'f'
      and a.attname = 'scan_id'
  loop
    execute format('alter table public.leads drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.leads
  alter column scan_id type text using scan_id::text;

create index if not exists leads_scan_idx on public.leads (scan_id);

notify pgrst, 'reload schema';
