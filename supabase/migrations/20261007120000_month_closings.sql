create table public.month_closings (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  month date not null check (extract(day from month) = 1 and month between '2000-01-01' and '2100-12-01'),
  closed_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.month_closings enable row level security;

create policy "own month closings" on public.month_closings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, delete on public.month_closings to authenticated;
grant insert (month) on public.month_closings to authenticated;

create function private.month_must_be_over()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.month >= date_trunc('month', private.today_sp())::date then
    raise exception 'month is not over' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger month_closings_over
  before insert on public.month_closings
  for each row execute function private.month_must_be_over();

create function private.ensure_month_open(p_user uuid, p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.month_closings
    where user_id = p_user and month = date_trunc('month', p_day)::date
  ) and exists (select 1 from auth.users where id = p_user) then
    raise exception 'month closed' using errcode = '55000';
  end if;
end;
$$;

create function private.lock_closed_transactions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (new.kind, new.amount_cents, new.occurred_on, new.description, new.category_id, new.payment_kind, new.card_id)
      is not distinct from
      (old.kind, old.amount_cents, old.occurred_on, old.description, old.category_id, old.payment_kind, old.card_id)
  then
    return new;
  end if;
  if tg_op <> 'INSERT' then
    perform private.ensure_month_open(old.user_id, old.occurred_on);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  perform private.ensure_month_open(new.user_id, new.occurred_on);
  return new;
end;
$$;

create trigger transactions_lock_closed
  before insert or update or delete on public.transactions
  for each row execute function private.lock_closed_transactions();

create function private.lock_closed_jar_entries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.jars where id = old.jar_id) then
      perform private.ensure_month_open(old.user_id, old.occurred_on);
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    perform private.ensure_month_open(old.user_id, old.occurred_on);
  end if;
  perform private.ensure_month_open(new.user_id, new.occurred_on);
  return new;
end;
$$;

create trigger jar_entries_lock_closed
  before insert or update or delete on public.jar_entries
  for each row execute function private.lock_closed_jar_entries();

revoke all on function private.ensure_month_open(uuid, date) from public, anon, authenticated;
revoke all on function private.lock_closed_transactions() from public, anon, authenticated;
revoke all on function private.lock_closed_jar_entries() from public, anon, authenticated;
revoke all on function private.month_must_be_over() from public, anon, authenticated;

alter table public.profiles
  add column closing_snoozed_month date check (extract(day from closing_snoozed_month) = 1);

grant update (closing_snoozed_month) on public.profiles to authenticated;
