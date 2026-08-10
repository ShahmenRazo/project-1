-- 006: реферальная система + публичные ссылки на группы

-- ---------------------------------------------------------------------------
-- referrals — кто кого пригласил. user_id = приглашённый, referred_by = пригласивший.
-- При оформлении Pro приглашённым оба получают +1 месяц Pro (см. webhook).
-- ---------------------------------------------------------------------------
create table public.referrals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  referred_by  uuid not null references public.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  converted    boolean not null default false,
  converted_at timestamptz null,
  constraint uq_referrals_user unique (user_id)
);

create index idx_referrals_referred_by on public.referrals (referred_by);
create index idx_referrals_converted   on public.referrals (converted);

alter table public.referrals enable row level security;

-- Каждый видит свои записи: и как приглашённый, и как пригласивший
create policy "referrals_select_own" on public.referrals
  for select using (user_id = auth.uid() or referred_by = auth.uid());

-- Запись/обновление — только через service role (route handlers)

-- ---------------------------------------------------------------------------
-- public_invites — публичные ссылки на группу /join/[token]
-- ---------------------------------------------------------------------------
create table public.public_invites (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  token       text not null unique,
  created_by  uuid not null references public.users (id) on delete cascade,
  max_uses    int not null default 0 check (max_uses >= 0),   -- 0 = без лимита
  uses_count  int not null default 0 check (uses_count >= 0),
  expires_at  timestamptz null,                                -- null = без срока
  created_at  timestamptz not null default now()
);

create index idx_public_invites_group on public.public_invites (group_id);

alter table public.public_invites enable row level security;

-- Видят участники группы (для копирования ссылки на странице группы)
create policy "public_invites_select_member" on public.public_invites
  for select using (
    public.is_group_member(group_id) or public.is_group_creator(group_id)
  );

-- Создавать ссылку может только создатель группы
create policy "public_invites_insert_creator" on public.public_invites
  for insert with check (public.is_group_creator(group_id));

create policy "public_invites_update_creator" on public.public_invites
  for update using (public.is_group_creator(group_id));

create policy "public_invites_delete_creator" on public.public_invites
  for delete using (public.is_group_creator(group_id));

-- Инкремент uses_count и join выполняются через service role
