-- Five-minute KOSPI/KOSDAQ investor net-buy snapshots collected while the app is open.
create table if not exists public.market_investor_snapshots (
  market text not null check (market in ('KOSPI', 'KOSDAQ')),
  captured_at timestamptz not null,
  net_values jsonb not null,
  created_at timestamptz not null default now(),
  primary key (market, captured_at)
);

create index if not exists idx_market_investor_snapshots_market_time
  on public.market_investor_snapshots (market, captured_at desc);
