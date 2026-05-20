create extension if not exists pgcrypto;

create table if not exists public.assets (
  code text primary key,
  name text,
  market text,
  quantity numeric(20, 6) not null default 0,
  avg_price numeric(20, 6),
  currency text default 'KRW',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_prices (
  code text not null,
  date date not null,
  price numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (code, date),
  constraint daily_prices_code_fkey
    foreign key (code)
    references public.assets (code)
    on delete cascade
);

create index if not exists idx_assets_quantity
  on public.assets (quantity);

create index if not exists idx_daily_prices_date
  on public.daily_prices (date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_assets_updated_at on public.assets;
create trigger trg_assets_updated_at
before update on public.assets
for each row
execute function public.set_updated_at();

drop trigger if exists trg_daily_prices_updated_at on public.daily_prices;
create trigger trg_daily_prices_updated_at
before update on public.daily_prices
for each row
execute function public.set_updated_at();

alter table public.assets enable row level security;
alter table public.daily_prices enable row level security;

drop policy if exists "Allow anon read assets" on public.assets;
create policy "Allow anon read assets"
on public.assets
for select
to anon, authenticated
using (true);

drop policy if exists "Allow anon read daily_prices" on public.daily_prices;
create policy "Allow anon read daily_prices"
on public.daily_prices
for select
to anon, authenticated
using (true);

drop policy if exists "Allow anon write assets" on public.assets;
create policy "Allow anon write assets"
on public.assets
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon write daily_prices" on public.daily_prices;
create policy "Allow anon write daily_prices"
on public.daily_prices
for all
to anon, authenticated
using (true)
with check (true);

