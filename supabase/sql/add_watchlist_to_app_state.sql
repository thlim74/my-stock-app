-- Portfolio-specific watchlist, stored separately from positions and transactions.
alter table if exists public.app_state
  add column if not exists watchlist jsonb not null default '[]'::jsonb;
