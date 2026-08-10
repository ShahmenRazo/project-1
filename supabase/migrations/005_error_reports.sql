-- 005: отчёты об ошибках с клиента (/api/report-error)
create table if not exists public.error_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid null references public.users (id) on delete set null,
  message    text null,
  stack      text null,
  path       text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_error_reports_created_at
  on public.error_reports (created_at desc);

alter table public.error_reports enable row level security;

-- Запись добавляется через service role (route handler), пользователям
-- таблица не нужна напрямую — select/insert политики не создаём.
