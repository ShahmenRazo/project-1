-- 008: waitlist v2 — id uuid, source, публичная вставка (дополняет 007)

alter table public.waitlist
  add column id     uuid not null default gen_random_uuid(),
  add column source text not null default 'landing';

alter table public.waitlist drop constraint waitlist_pkey;
alter table public.waitlist add constraint waitlist_email_key unique (email);
alter table public.waitlist add primary key (id);

-- insert — публично (форма на лендинге), select — только service role (admin)
create policy "waitlist_insert_public" on public.waitlist
  for insert to anon, authenticated
  with check (true);
