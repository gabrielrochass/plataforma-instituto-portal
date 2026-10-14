create type public.jar_entry_kind as enum ('deposit', 'withdrawal');

create table public.jars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  icon text not null check (char_length(icon) between 1 and 40),
  color public.palette_color not null,
  target_cents bigint check (target_cents between 1 and 9999999999),
  target_date date check (target_date between '2000-01-01' and '2100-12-31'),
  planned_monthly_cents bigint check (planned_monthly_cents between 1 and 9999999999),
  sort_order smallint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index jars_name_key on public.jars (user_id, lower(name)) where archived_at is null;
create index jars_user_idx on public.jars (user_id, sort_order);

create table public.jar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  jar_id uuid not null,
  kind public.jar_entry_kind not null,
  amount_cents bigint not null check (amount_cents between 1 and 9999999999),
  occurred_on date not null check (occurred_on between '2000-01-01' and '2100-12-31'),
  note text check (char_length(note) <= 120 and note = btrim(note) and note !~ '[[:cntrl:]]'),
  is_opening boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (jar_id, user_id) references public.jars (id, user_id) on delete cascade,
  check (not is_opening or kind = 'deposit')
);

create index jar_entries_user_jar_idx on public.jar_entries (user_id, jar_id, occurred_on desc, created_at desc);
create unique index jar_entries_opening_key on public.jar_entries (jar_id) where is_opening;

create trigger jars_quota
  before insert on public.jars
  for each row execute function private.enforce_row_quota('50');

create trigger jar_entries_quota
  before insert on public.jar_entries
  for each row execute function private.enforce_row_quota('5000');

alter table public.jars enable row level security;
alter table public.jar_entries enable row level security;

create policy "own jars" on public.jars
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own jar entries" on public.jar_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.jar_totals()
returns table (jar_id uuid, balance_cents bigint, opening_cents bigint, first_month date)
language sql
stable
set search_path = ''
as $$
  select
    jar_id,
    sum(case when kind = 'deposit' then amount_cents else -amount_cents end)::bigint,
    coalesce(sum(amount_cents) filter (where is_opening), 0)::bigint,
    date_trunc('month', min(occurred_on) filter (where not is_opening))::date
  from public.jar_entries
  where user_id = (select auth.uid())
  group by jar_id
$$;

create function public.jar_months(p_from date, p_to date)
returns table (jar_id uuid, month date, net_cents bigint)
language sql
stable
set search_path = ''
as $$
  select
    jar_id,
    date_trunc('month', occurred_on)::date,
    sum(case when kind = 'deposit' then amount_cents else -amount_cents end)::bigint
  from public.jar_entries
  where user_id = (select auth.uid())
    and not is_opening
    and occurred_on >= p_from
    and occurred_on < p_to
  group by 1, 2
$$;

grant select, delete on public.jars to authenticated;
grant insert (id, name, icon, color, target_cents, target_date, planned_monthly_cents, sort_order)
  on public.jars to authenticated;
grant update (name, icon, color, target_cents, target_date, planned_monthly_cents, sort_order, archived_at)
  on public.jars to authenticated;
grant select, delete on public.jar_entries to authenticated;
grant insert (id, jar_id, kind, amount_cents, occurred_on, note, is_opening)
  on public.jar_entries to authenticated;
grant execute on function public.jar_totals() to authenticated;
grant execute on function public.jar_months(date, date) to authenticated;
