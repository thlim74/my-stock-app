alter table if exists public.app_state
add column if not exists cash_adjustment double precision not null default 0;

