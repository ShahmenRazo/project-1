-- Payment handles for one-tap Pay (Venmo / Cash App / Zelle)
alter table public.users
  add column if not exists venmo_username text,
  add column if not exists cash_tag text,
  add column if not exists zelle_email text;

-- Payment method tracking for initiated deep-link transfers
alter table public.payments add column if not exists method text;
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method is null or method in ('venmo', 'cash_app', 'zelle'));

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'paid', 'initiated'));

create index if not exists idx_payments_initiated
  on public.payments (group_id) where status = 'initiated';