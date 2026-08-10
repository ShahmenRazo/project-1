-- ============================================================================
-- Миграция 001: интеграция LemonSqueezy
-- Выполнить в Supabase SQL Editor (применяется к уже существующей БД).
--   users.subscription_tier  — denormalized: 'free' | 'pro' (читается кодом)
--   users.plan_status        — статус подписки LS: active/on_trial/past_due/
--                              paused/unpaid/cancelled/expired (или 'none')
--   users.plan_expires_at    — renews_at (активная) или ends_at (отмена)
-- ============================================================================

alter table public.users
  add column if not exists ls_customer_id text,
  add column if not exists ls_subscription_id text,
  add column if not exists ls_subscription_item_id text,
  add column if not exists plan_status text not null default 'none',
  add column if not exists plan_expires_at timestamptz;

-- Для поиска пользователя в webhook по подписке/клиенту
create index if not exists idx_users_ls_customer_id on public.users (ls_customer_id);
create index if not exists idx_users_ls_subscription_id on public.users (ls_subscription_id);
