-- 009: Admin panel — role, last_active, country для users
alter table public.users
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

alter table public.users
  add column if not exists last_active timestamptz;

alter table public.users
  add column if not exists country text;

create index if not exists idx_users_role        on public.users (role);
create index if not exists idx_users_last_active on public.users (last_active);
create index if not exists idx_users_created_at  on public.users (created_at);

-- Единственный админ — владелец продукта
update public.users set role = 'admin' where email = 'admin@kitstartai.com';
