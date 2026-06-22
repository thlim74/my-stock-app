-- Resolve Supabase Security Advisor warnings for public.stocks:
-- 1) Policy Exists RLS Disabled
-- 2) RLS Disabled in Public
--
-- This app currently does not read public.stocks directly. If you still want to
-- keep the table as public stock reference data, use the read-only setup below.

alter table if exists public.stocks enable row level security;

-- Keep stock reference data readable, but prevent browser/anon writes.
drop policy if exists "Enable read access for all users" on public.stocks;
drop policy if exists "Allow anon write stocks" on public.stocks;
drop policy if exists "Allow authenticated write stocks" on public.stocks;

create policy "Enable read access for all users"
on public.stocks
for select
to anon, authenticated
using (true);

-- Optional stricter alternative:
-- If public.stocks is not needed at all, run this instead after backup:
-- drop table if exists public.stocks;
