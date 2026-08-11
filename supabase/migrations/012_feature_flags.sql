-- ---------- 1. Feature flags ----------
create table if not exists public.feature_flags (
  name            text primary key,
  enabled         boolean not null default false,
  rollout_percent integer not null default 100
                  check (rollout_percent >= 0 and rollout_percent <= 100),
  target          text not null default 'all'
                  check (target in ('all', 'pro_only', 'beta_users')),
  created_at      timestamptz not null default now()
);

-- RLS включён, политики отсутствуют: доступ только через service_role (bypass RLS),
-- клиент получает флаги через GET /api/features.
alter table public.feature_flags enable row level security;

-- ---------- 2. Beta-когорта для target = 'beta_users' ----------
alter table public.users add column if not exists is_beta boolean not null default false;

-- ---------- 3. Расширяем набор действий аудита ----------
alter table public.admin_logs drop constraint if exists admin_logs_action_check;
alter table public.admin_logs
  add constraint admin_logs_action_check
  check (action in ('ban_user', 'unban_user', 'delete_user', 'impersonate',
                    'refund', 'toggle_pro', 'flag_create', 'flag_update', 'flag_delete'));

-- ---------- 4. Стартовые флаги ----------
insert into public.feature_flags (name, enabled, rollout_percent, target) values
  ('new_dashboard',   true,  100, 'all'),
  ('referral_system', false, 0,   'all')
on conflict (name) do nothing;
