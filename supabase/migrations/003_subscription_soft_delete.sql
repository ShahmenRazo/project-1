-- ============================================================================
-- Миграция 003: soft-delete подписок
--   subscriptions.deleted_at — не null = подписка "удалена" (DELETE не стирает
--   строку, чтобы не потерять историю платежей групп).
--   Применяется к уже существующей БД (Supabase SQL Editor).
-- ============================================================================

alter table public.subscriptions
  add column if not exists deleted_at timestamptz;

create index if not exists idx_subscriptions_deleted_at
  on public.subscriptions (deleted_at)
  where deleted_at is null;
