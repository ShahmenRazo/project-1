-- ============================================================================
-- Миграция 004: приглашения по email (invite flow)
--   Приглашение создаётся для незарегистрированного email при создании группы.
--   Ссылка-токен ведёт на публичную страницу /invite/[token].
--   Применяется к уже существующей БД (Supabase SQL Editor).
-- ============================================================================

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

-- Менять статус/долю может создатель
create policy "invites_update_creator" on public.invites
  for update using (public.is_group_creator(group_id))
  with check (public.is_group_creator(group_id));

-- Удалить invite может любой авторизованный, предъявивший токен (принятие)
create policy "invites_delete_authenticated" on public.invites
  for delete using (auth.uid() is not null);
