-- ---------- 1. username для пользователей ----------
-- Уникальный публичный идентификатор для приглашения по имени
alter table public.users
  add column if not exists username text;

-- Уникальность без учёта регистра (пустые значения не конфликтуют)
create unique index if not exists users_username_lower_idx
  on public.users (lower(username))
  where username is not null;
