-- Item Schedules - ready to run
-- Creates table, index, and RLS policies for server-backed schedules

begin;

create table if not exists public.item_schedules (
  item_id uuid primary key references public.items(id) on delete cascade,
  start_iso text not null,
  end_iso text not null,
  updated_at timestamptz not null default now()
);

-- Helpful index for sync/ordering
create index if not exists idx_item_schedules_updated_at on public.item_schedules(updated_at desc);

-- Enable RLS
alter table public.item_schedules enable row level security;

-- Read policy (public read). If you want to restrict reading, replace `true` by a condition.
drop policy if exists "read schedules" on public.item_schedules;
create policy "read schedules" on public.item_schedules
for select using (true);

-- Write policies
-- NOTE: Current app calls from anon context. If you have Supabase Auth wired and want to restrict to managers,
-- replace `true` with a check such as `auth.role() = 'authenticated'` or whitelist logic.
drop policy if exists "insert schedules" on public.item_schedules;
create policy "insert schedules" on public.item_schedules
for insert with check (true);

drop policy if exists "update schedules" on public.item_schedules;
create policy "update schedules" on public.item_schedules
for update using (true) with check (true);

drop policy if exists "delete schedules" on public.item_schedules;
create policy "delete schedules" on public.item_schedules
for delete using (true);

commit;

-- Optional: Stricter write example (commented) that ties to a whitelist table by user id
-- Requires Supabase Auth and manager_whitelist(id uuid) where id=auth.uid().
-- To enable, first revoke the open write policies above and then use these instead.
--
-- drop policy if exists "insert schedules" on public.item_schedules;
-- create policy "insert schedules" on public.item_schedules
-- for insert with check (exists(select 1 from public.manager_whitelist mw where mw.id = auth.uid()));
--
-- drop policy if exists "update schedules" on public.item_schedules;
-- create policy "update schedules" on public.item_schedules
-- for update using (exists(select 1 from public.manager_whitelist mw where mw.id = auth.uid()))
--          with check (exists(select 1 from public.manager_whitelist mw where mw.id = auth.uid()));
--
-- drop policy if exists "delete schedules" on public.item_schedules;
-- create policy "delete schedules" on public.item_schedules
-- for delete using (exists(select 1 from public.manager_whitelist mw where mw.id = auth.uid()));

