-- Resolve Supabase Security Advisor warnings:
-- 1) Function Search Path Mutable: public.set_updated_at
-- 2) RLS Policy Always True: public.app_state
-- 3) RLS Policy Always True: public.assets
-- 4) RLS Policy Always True: public.daily_prices
--
-- Important:
-- - Apply this only after setting SUPABASE_SERVICE_ROLE_KEY in Vercel.
-- - Server API routes should use the service role key for DB reads/writes.
-- - Browser/anon direct table access will be blocked after this hardening.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table if exists public.app_state enable row level security;
alter table if exists public.assets enable row level security;
alter table if exists public.daily_prices enable row level security;

drop policy if exists "Allow anon read app_state" on public.app_state;
drop policy if exists "Allow anon write app_state" on public.app_state;

drop policy if exists "Allow anon read assets" on public.assets;
drop policy if exists "Allow anon write assets" on public.assets;

drop policy if exists "Allow anon read daily_prices" on public.daily_prices;
drop policy if exists "Allow anon write daily_prices" on public.daily_prices;

-- No replacement public policies are created intentionally.
-- service_role bypasses RLS and is used by the app's server API routes.
