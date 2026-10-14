create extension if not exists unaccent with schema extensions;

alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges revoke execute on functions from public;

create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.transaction_kind as enum ('expense', 'income');
create type public.payment_kind as enum ('pix', 'boleto', 'card');

create domain public.palette_color as text
  check (value in ('chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-other'));

create domain public.card_design as text
  check (value in (
    'grafite', 'meia-noite', 'oceano', 'floresta', 'por-do-sol',
    'ametista', 'coral', 'rubi', 'ouro', 'prata'
  ));

create function private.today_sp()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create function private.clamped_day(month date, day integer)
returns date
language sql
immutable
set search_path = ''
as $$
  select month + least(day, extract(day from month + interval '1 month - 1 day')::integer) - 1
$$;

create function private.normalize_description(value text)
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(
    btrim(lower(regexp_replace(extensions.unaccent('extensions.unaccent'::regdictionary, value), '\s+', ' ', 'g'))),
    ''
  )
$$;

create function private.bill_dates(
  best_day smallint,
  due_day smallint,
  purchased_on date,
  cycle_offset integer,
  out closes_on date,
  out due_on date
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  purchase_month date := date_trunc('month', purchased_on)::date;
  closing_month date;
  due_month date;
begin
  closing_month := (
    purchase_month
    + make_interval(months => cycle_offset
      + (purchased_on > private.clamped_day(purchase_month, best_day - 1))::integer)
  )::date;
  closes_on := private.clamped_day(closing_month, best_day - 1);

  due_month := date_trunc('month', closes_on)::date;
  due_on := private.clamped_day(due_month, due_day);
  if due_on <= closes_on then
    due_on := private.clamped_day((due_month + interval '1 month')::date, due_day);
  end if;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text check (char_length(avatar_url) <= 2048),
  transaction_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind public.transaction_kind not null,
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  icon text not null check (char_length(icon) between 1 and 40),
  color public.palette_color not null,
  sort_order smallint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id, kind)
);

create unique index categories_name_key on public.categories (user_id, kind, lower(name)) where archived_at is null;
create index categories_user_idx on public.categories (user_id, kind, sort_order);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  design public.card_design not null,
  best_purchase_day smallint check (best_purchase_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  sort_order smallint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  check ((best_purchase_day is null) = (due_day is null))
);

create unique index cards_name_key on public.cards (user_id, lower(name)) where archived_at is null;
create index cards_user_idx on public.cards (user_id, sort_order);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind public.transaction_kind not null,
  amount_cents bigint not null check (amount_cents between 1 and 9999999999),
  occurred_on date not null check (occurred_on between date '2000-01-01' and date '2100-12-31'),
  description text check (char_length(description) <= 120),
  description_norm text,
  category_id uuid not null,
  payment_kind public.payment_kind not null,
  card_id uuid,
  bill_closes_on date,
  bill_due_on date,
  installment_group_id uuid,
  installment_number smallint,
  installment_count smallint,
  installment_purchased_on date check (installment_purchased_on between date '2000-01-01' and date '2100-12-31'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id, kind) references public.categories (id, user_id, kind),
  foreign key (card_id, user_id) references public.cards (id, user_id),
  unique (installment_group_id, installment_number),
  check ((payment_kind = 'card') = (card_id is not null)),
  check (num_nulls(installment_group_id, installment_number, installment_count, installment_purchased_on) in (0, 4)),
  check (installment_group_id is null or payment_kind = 'card'),
  check (installment_count between 2 and 72),
  check (installment_number between 1 and installment_count),
  check (
    installment_group_id is null
    or occurred_on = (installment_purchased_on + make_interval(months => installment_number - 1))::date
  ),
  check ((bill_closes_on is null) = (bill_due_on is null))
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc, created_at desc);
create index transactions_user_created_idx on public.transactions (user_id, created_at desc)
  include (kind, payment_kind, card_id);
create index transactions_user_bill_idx on public.transactions (user_id, card_id, bill_due_on)
  where bill_due_on is not null;
create index transactions_user_description_idx on public.transactions (user_id, kind, description_norm)
  where description_norm is not null;
create index transactions_category_idx on public.transactions (category_id);
create index transactions_card_idx on public.transactions (card_id) where card_id is not null;

create function private.transactions_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  best_day smallint;
  due_day smallint;
begin
  if tg_op = 'UPDATE' and old.installment_group_id is not null and (
    new.amount_cents is distinct from old.amount_cents
    or new.occurred_on is distinct from old.occurred_on
    or new.payment_kind is distinct from old.payment_kind
    or new.card_id is distinct from old.card_id
    or new.kind is distinct from old.kind
  ) then
    raise exception 'installment amount, date, kind and payment cannot change' using errcode = '23514';
  end if;

  new.description := nullif(regexp_replace(new.description, '^\s+|\s+$', '', 'g'), '');
  new.description_norm := private.normalize_description(new.description);

  if tg_op = 'INSERT' and new.installment_group_id is not null and exists (
    select 1
    from public.transactions t
    where t.installment_group_id = new.installment_group_id
      and (
        t.installment_count <> new.installment_count
        or t.installment_purchased_on <> new.installment_purchased_on
        or t.card_id <> new.card_id
        or (t.installment_number = new.installment_number and t.amount_cents <> new.amount_cents)
      )
  ) then
    raise exception 'installment group already exists with different terms' using errcode = '23505';
  end if;

  if new.card_id is null then
    new.bill_closes_on := null;
    new.bill_due_on := null;
  elsif tg_op = 'INSERT'
    or new.bill_closes_on is null
    or new.occurred_on is distinct from old.occurred_on
    or new.card_id is distinct from old.card_id
  then
    if tg_op = 'INSERT' then
      select c.best_purchase_day, c.due_day into best_day, due_day
      from public.cards c
      where c.id = new.card_id and c.user_id = new.user_id
      for share;
    else
      select c.best_purchase_day, c.due_day into best_day, due_day
      from public.cards c
      where c.id = new.card_id and c.user_id = new.user_id;
    end if;

    if best_day is null then
      new.bill_closes_on := null;
      new.bill_due_on := null;
    else
      select b.closes_on, b.due_on
      into new.bill_closes_on, new.bill_due_on
      from private.bill_dates(
        best_day,
        due_day,
        coalesce(new.installment_purchased_on, new.occurred_on),
        coalesce(new.installment_number, 1) - 1
      ) b;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

create trigger transactions_before_write
  before insert or update on public.transactions
  for each row execute function private.transactions_before_write();

create function private.count_transactions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total integer;
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set transaction_count = transaction_count + 1
    where id = new.user_id
    returning transaction_count into total;
    if total > 50000 then
      raise exception 'transaction limit reached' using errcode = '54000';
    end if;
  else
    update public.profiles
    set transaction_count = transaction_count - 1
    where id = old.user_id;
  end if;
  return null;
end;
$$;

create trigger transactions_count
  after insert or delete on public.transactions
  for each row execute function private.count_transactions();

create function private.enforce_row_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  total integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(tg_table_name || new.user_id::text, 0));
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into total using new.user_id;
  if total >= tg_argv[0]::integer then
    raise exception '% limit reached', tg_table_name using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger categories_quota
  before insert on public.categories
  for each row execute function private.enforce_row_quota('200');

create trigger cards_quota
  before insert on public.cards
  for each row execute function private.enforce_row_quota('30');

create table private.deleted_transactions (
  id uuid primary key,
  user_id uuid not null,
  row_data jsonb not null,
  deleted_at timestamptz not null default now()
);

create index deleted_transactions_deleted_at_idx on private.deleted_transactions (deleted_at);
create index deleted_transactions_user_idx on private.deleted_transactions (user_id);

create function private.keep_deleted_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.deleted_transactions where deleted_at < now() - interval '1 day';
  if exists (select 1 from auth.users where id = old.user_id) then
    insert into private.deleted_transactions (id, user_id, row_data)
    values (old.id, old.user_id, to_jsonb(old))
    on conflict (id) do update set row_data = excluded.row_data, deleted_at = now();
  else
    delete from private.deleted_transactions where user_id = old.user_id;
  end if;
  return null;
end;
$$;

create trigger transactions_keep_deleted
  after delete on public.transactions
  for each row execute function private.keep_deleted_transaction();

create function private.reprice_card_bills()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.best_purchase_day is distinct from old.best_purchase_day
    or new.due_day is distinct from old.due_day
  then
    update public.transactions
    set bill_closes_on = null, bill_due_on = null
    where card_id = new.id and user_id = new.user_id;
  end if;
  return null;
end;
$$;

create trigger cards_reprice_bills
  after update of best_purchase_day, due_day on public.cards
  for each row execute function private.reprice_card_bills();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80),
    left(new.raw_user_meta_data ->> 'avatar_url', 2048)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

revoke all on function private.reprice_card_bills() from public;
revoke all on function private.count_transactions() from public;
revoke all on function private.keep_deleted_transaction() from public;
revoke all on function private.handle_new_user() from public;

create function public.restore_transactions(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  restored integer;
begin
  if cardinality(p_ids) > 100 then
    raise exception 'too many transactions to restore' using errcode = '22023';
  end if;

  with candidates as (
    delete from private.deleted_transactions d
    where d.id = any(p_ids) and d.user_id = (select auth.uid())
    returning d.row_data
  )
  insert into public.transactions
  select (jsonb_populate_record(null::public.transactions, c.row_data)).*
  from candidates c
  on conflict (id) do nothing;
  get diagnostics restored = row_count;

  return restored;
end;
$$;

create function public.create_installment_purchase(
  p_group_id uuid,
  p_total_cents bigint,
  p_count integer,
  p_purchased_on date,
  p_description text,
  p_category_id uuid,
  p_card_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_count is null or p_count not between 2 and 72 then
    raise exception 'installment count must be between 2 and 72' using errcode = '22023';
  end if;

  insert into public.transactions (
    kind, amount_cents, occurred_on, description, category_id, payment_kind, card_id,
    installment_group_id, installment_number, installment_count, installment_purchased_on
  )
  select
    'expense',
    (p_total_cents / p_count) + case when n = 1 then p_total_cents % p_count else 0 end,
    (p_purchased_on + make_interval(months => n - 1))::date,
    p_description,
    p_category_id,
    'card',
    p_card_id,
    p_group_id,
    n,
    p_count,
    p_purchased_on
  from generate_series(1, p_count) as n
  on conflict (installment_group_id, installment_number) do nothing;
end;
$$;

create function public.suggest_category(p_description text, p_kind public.transaction_kind)
returns uuid
language sql
stable
set search_path = ''
as $$
  select t.category_id
  from public.transactions t
  join public.categories c on c.id = t.category_id and c.archived_at is null
  where t.user_id = (select auth.uid())
    and t.kind = p_kind
    and t.description_norm = private.normalize_description(p_description)
    and coalesce(t.installment_purchased_on, t.occurred_on)
      between private.today_sp() - 365 and private.today_sp()
  group by t.category_id
  order by count(distinct coalesce(t.installment_group_id, t.id)) desc, max(t.created_at) desc
  limit 1
$$;

create function public.day_totals(p_from date, p_to date)
returns table (day date, expense_cents bigint, income_cents bigint)
language sql
stable
set search_path = ''
as $$
  select
    occurred_on,
    coalesce(sum(amount_cents) filter (where kind = 'expense'), 0)::bigint,
    coalesce(sum(amount_cents) filter (where kind = 'income'), 0)::bigint
  from public.transactions
  where user_id = (select auth.uid())
    and occurred_on >= p_from
    and occurred_on < p_to
  group by occurred_on
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.cards enable row level security;
alter table public.transactions enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "own categories" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own cards" on public.cards
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own transactions" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select, delete on public.categories to authenticated;
grant insert (id, kind, name, icon, color, sort_order) on public.categories to authenticated;
grant update (name, icon, color, sort_order, archived_at) on public.categories to authenticated;

grant select, delete on public.cards to authenticated;
grant insert (id, name, design, best_purchase_day, due_day, sort_order) on public.cards to authenticated;
grant update (name, design, best_purchase_day, due_day, sort_order, archived_at) on public.cards to authenticated;

grant select, delete on public.transactions to authenticated;
grant insert (
  id, kind, amount_cents, occurred_on, description, category_id, payment_kind, card_id,
  installment_group_id, installment_number, installment_count, installment_purchased_on
) on public.transactions to authenticated;
grant update (kind, amount_cents, occurred_on, description, category_id, payment_kind, card_id)
  on public.transactions to authenticated;

grant execute on function private.today_sp() to authenticated;
grant execute on function private.clamped_day(date, integer) to authenticated;
grant execute on function private.normalize_description(text) to authenticated;
grant execute on function private.bill_dates(smallint, smallint, date, integer) to authenticated;

revoke all on function public.restore_transactions(uuid[]) from public, anon;
grant execute on function public.restore_transactions(uuid[]) to authenticated;
grant execute on function public.create_installment_purchase(uuid, bigint, integer, date, text, uuid, uuid)
  to authenticated;
grant execute on function public.suggest_category(text, public.transaction_kind) to authenticated;
grant execute on function public.day_totals(date, date) to authenticated;
