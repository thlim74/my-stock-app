-- 1. Check current holdings that the collector will try to fetch.
select
  code,
  name,
  market,
  quantity,
  avg_price,
  currency,
  updated_at
from public.assets
where quantity > 0
order by market, code;

-- 2. Check the most recent saved daily prices.
select
  code,
  date,
  price,
  updated_at
from public.daily_prices
order by date desc, code asc
limit 100;

-- 3. Check today's collected rows only.
select
  code,
  date,
  price
from public.daily_prices
where date = current_date
order by code;

-- 4. Find holdings that still have no saved daily price for today.
select
  a.code,
  a.name,
  a.market,
  a.quantity
from public.assets a
left join public.daily_prices d
  on d.code = a.code
 and d.date = current_date
where a.quantity > 0
  and d.code is null
order by a.market, a.code;
