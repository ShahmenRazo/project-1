-- Mandatory onboarding: unique phone, zelle phone, RLS for member lists

-- Zelle по номеру телефона (альтернатива email)
alter table public.users
  add column if not exists zelle_phone text;

-- Один аккаунт = один телефон (E.164). Частичный индекс: NULL не конфликтуют.
create unique index if not exists users_phone_idx
  on public.users (phone_number)
  where phone_number is not null;

-- RLS: любой авторизованный видит профили (списки участников групп),
-- каждый редактирует/создаёт только свой.
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select to authenticated
  using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update to authenticated
  using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check (auth.uid() = id);
