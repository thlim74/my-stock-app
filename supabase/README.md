# Supabase setup

Run [schema.sql](C:\Users\USER\Desktop\개발\my-stock-app\supabase\schema.sql) in the Supabase SQL editor to create the minimum tables this app currently expects:

- `assets`
- `daily_prices`

Then run [seed-assets.sql](C:\Users\USER\Desktop\개발\my-stock-app\supabase\seed-assets.sql) to insert example holdings that `/api/price/daily` can collect from immediately.

## Why these tables exist

- `assets` is used by `/api/price/daily` to find held stock codes with `quantity > 0`.
- `daily_prices` stores the fetched closing price per `code + date`.
- `daily_prices.regular_close`, `after_close`, `pre_open`, and `regular_open` are optional price-gap analysis fields used by the holdings tab.

## Optional migrations

If `daily_prices` was already created before the price-gap analysis feature, run [sql/add_price_gap_columns_to_daily_prices.sql](C:\Users\USER\Desktop\개발\38.my-stock-app\supabase\sql\add_price_gap_columns_to_daily_prices.sql) once in the Supabase SQL editor.

## Current security note

The current server route writes with `NEXT_PUBLIC_SUPABASE_ANON_KEY`, so `schema.sql` includes broad RLS policies to keep the app working immediately.

For production, a safer next step is:

1. Move write operations to a server-side service role key.
2. Tighten the insert/update/delete policies so anonymous clients cannot write directly.
