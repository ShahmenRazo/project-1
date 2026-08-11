-- 011: Admin management — banned, Pro-транзакции (ls_orders), audit log (admin_logs), hard delete

-- ---------- 1. Soft-ban пользователей ----------
alter table public.users
  add column if not exists banned boolean not null default false;

create index if not exists idx_users_banned on public.users (banned);

-- ---------- 2. Pro-транзакции LemonSqueezy (финансы) ----------
create table if not exists public.ls_orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users (id) on delete cascade,
  email          text,
  amount         numeric(10,2) not null,
  currency       text not null default 'USD',
  status         text not null default 'succeeded'
                 check (status in ('succeeded', 'failed', 'refunded')),
  payment_method text not null default 'LemonSqueezy',
  invoice_id     text,
  ls_order_id    text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_ls_orders_user    on public.ls_orders (user_id);
create index if not exists idx_ls_orders_created on public.ls_orders (created_at);

-- ---------- 3. Audit log административных действий ----------
create table if not exists public.admin_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users (id) on delete set null,
  action       text not null
               check (action in ('ban_user', 'unban_user', 'delete_user', 'impersonate', 'refund', 'toggle_pro')),
  target_id    uuid,
  target_email text,
  metadata     jsonb not null default '{}'::jsonb,
  ip_address   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_admin_logs_created on public.admin_logs (created_at desc);
create index if not exists idx_admin_logs_user    on public.admin_logs (user_id);

-- RLS включён, политики отсутствуют: доступ только через service_role (bypass RLS).
alter table public.ls_orders  enable row level security;
alter table public.admin_logs enable row level security;

-- ---------- 4. Hard delete (GDPR): пользователь + все связанные данные + auth.users ----------
create or replace function public.admin_hard_delete_user(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- группы пользователя и всё, что висит на них
  delete from public.group_balances  gb using public.groups g where gb.group_id = g.id and g.creator_id = p_uid;
  delete from public.invites         i  using public.groups g where i.group_id  = g.id and g.creator_id = p_uid;
  delete from public.public_invites  pi using public.groups g where pi.group_id = g.id and g.creator_id = p_uid;
  delete from public.groups          where creator_id = p_uid;

  -- прямые связи пользователя
  delete from public.group_members      where user_id = p_uid;
  delete from public.payments           where from_user_id = p_uid or to_user_id = p_uid;
  delete from public.notifications      where user_id = p_uid;
  delete from public.push_subscriptions where user_id = p_uid;
  delete from public.referrals          where user_id = p_uid or referred_by = p_uid;
  delete from public.error_reports      where user_id = p_uid;
  delete from public.ls_orders          where user_id = p_uid;
  delete from public.subscriptions      where user_id = p_uid;

  delete from public.users where id = p_uid;
  delete from auth.users   where id = p_uid;
end;
$$;

revoke execute on function public.admin_hard_delete_user(uuid) from public, anon, authenticated;
grant  execute on function public.admin_hard_delete_user(uuid) to service_role;
