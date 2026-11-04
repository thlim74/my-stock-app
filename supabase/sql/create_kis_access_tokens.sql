-- Server-only KIS bearer-token cache. RLS blocks browser access; the Supabase service-role key bypasses RLS.
create table if not exists public.kis_access_tokens (
  provider text primary key check (provider = 'KIS'),
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.kis_access_tokens enable row level security;

revoke all on table public.kis_access_tokens from anon, authenticated;
