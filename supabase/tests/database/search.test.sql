begin;
select plan(13);

insert into auth.users (id, email) values
  ('88888888-8888-4888-8888-888888888888', 'helena@test.local'),
  ('99999999-9999-4999-8999-999999999999', 'igor@test.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "88888888-8888-4888-8888-888888888888", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('cccccccc-0000-4000-8000-000000000001', 'expense', 'Restaurantes', 'utensils', 'chart-2'),
  ('cccccccc-0000-4000-8000-000000000002', 'expense', 'Mercado', 'shopping-cart', 'chart-3'),
  ('cccccccc-0000-4000-8000-000000000003', 'income', 'Salário', 'briefcase', 'chart-1');

insert into public.cards (id, name, design) values
  ('cccccccc-0000-4000-8000-000000000010', 'Nubank', 'ametista');

insert into public.transactions (id, kind, amount_cents, occurred_on, description, category_id, payment_kind, card_id) values
  ('cccccccc-0000-4000-8000-000000000020', 'expense', 1500, '2026-08-15', 'Café da manhã', 'cccccccc-0000-4000-8000-000000000001', 'pix', null),
  ('cccccccc-0000-4000-8000-000000000021', 'expense', 800, '2026-10-02', 'Café expresso', 'cccccccc-0000-4000-8000-000000000001', 'card', 'cccccccc-0000-4000-8000-000000000010'),
  ('cccccccc-0000-4000-8000-000000000022', 'expense', 25000, '2026-10-03', 'Mercado 100% integral', 'cccccccc-0000-4000-8000-000000000002', 'card', 'cccccccc-0000-4000-8000-000000000010'),
  ('cccccccc-0000-4000-8000-000000000023', 'income', 500000, '2026-10-01', 'Salário', 'cccccccc-0000-4000-8000-000000000003', 'pix', null),
  ('cccccccc-0000-4000-8000-000000000024', 'expense', 1200, '2026-10-03', null, 'cccccccc-0000-4000-8000-000000000002', 'boleto', null);

select is(
  (select string_agg(description, ', ' order by occurred_on) from public.filtered_transactions(p_query => 'CAFE')),
  'Café da manhã, Café expresso',
  'search ignores accents and case across every month'
);
select is(
  (select count(*)::int from public.filtered_transactions(p_query => '100%')),
  1,
  'a percent sign is searched literally'
);
select is(
  (select count(*)::int from public.filtered_transactions(p_query => '_')),
  0,
  'an underscore is searched literally'
);
select is(
  (select count(*)::int from public.filtered_transactions(p_from => '2026-10-01', p_to => '2026-11-01')),
  4,
  'the month range keeps entries without a description'
);
select is(
  (select count(*)::int from public.filtered_transactions(p_kind => 'income')),
  1,
  'filters by kind'
);
select is(
  (select string_agg(description, ', ' order by occurred_on)
   from public.filtered_transactions(p_payment_kind => 'card', p_card_id => 'cccccccc-0000-4000-8000-000000000010')),
  'Café expresso, Mercado 100% integral',
  'filters by card'
);
select is(
  (select count(*)::int from public.filtered_transactions(p_category_id => 'cccccccc-0000-4000-8000-000000000002', p_payment_kind => 'boleto')),
  1,
  'filters combine'
);
select is(
  (select string_agg(day || ':' || expense_cents || ':' || income_cents || ':' || entries, ' ' order by day)
   from public.filtered_day_totals(p_from => '2026-10-01', p_to => '2026-11-01')),
  '2026-10-01:0:500000:1 2026-10-02:800:0:1 2026-10-03:26200:0:2',
  'day totals add up the filtered entries'
);
select is(
  (select sum(expense_cents)::bigint from public.filtered_day_totals(p_query => 'cafe')),
  2300::bigint,
  'totals follow the search'
);
select is(
  (select total_entries || ':' || total_expense_cents || ':' || total_income_cents
   from public.filtered_day_totals(p_from => '2026-10-01', p_to => '2026-11-01') limit 1),
  '4:27000:500000',
  'every day row carries the grand totals'
);
select is(
  (select count(*)::int from public.filtered_transactions(p_query => repeat('cafe ', 2000))),
  0,
  'a huge search is capped and finishes'
);

set local request.jwt.claims = '{"sub": "99999999-9999-4999-8999-999999999999", "role": "authenticated"}';
select is_empty($$ select * from public.filtered_transactions(p_query => 'cafe') $$, 'another user finds nothing');

reset role;
select ok(
  not has_function_privilege('anon',
    'public.filtered_transactions(date, date, text, public.transaction_kind, uuid, public.payment_kind, uuid)', 'execute')
  and not has_function_privilege('anon',
    'public.filtered_day_totals(date, date, text, public.transaction_kind, uuid, public.payment_kind, uuid)', 'execute'),
  'anon cannot search'
);

select * from finish();
rollback;
