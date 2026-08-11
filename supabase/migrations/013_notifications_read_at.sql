-- ---------- 1. read_at для уведомлений ----------
-- Отметка времени прочтения уведомления (ставится при клике / пометке прочитанным)
alter table public.notifications
  add column if not exists read_at timestamptz;

-- Индекс для сортировки прочитанных уведомлений по дате прочтения
create index if not exists idx_notifications_read_at
  on public.notifications (user_id, read_at);
