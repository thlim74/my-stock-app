alter table if exists public.daily_prices
  add column if not exists regular_close numeric(20, 6),
  add column if not exists after_close numeric(20, 6),
  add column if not exists pre_open numeric(20, 6),
  add column if not exists regular_open numeric(20, 6),
  add column if not exists price_source text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_prices'
      and column_name = 'price'
  ) then
    execute 'update public.daily_prices set regular_close = coalesce(regular_close, price) where regular_close is null';
  end if;
end $$;
