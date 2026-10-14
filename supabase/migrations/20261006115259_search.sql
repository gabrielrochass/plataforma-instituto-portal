create function public.filtered_transactions(
  p_from date default '2000-01-01',
  p_to date default '2101-01-01',
  p_query text default null,
  p_kind public.transaction_kind default null,
  p_category_id uuid default null,
  p_payment_kind public.payment_kind default null,
  p_card_id uuid default null
)
returns setof public.transactions
language sql
stable
set search_path = ''
as $$
  select t.*
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.occurred_on >= p_from
    and t.occurred_on < p_to
    and (
      p_query is null
      or t.description_norm like (
        select '%' || replace(replace(replace(
          private.normalize_description(left(p_query, 80)), '!', '!!'), '%', '!%'), '_', '!_') || '%'
      ) escape '!'
    )
    and (p_kind is null or t.kind = p_kind)
    and (p_category_id is null or t.category_id = p_category_id)
    and (p_payment_kind is null or t.payment_kind = p_payment_kind)
    and (p_card_id is null or t.card_id = p_card_id)
$$;

create function public.filtered_day_totals(
  p_from date default '2000-01-01',
  p_to date default '2101-01-01',
  p_query text default null,
  p_kind public.transaction_kind default null,
  p_category_id uuid default null,
  p_payment_kind public.payment_kind default null,
  p_card_id uuid default null
)
returns table (
  day date,
  expense_cents bigint,
  income_cents bigint,
  entries integer,
  total_expense_cents bigint,
  total_income_cents bigint,
  total_entries integer
)
language sql
stable
set search_path = ''
as $$
  select
    occurred_on,
    coalesce(sum(amount_cents) filter (where kind = 'expense'), 0)::bigint,
    coalesce(sum(amount_cents) filter (where kind = 'income'), 0)::bigint,
    count(*)::integer,
    (sum(coalesce(sum(amount_cents) filter (where kind = 'expense'), 0)) over ())::bigint,
    (sum(coalesce(sum(amount_cents) filter (where kind = 'income'), 0)) over ())::bigint,
    (sum(count(*)) over ())::integer
  from public.filtered_transactions(p_from, p_to, p_query, p_kind, p_category_id, p_payment_kind, p_card_id)
  group by occurred_on
  order by occurred_on desc
$$;

grant execute on function public.filtered_transactions(
  date, date, text, public.transaction_kind, uuid, public.payment_kind, uuid
) to authenticated;
grant execute on function public.filtered_day_totals(
  date, date, text, public.transaction_kind, uuid, public.payment_kind, uuid
) to authenticated;

drop function public.day_totals(date, date);
