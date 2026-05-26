create table if not exists public.app_users (
  id text primary key,
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('admin', 'user')),
  is_active boolean not null default true,
  password_hash text not null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_username on public.app_users (username);
create index if not exists idx_app_users_role on public.app_users (role);
