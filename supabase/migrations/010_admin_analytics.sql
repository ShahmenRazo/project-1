-- 010: Admin analytics — RPC для тяжёлых агрегаций
-- Функции доступны ТОЛЬКО service_role (вызовы из админ-API после requireAdmin()).
-- rpc-вызовы: admin_kpi(), admin_cohorts(), admin_funnel() — все возвращают jsonb.

-- ---------- KPI: total_users, MAU/WAU/DAU, MRR, churn, рост за 90 дней ----------
create or replace function public.admin_kpi()
returns jsonb
language sql
security invoker
stable
as $$
  with u as (select * from public.users)
  select jsonb_build_object(
    'total_users',        (select count(*) from u),
    'mau',                (select count(*) from u where last_active >= now() - interval '30 days'),
    'wau',                (select count(*) from u where last_active >= now() - interval '7 days'),
    'dau',                (select count(*) from u where last_active >= now() - interval '1 day'),
    'mrr',                round((select coalesce(sum(case when subscription_tier = 'pro' then 3.99 else 0 end), 0) from u)::numeric, 2),
    'churn_rate',
      (
        with pro as (
          select count(*) c from u
          where subscription_tier = 'pro'
            and (plan_status = 'active' or plan_status = 'none' or plan_expires_at is null or plan_expires_at >= now())
        ),
        expired as (
          select count(*) c from u
          where subscription_tier = 'pro'
            and (plan_status = 'expired' or plan_status = 'cancelled' or plan_expires_at < now())
        )
        select case
          when (select c from pro) = 0 and (select c from expired) = 0 then 0
          else round(100.0 * (select c from expired) / nullif((select c from pro) + (select c from expired), 0), 2)
        end
      ),
    'growth_90d',
      (
        select jsonb_agg(jsonb_build_object('date', d, 'count', c) order by d)
        from (
          select d::date as d,
                 (select count(*) from u where created_at::date = d) as c
          from generate_series(now()::date - 90, now()::date, interval '1 day') d
        ) g
      )
  )
$$;

-- ---------- Когорты: месяц регистрации + retention (survival) по неделям ----------
-- Retention week N: доля когорты, чей последний вход (users.last_active,
-- обновляется heartbeat'ом) был не раньше конца недели N после регистрации.
create or replace function public.admin_cohorts()
returns jsonb
language sql
security invoker
stable
as $$
  select jsonb_agg(t) from (
    select
      to_char(created_at, 'YYYY-MM')                                      as cohort_month,
      count(*)                                                           as users,
      round(100.0 * count(*) filter (where last_active >= created_at + interval '7 days')  / nullif(count(*), 0), 1) as week_1,
      round(100.0 * count(*) filter (where last_active >= created_at + interval '14 days') / nullif(count(*), 0), 1) as week_2,
      round(100.0 * count(*) filter (where last_active >= created_at + interval '28 days') / nullif(count(*), 0), 1) as week_4,
      round(100.0 * count(*) filter (where last_active >= created_at + interval '56 days') / nullif(count(*), 0), 1) as week_8,
      round(100.0 * count(*) filter (where last_active >= created_at + interval '84 days') / nullif(count(*), 0), 1) as week_12
    from public.users
    group by cohort_month
    order by cohort_month desc
  ) t
$$;

-- ---------- Воронка: Sign Up → Add Subscription → Create Group → Invite Friend → Upgrade Pro ----------
create or replace function public.admin_funnel()
returns jsonb
language sql
security invoker
stable
as $$
  select jsonb_build_array(
    jsonb_build_object('step', 'Sign Up',
                       'count', (select count(*) from public.users)),
    jsonb_build_object('step', 'Add Subscription',
                       'count', (select count(distinct user_id) from public.subscriptions where deleted_at is null)),
    jsonb_build_object('step', 'Create Group',
                       'count', (select count(distinct creator_id) from public.groups)),
    jsonb_build_object('step', 'Invite Friend',
                       'count', (select count(distinct g.creator_id) from public.invites i join public.groups g on g.id = i.group_id)),
    jsonb_build_object('step', 'Upgrade Pro',
                       'count', (select count(*) from public.users where subscription_tier = 'pro'))
  )
$$;

-- ---------- Права: только service_role ----------
revoke execute on function public.admin_kpi()     from public;
revoke execute on function public.admin_cohorts() from public;
revoke execute on function public.admin_funnel()  from public;
grant execute on function public.admin_kpi()     to service_role;
grant execute on function public.admin_cohorts() to service_role;
grant execute on function public.admin_funnel()  to service_role;
