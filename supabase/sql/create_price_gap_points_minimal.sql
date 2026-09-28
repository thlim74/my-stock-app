-- Run this once in the Supabase SQL Editor for hrkfzsjjflbsgrhgqdfc.
-- This intentionally has no legacy daily_prices migration.

create table if not exists public.price_gap_points (
  code text not null,
  date date not null,
  point_type text not null
    check (point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')),
  price numeric(20, 6) not null,
  source text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (code, date, point_type)
);

create index if not exists idx_price_gap_points_code_date
  on public.price_gap_points (code, date desc);

alter table public.price_gap_points enable row level security;

grant select, insert, update on public.price_gap_points to anon, authenticated;

drop policy if exists "Allow read price gap points" on public.price_gap_points;
drop policy if exists "Allow insert valid price gap points" on public.price_gap_points;
drop policy if exists "Allow update valid price gap points" on public.price_gap_points;

create policy "Allow read price gap points"
on public.price_gap_points for select
to anon, authenticated
using (true);

create policy "Allow insert valid price gap points"
on public.price_gap_points for insert
to anon, authenticated
with check (
  code <> ''
  and date >= date '2000-01-01'
  and point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')
  and price > 0
);

create policy "Allow update valid price gap points"
on public.price_gap_points for update
to anon, authenticated
using (true)
with check (
  code <> ''
  and date >= date '2000-01-01'
  and point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')
  and price > 0
);

notify pgrst, 'reload schema';

select to_regclass('public.price_gap_points') as price_gap_points;
