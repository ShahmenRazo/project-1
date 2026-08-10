-- ============================================================================
-- Миграция 002: push-уведомления (FCM)
--   push_subscriptions — FCM-токены устройств пользователя
--   payments.last_reminded_at — защита ежедневного cron от спама
-- ============================================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  token      text not null unique,
  device     text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Когда в последний раз слали напоминание по долгу (cron не спамит ежедневно)
alter table public.payments add column if not exists last_reminded_at timestamptz;

-- Индекс для ежедневного cron-запроса
create index if not exists idx_payments_pending_due on public.payments (status, due_date);
