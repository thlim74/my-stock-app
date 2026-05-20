-- Replace the sample rows below with your real holdings before running in production.
-- `quantity > 0` rows are picked up by `/api/price/daily`.

insert into public.assets (
  code,
  name,
  market,
  quantity,
  avg_price,
  currency
)
values
  ('005930', '삼성전자', 'KRX', 10, 72000, 'KRW'),
  ('000660', 'SK하이닉스', 'KRX', 4, 185000, 'KRW'),
  ('035420', 'NAVER', 'KRX', 3, 210000, 'KRW'),
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

-- Example: remove all sample holdings if you want to restart cleanly.
-- delete from public.assets
-- where code in ('005930', '000660', '035420', 'AAPL', 'MSFT');
