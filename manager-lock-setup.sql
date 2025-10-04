-- Manager PIN Lock Status - Ready-to-run SQL for Supabase
-- Tracks failed attempts and lock window per UUID on the server.

create table if not exists public.manager_lock_status (
  id uuid primary key,
  attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.manager_lock_status is 'Per-UUID PIN attempts and lock status';

alter table public.manager_lock_status enable row level security;

-- Minimal policies: allow select and upsert from anon for simplicity.
-- NOTE: This lets clients write their own row. For stricter control, perform writes using service_role.
drop policy if exists "Allow anon select lock status" on public.manager_lock_status;
create policy "Allow anon select lock status"
  on public.manager_lock_status for select to anon using (true);

drop policy if exists "Allow anon upsert lock status" on public.manager_lock_status;
create policy "Allow anon upsert lock status"
  on public.manager_lock_status for insert to anon with check (true);

drop policy if exists "Allow anon update lock status" on public.manager_lock_status;
create policy "Allow anon update lock status"
  on public.manager_lock_status for update to anon using (true) with check (true);

-- Realtime publication
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.manager_lock_status';
  exception when duplicate_object then null;
  end;
end $$;

-- Admin reset example:
-- delete from public.manager_lock_status where id = '00000000-0000-0000-0000-000000000000';

