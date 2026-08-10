-- 007: waitlist — email-заявки с лендинга

create table public.waitlist (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- Только service role (route handler). RLS включён, политик нет —
-- анонимам/авторизованным доступ запрещён, анонимная вставка идёт через admin-клиент.
alter table public.waitlist enable row level security;
