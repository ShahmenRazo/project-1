-- Мемные уведомления: картинка-мем для reminder-уведомлений
alter table public.notifications
  add column if not exists image_url text;
