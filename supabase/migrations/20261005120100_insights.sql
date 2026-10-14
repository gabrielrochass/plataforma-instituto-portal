alter table public.categories
  add column monthly_limit_cents bigint check (monthly_limit_cents between 1 and 9999999999);

grant insert (monthly_limit_cents), update (monthly_limit_cents) on public.categories to authenticated;

create function public.month_totals(p_from date, p_to date, p_category_id uuid default null)
returns table (month date, expense_cents bigint, income_cents bigint)
language sql
stable
set search_path = ''
as $$
  select
    date_trunc('month', occurred_on)::date,
    coalesce(sum(amount_cents) filter (where kind = 'expense'), 0)::bigint,
    coalesce(sum(amount_cents) filter (where kind = 'income'), 0)::bigint
  from public.transactions
  where user_id = (select auth.uid())
    and occurred_on >= p_from
    and occurred_on < p_to
    and (p_category_id is null or category_id = p_category_id)
  group by 1
  order by 1
$$;

create function public.category_totals(p_from date, p_to date)
returns table (category_id uuid, total_cents bigint, entries integer)
language sql
stable
set search_path = ''
as $$
  select category_id, sum(amount_cents)::bigint, count(*)::integer
  from public.transactions
  where user_id = (select auth.uid())
    and occurred_on >= p_from
    and occurred_on < p_to
  group by category_id
  order by 2 desc
$$;

create function public.top_descriptions(
  p_from date,
  p_to date,
  p_category_id uuid default null
)
returns table (description text, total_cents bigint, entries integer)
language sql
stable
set search_path = ''
as $$
  select
    (array_agg(description order by occurred_on desc, created_at desc))[1],
    sum(amount_cents)::bigint,
    count(*)::integer
  from public.transactions
  where user_id = (select auth.uid())
    and kind = 'expense'
    and description_norm <> ''
    and occurred_on >= p_from
    and occurred_on < p_to
    and (p_category_id is null or category_id = p_category_id)
  group by description_norm
  order by 2 desc, 3 desc
  limit 5
$$;

create function public.above_normal(p_month date)
returns table (category_id uuid, spent_cents bigint, usual_cents bigint)
language sql
stable
set search_path = ''
as $$
  with bounds as (
    select greatest(
      date_trunc('month', min(occurred_on) - 1 + interval '1 month')::date,
      (p_month - interval '6 months')::date
    ) as first_month
    from public.transactions
    where user_id = (select auth.uid())
  ),
  history as (
    select (p_month - make_interval(months => offset_months))::date as month
    from bounds, generate_series(1, 6) as offset_months
    where (p_month - make_interval(months => offset_months))::date >= bounds.first_month
  ),
  totals as (
    select t.category_id, date_trunc('month', t.occurred_on)::date as month, sum(t.amount_cents) as cents
    from public.transactions t, bounds b
    where t.user_id = (select auth.uid())
      and t.kind = 'expense'
      and t.installment_group_id is null
      and t.occurred_on >= b.first_month
      and t.occurred_on < (p_month + interval '1 month')::date
    group by 1, 2
  ),
  usual as (
    select c.id as category_id,
      percentile_cont(0.5) within group (order by coalesce(t.cents, 0)) as median
    from public.categories c
    cross join history h
    left join totals t on t.category_id = c.id and t.month = h.month
    where c.user_id = (select auth.uid())
      and c.kind = 'expense'
      and c.archived_at is null
    group by c.id
    having count(*) >= 3
  ),
  spent as (
    select category_id, cents, sum(cents) over () as month_total
    from totals
    where month = p_month
  )
  select s.category_id, s.cents::bigint, round(u.median)::bigint
  from spent s
  join usual u using (category_id)
  where isfinite(p_month)
    and u.median > 0
    and s.cents >= 1.25 * u.median
    and s.cents - u.median >= greatest(5000, 0.03 * s.month_total)
  order by s.cents - u.median desc
  limit 3
$$;

grant execute on function public.month_totals(date, date, uuid) to authenticated;
grant execute on function public.category_totals(date, date) to authenticated;
grant execute on function public.top_descriptions(date, date, uuid) to authenticated;
grant execute on function public.above_normal(date) to authenticated;
