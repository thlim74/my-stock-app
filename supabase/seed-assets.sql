-- Replace the sample rows below with your real holdings before running in production.
-- `quantity > 0` rows are picked up by `/api/price/daily`.
-- Edit only these columns for a quick start:
--   quantity   : current holding shares
--   avg_price  : average buy price
--   currency   : KRW or USD

insert into public.assets (
  code,
  name,
  market,
  quantity,
  avg_price,
  currency
)
values
  ('005930', '삼성전자', 'KOSPI', 10, 72000, 'KRW'),
  ('000660', 'SK하이닉스', 'KOSPI', 4, 185000, 'KRW'),
  ('005380', '현대차', 'KOSPI', 2, 240000, 'KRW'),
  ('009830', '한화솔루션', 'KOSPI', 6, 26000, 'KRW'),
  ('015760', '한국전력', 'KOSPI', 8, 22000, 'KRW'),
  ('AMEX:SLV', 'iShares Silver Trust', 'AMEX', 5, 28.00, 'USD'),
  ('AAPL', 'Apple', 'NASDAQ', 2, 185.50, 'USD'),
  ('MSFT', 'Microsoft', 'NASDAQ', 1, 420.00, 'USD')
on conflict (code)
do update set
  name = excluded.name,
  market = excluded.market,
  quantity = excluded.quantity,
  avg_price = excluded.avg_price,
  currency = excluded.currency,
  updated_at = now();

-- Example: mark a holding as no longer active without deleting its history.
-- update public.assets set quantity = 0 where code = '005930';

-- Example: add one more holding manually.
-- insert into public.assets (code, name, market, quantity, avg_price, currency)
-- values ('035420', 'NAVER', 'KOSPI', 3, 210000, 'KRW')
-- on conflict (code) do update set
--   quantity = excluded.quantity,
--   avg_price = excluded.avg_price,
--   updated_at = now();

-- Example: remove all sample holdings if you want to restart cleanly.
-- delete from public.assets
-- where code in ('005930', '000660', '005380', '009830', '015760', 'AMEX:SLV', 'AAPL', 'MSFT');
