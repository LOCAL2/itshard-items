-- Manager Whitelist - Ready-to-run SQL for Supabase
-- This script creates the whitelist table, enables RLS, adds minimal policies
-- for read-only lookup from the client (anon key), and enables realtime.

-- 1) Create table
create table if not exists public.manager_whitelist (
  id uuid primary key,
  created_at timestamptz not null default now(),
  note text
);

comment on table public.manager_whitelist is 'Whitelist of UUIDs allowed to access Manager PIN form';
comment on column public.manager_whitelist.id is 'Client-provided UUID to authorize PIN entry';

-- 2) Enable Row Level Security
alter table public.manager_whitelist enable row level security;

-- 3) Policies
-- Allow read-only lookup from the public anon client (required by frontend to verify UUID)
drop policy if exists "Allow anon select for whitelist lookup" on public.manager_whitelist;
create policy "Allow anon select for whitelist lookup"
  on public.manager_whitelist
  for select
  to anon
  using (true);

-- (Optional) Allow authenticated users to select as well
drop policy if exists "Allow authenticated select for whitelist lookup" on public.manager_whitelist;
create policy "Allow authenticated select for whitelist lookup"
  on public.manager_whitelist
  for select
  to authenticated
  using (true);

-- NOTE: Inserts/updates should be done by admin (via Supabase Studio) or server-side with service_role.
-- The service_role bypasses RLS, so no insert/update policies are required here.

-- 4) Realtime: add table to the supabase_realtime publication (harmless if run multiple times)
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.manager_whitelist';
  exception when duplicate_object then
    null; -- already added
  end;
end $$;

-- 5) Example admin insert (replace with a real UUID when needed)
-- insert into public.manager_whitelist (id, note) values ('00000000-0000-0000-0000-000000000000', 'Example user');

-- 6) Quick test query (should return 0 or 1 rows)
-- select id from public.manager_whitelist where id = '00000000-0000-0000-0000-000000000000' limit 1;

