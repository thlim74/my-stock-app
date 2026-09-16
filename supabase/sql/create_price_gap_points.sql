-- 보유종목 가격 갭 분석용 4개 가격 지점 저장소
-- 전일 정규장 종가, 전일 애프터마켓 종가, 당일 사전장 시초가, 당일 정규장 시초가를
-- 일자/종목/지점 단위로 보존합니다.

alter table if exists public.daily_prices
  add column if not exists regular_close numeric(20, 6),
  add column if not exists after_close numeric(20, 6),
  add column if not exists pre_open numeric(20, 6),
  add column if not exists regular_open numeric(20, 6),
  add column if not exists price_source text;

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

drop trigger if exists trg_price_gap_points_updated_at on public.price_gap_points;
create trigger trg_price_gap_points_updated_at
before update on public.price_gap_points
for each row
execute function public.set_updated_at();

alter table public.price_gap_points enable row level security;

grant select, insert, update on public.price_gap_points to anon, authenticated;

drop policy if exists "Allow read price gap points" on public.price_gap_points;
drop policy if exists "Allow insert valid price gap points" on public.price_gap_points;
drop policy if exists "Allow update valid price gap points" on public.price_gap_points;

create policy "Allow read price gap points"
on public.price_gap_points
for select
to anon, authenticated
using (
  point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')
);

create policy "Allow insert valid price gap points"
on public.price_gap_points
for insert
to anon, authenticated
with check (
  code <> ''
  and date >= date '2000-01-01'
  and point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')
  and price > 0
);

create policy "Allow update valid price gap points"
on public.price_gap_points
for update
to anon, authenticated
using (
  point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')
)
with check (
  code <> ''
  and date >= date '2000-01-01'
  and point_type in ('regular_close', 'after_close', 'pre_open', 'regular_open')
  and price > 0
);

do $$
declare
  has_daily_prices boolean;
  has_code boolean;
  has_date boolean;
  has_price boolean;
  has_regular_close boolean;
  close_expression text;
begin
  select to_regclass('public.daily_prices') is not null into has_daily_prices;
  if not has_daily_prices then
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'code'
  ) into has_code;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'date'
  ) into has_date;

  -- Some projects may already have a daily_prices table with a different shape.
  -- In that case create the new schema/permissions, but skip legacy data migration.
  if not has_code or not has_date then
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'price'
  ) into has_price;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'regular_close'
  ) into has_regular_close;

  if has_regular_close and has_price then
    close_expression := 'coalesce(regular_close, price)';
  elsif has_regular_close then
    close_expression := 'regular_close';
  elsif has_price then
    close_expression := 'price';
  else
    close_expression := null;
  end if;

  if close_expression is not null then
    execute format(
      'insert into public.price_gap_points (code, date, point_type, price, source)
       select dp.code, dp.date, %L, %s, %L
       from public.daily_prices as dp
       where %s is not null
       on conflict on constraint price_gap_points_pkey
       do update set price = excluded.price, source = excluded.source, captured_at = now()',
      'regular_close',
      replace(replace(close_expression, 'regular_close', 'dp.regular_close'), 'price', 'dp.price'),
      'daily_prices_migration',
      replace(replace(close_expression, 'regular_close', 'dp.regular_close'), 'price', 'dp.price')
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'after_close'
  ) then
    insert into public.price_gap_points (code, date, point_type, price, source)
    select dp.code, dp.date, 'after_close', dp.after_close, 'daily_prices_migration'
    from public.daily_prices as dp
    where dp.after_close is not null
    on conflict on constraint price_gap_points_pkey
    do update set price = excluded.price, source = excluded.source, captured_at = now();
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'pre_open'
  ) then
    insert into public.price_gap_points (code, date, point_type, price, source)
    select dp.code, dp.date, 'pre_open', dp.pre_open, 'daily_prices_migration'
    from public.daily_prices as dp
    where dp.pre_open is not null
    on conflict on constraint price_gap_points_pkey do nothing;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'regular_open'
  ) then
    insert into public.price_gap_points (code, date, point_type, price, source)
    select dp.code, dp.date, 'regular_open', dp.regular_open, 'daily_prices_migration'
    from public.daily_prices as dp
    where dp.regular_open is not null
    on conflict on constraint price_gap_points_pkey do nothing;
  end if;
end $$;

-- 앱 서버 API는 SUPABASE_SERVICE_ROLE_KEY로 접근하므로 공개 RLS 정책은 만들지 않습니다.
-- Vercel 환경변수에 SUPABASE_SERVICE_ROLE_KEY가 없으면 기록 API가 RLS에 막힐 수 있습니다.

notify pgrst, 'reload schema';
