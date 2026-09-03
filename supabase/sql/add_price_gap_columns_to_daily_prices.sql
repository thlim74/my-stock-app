alter table if exists public.daily_prices
  add column if not exists regular_close numeric(20, 6),
  add column if not exists after_close numeric(20, 6),
  add column if not exists pre_open numeric(20, 6),
  add column if not exists regular_open numeric(20, 6),
  add column if not exists price_source text;

update public.daily_prices
set regular_close = coalesce(regular_close, price)
where regular_close is null;
