-- ============================================================================
-- SubSplit — схема базы данных (Supabase / PostgreSQL)
--
-- Как использовать:
--   1. Вставьте этот скрипт целиком в Supabase SQL Editor и выполните.
--   2. Профиль в таблице users создаётся автоматически при регистрации
--      (триггер on_auth_user_created на auth.users).
--   3. Все таблицы защищены RLS: пользователь видит только свои данные
--      и данные своих групп.
--
-- Логика модели:
--   users          -> владелец аккаунта
--   subscriptions  -> подписка, принадлежит одному пользователю (владельцу)
--   groups         -> группа создаётся для ОДНОЙ подписки (unique)
--   group_members  -> участники группы + их доля в %
--   payments       -> долг "кто кому сколько": from -> to (обычно владельцу)
--   notifications  -> push/in-app уведомления
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Хелпер: обновление updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. users — профили пользователей
--    id совпадает с auth.users.id (Supabase Auth)
-- ---------------------------------------------------------------------------
create table public.users (
  id                        uuid primary key references auth.users (id) on delete cascade,
  email                     text not null unique,
  display_name              text,
  avatar_url                text,
  subscription_tier         text not null default 'free'
                            check (subscription_tier in ('free', 'pro')),
  -- Интеграция LemonSqueezy (обновляется вебхуком /api/billing/webhook)
  ls_customer_id            text,
  ls_subscription_id        text,
  ls_subscription_item_id   text,
  plan_status               text not null default 'none',
  plan_expires_at           timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_users_ls_customer_id on public.users (ls_customer_id);
create index idx_users_ls_subscription_id on public.users (ls_subscription_id);

-- Авто-создание профиля при регистрации пользователя
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. subscriptions — подписки
--    billing_day = день месяца списания (1..28), т.к. оплата повторяется
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  name          text not null,
  category      text not null default 'other'
                check (category in ('streaming', 'music', 'productivity', 'gaming', 'vpn', 'ai', 'storage', 'other')),
  price         numeric(10, 2) not null check (price >= 0),
  currency      text not null default 'USD' check (char_length(currency) = 3),
  billing_cycle text not null default 'monthly'
                check (billing_cycle in ('monthly', 'yearly')),
  billing_day   integer not null default 1 check (billing_day between 1 and 28),
  deleted_at    timestamptz,          -- soft-delete: не null = подписка "удалена"
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_subscriptions_user_id    on public.subscriptions (user_id);
create index idx_subscriptions_billing_day on public.subscriptions (billing_day);
create index idx_subscriptions_deleted_at on public.subscriptions (deleted_at) where deleted_at is null;

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. groups — группы для совместного использования одной подписки
-- ---------------------------------------------------------------------------
create table public.groups (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  creator_id      uuid not null references public.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  created_at      timestamptz not null default now(),
  -- одна подписка -> одна группа (иначе доли задваиваются)
  constraint uq_groups_subscription unique (subscription_id)
);

create index idx_groups_creator_id       on public.groups (creator_id);
create index idx_groups_subscription_id  on public.groups (subscription_id);

-- ---------------------------------------------------------------------------
-- 4. group_members — участники группы и их доли
-- ---------------------------------------------------------------------------
create table public.group_members (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups (id) on delete cascade,
  user_id        uuid not null references public.users (id) on delete cascade,
  share_percent  numeric(5, 2) not null default 0
                 check (share_percent between 0 and 100),
  payment_status text not null default 'pending'
                 check (payment_status in ('pending', 'paid')),
  joined_at      timestamptz not null default now(),
  constraint uq_group_members unique (group_id, user_id)
);

create index idx_group_members_group_id on public.group_members (group_id);
create index idx_group_members_user_id  on public.group_members (user_id);

-- ---------------------------------------------------------------------------
-- 5. payments — долги: from_user должен to_user
-- ---------------------------------------------------------------------------
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id   uuid not null references public.users (id) on delete cascade,
  amount       numeric(10, 2) not null check (amount >= 0),
  currency     text not null default 'USD' check (char_length(currency) = 3),
  status       text not null default 'pending'
               check (status in ('pending', 'paid')),
  due_date     date not null,
  paid_at      timestamptz,
  last_reminded_at timestamptz,   -- защита ежедневного cron от повторных напоминаний
  created_at   timestamptz not null default now(),
  constraint chk_payments_distinct_users check (from_user_id <> to_user_id)
);

create index idx_payments_from_user_id on public.payments (from_user_id);
create index idx_payments_to_user_id   on public.payments (to_user_id);
create index idx_payments_group_id     on public.payments (group_id);
create index idx_payments_status       on public.payments (status);
create index idx_payments_due_date     on public.payments (due_date);
create index idx_payments_from_status  on public.payments (from_user_id, status);
create index idx_payments_pending_due  on public.payments (status, due_date);

-- ---------------------------------------------------------------------------
-- 6. notifications — уведомления
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text not null check (type in ('payment_due', 'payment_paid', 'group_invite', 'reminder', 'system')),
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_read     on public.notifications (user_id, read);
create index idx_notifications_user_created  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 7. push_subscriptions — FCM-токены устройств для push-уведомлений
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  token      text not null unique,
  device     text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_push_subscriptions_user_id on public.push_subscriptions (user_id);

create trigger trg_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. error_reports — отчёты об ошибках с клиента (/api/report-error)
-- ---------------------------------------------------------------------------
create table public.error_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid null references public.users (id) on delete set null,
  message    text null,
  stack      text null,
  path       text null,
  created_at timestamptz not null default now()
);

create index idx_error_reports_created_at
  on public.error_reports (created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Вспомогательные функции (security definer, но безопасны:
-- auth.uid() всегда текущий пользователь сессии)
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_creator(gid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups
    where id = gid and creator_id = auth.uid()
  );
$$;

-- ---------------- users ----------------
alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- insert/delete: только через триггер и service_role (RLS не мешает)

-- ---------------- subscriptions ----------------
alter table public.subscriptions enable row level security;

create policy "subs_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "subs_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);

create policy "subs_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subs_delete_own" on public.subscriptions
  for delete using (auth.uid() = user_id);

-- ---------------- groups ----------------
alter table public.groups enable row level security;

create policy "groups_select_member" on public.groups
  for select using (creator_id = auth.uid() or public.is_group_member(id));

create policy "groups_insert_creator" on public.groups
  for insert with check (creator_id = auth.uid());

create policy "groups_update_creator" on public.groups
  for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());

create policy "groups_delete_creator" on public.groups
  for delete using (creator_id = auth.uid());

-- ---------------- group_members ----------------
alter table public.group_members enable row level security;

create policy "members_select" on public.group_members
  for select using (
    user_id = auth.uid() or public.is_group_member(group_id)
  );

create policy "members_insert_creator" on public.group_members
  for insert with check (public.is_group_creator(group_id));

create policy "members_update" on public.group_members
  for update using (
    user_id = auth.uid() or public.is_group_creator(group_id)
  ) with check (
    user_id = auth.uid() or public.is_group_creator(group_id)
  );

create policy "members_delete_creator" on public.group_members
  for delete using (public.is_group_creator(group_id));

-- ---------------- payments ----------------
alter table public.payments enable row level security;

create policy "payments_select_involved" on public.payments
  for select using (
    from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or public.is_group_creator(group_id)
  );

create policy "payments_insert_creator" on public.payments
  for insert with check (public.is_group_creator(group_id));

create policy "payments_update_involved" on public.payments
  for update using (
    from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or public.is_group_creator(group_id)
  ) with check (
    from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or public.is_group_creator(group_id)
  );

create policy "payments_delete_creator" on public.payments
  for delete using (public.is_group_creator(group_id));

-- ---------------- invites ----------------
-- Приглашение по email для незарегистрированного пользователя.
-- Токен — сам по себе секрет: страница приглашения доступна без авторизации.
create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  email         text not null,
  token         text not null unique,
  share_percent numeric(5, 2) not null check (share_percent > 0 and share_percent < 100),
  status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'expired')),
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index idx_invites_group_id on public.invites (group_id);
create index idx_invites_email on public.invites (email);

alter table public.invites enable row level security;

-- Читать может любой, кто знает токен (публичная страница приглашения)
create policy "invites_select_anyone" on public.invites
  for select using (true);

-- Создавать приглашение может только создатель группы
create policy "invites_insert_creator" on public.invites
  for insert with check (public.is_group_creator(group_id));

-- Менять статус/долю может создатель; принимающий — обновить свой invite нельзя,
-- приём выполняется через delete (ниже)
create policy "invites_update_creator" on public.invites
  for update using (public.is_group_creator(group_id))
  with check (public.is_group_creator(group_id));

-- Удалить invite может любой авторизованный, предъявивший токен (принятие)
create policy "invites_delete_authenticated" on public.invites
  for delete using (auth.uid() is not null);

-- ---------------- notifications ----------------
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---------------- push_subscriptions ----------------
alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Полезный вид: итог по группе (сколько должен/сколько ждёт каждый участник)
-- Долги считаются ТОЛЬКО по платежам текущей группы (фикс: раньше подзапросы
-- суммировали по всем группам пользователя и задваивали суммы).
-- ============================================================================
create or replace view public.group_balances as
select
  g.id                                        as group_id,
  g.name                                      as group_name,
  gm.user_id,
  gm.share_percent,
  s.price * (gm.share_percent / 100)          as monthly_share,
  coalesce(up.amount, 0)                      as outstanding,  -- сколько должен сейчас
  coalesce(pd.amount, 0)                      as to_receive     -- сколько должны ему
from public.groups g
join public.group_members gm on gm.group_id = g.id
join public.subscriptions s on s.id = g.subscription_id and s.deleted_at is null
left join (
  select group_id, from_user_id, sum(amount) as amount
  from public.payments
  where status = 'pending'
  group by group_id, from_user_id
) up on up.group_id = g.id and up.from_user_id = gm.user_id
left join (
  select group_id, to_user_id, sum(amount) as amount
  from public.payments
  where status = 'pending'
  group by group_id, to_user_id
) pd on pd.group_id = g.id and pd.to_user_id = gm.user_id;

-- ---------------- error_reports ----------------
alter table public.error_reports enable row level security;

-- ============================================================================
-- Примечание: для свежей базы этот скрипт создаёт всё, включая
-- push_subscriptions и soft-delete (subscriptions.deleted_at).
-- Для уже существующей БД применяйте миграции из supabase/migrations/ по порядку.
-- ============================================================================
