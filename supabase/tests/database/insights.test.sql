begin;
select plan(18);

insert into auth.users (id, email) values
  ('33333333-3333-4333-8333-333333333333', 'carla@test.local'),
  ('44444444-4444-4444-8444-444444444444', 'davi@test.local'),
  ('77777777-7777-4777-8777-777777777777', 'gil@test.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('cccccccc-0000-4000-8000-000000000001', 'expense', 'Mercado', 'shopping-cart', 'chart-3'),
  ('cccccccc-0000-4000-8000-000000000002', 'expense', 'Restaurantes', 'utensils', 'chart-2'),
  ('cccccccc-0000-4000-8000-000000000003', 'expense', 'Viagem', 'plane', 'chart-1'),
  ('cccccccc-0000-4000-8000-000000000004', 'income', 'Salário', 'briefcase', 'chart-3');

insert into public.cards (id, name, design) values
  ('cccccccc-0000-4000-8000-000000000010', 'Nubank', 'ametista');

insert into public.transactions (kind, amount_cents, occurred_on, description, category_id, payment_kind)
select 'expense', amount, day, description, category, 'pix'
from (values
  (80000, date '2026-06-10', 'Compra do mês', 'cccccccc-0000-4000-8000-000000000001'::uuid),
  (80000, date '2026-07-10', 'Compra do mês', 'cccccccc-0000-4000-8000-000000000001'),
  (80000, date '2026-08-10', 'Compra do mês', 'cccccccc-0000-4000-8000-000000000001'),
  (80000, date '2026-09-10', 'Compra do mês', 'cccccccc-0000-4000-8000-000000000001'),
  (82000, date '2026-10-10', 'Compra do mês', 'cccccccc-0000-4000-8000-000000000001'),
  (40000, date '2026-06-15', 'Almoço', 'cccccccc-0000-4000-8000-000000000002'),
  (38000, date '2026-07-15', 'Almoço', 'cccccccc-0000-4000-8000-000000000002'),
  (42000, date '2026-08-15', 'Almoço', 'cccccccc-0000-4000-8000-000000000002'),
  (41000, date '2026-09-15', 'Almoço', 'cccccccc-0000-4000-8000-000000000002'),
  (30000, date '2026-10-03', 'almoço', 'cccccccc-0000-4000-8000-000000000002'),
  (40000, date '2026-10-20', 'Almoço ', 'cccccccc-0000-4000-8000-000000000002'),
  (200000, date '2026-08-02', 'Passagem', 'cccccccc-0000-4000-8000-000000000003'),
  (150000, date '2026-10-05', 'Hotel', 'cccccccc-0000-4000-8000-000000000003'),
  (5000, date '2026-10-06', null, 'cccccccc-0000-4000-8000-000000000002')
) as rows (amount, day, description, category);

insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind, description)
values ('income', 900000, '2026-10-01', 'cccccccc-0000-4000-8000-000000000004', 'pix', 'Salário');

select public.create_installment_purchase(
  'cccccccc-0000-4000-8000-000000000020', 300000, 3, '2026-10-12', 'Geladeira',
  'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000010'
);

select is(
  (select string_agg(month || ':' || expense_cents || ':' || income_cents, ' ' order by month)
   from public.month_totals('2026-09-01', '2026-11-01')),
  '2026-09-01:121000:0 2026-10-01:407000:900000',
  'month totals split expenses and income per month'
);

select is(
  (select string_agg(month || ':' || expense_cents, ' ' order by month)
   from public.month_totals('2026-06-01', '2026-11-01', 'cccccccc-0000-4000-8000-000000000002')),
  '2026-06-01:40000 2026-07-01:38000 2026-08-01:42000 2026-09-01:41000 2026-10-01:75000',
  'month totals can follow one category'
);

select is(
  (select string_agg(category_id || ':' || total_cents || ':' || entries, ' ' order by total_cents desc)
   from public.category_totals('2026-10-01', '2026-11-01')),
  'cccccccc-0000-4000-8000-000000000004:900000:1 cccccccc-0000-4000-8000-000000000001:182000:2 '
    || 'cccccccc-0000-4000-8000-000000000003:150000:1 cccccccc-0000-4000-8000-000000000002:75000:3',
  'category totals sum the period per category'
);

select is(
  (select string_agg(description || ':' || total_cents || ':' || entries, ' ' order by total_cents desc)
   from public.top_descriptions('2026-10-01', '2026-11-01')),
  'Hotel:150000:1 Geladeira:100000:1 Compra do mês:82000:1 Almoço:70000:2',
  'top descriptions group normalized text, keep the latest wording and skip income and blanks'
);

select is(
  (select count(*)::int from public.top_descriptions('2026-10-01', '2026-11-01')),
  4,
  'top descriptions leave out entries without a description'
);

select is(
  (select string_agg(description, ' ')
   from public.top_descriptions('2026-10-01', '2026-11-01', 'cccccccc-0000-4000-8000-000000000002')),
  'Almoço',
  'top descriptions can follow one category'
);

select is(
  (select string_agg(category_id || ':' || spent_cents || ':' || usual_cents, ' ')
   from public.above_normal('2026-10-01')),
  'cccccccc-0000-4000-8000-000000000002:75000:41000',
  'above normal flags a category well above its median'
);

select is(
  (select count(*)::int from public.above_normal('2026-10-01')
   where category_id = 'cccccccc-0000-4000-8000-000000000001'),
  0,
  'installments do not count as unusual spending'
);

select is(
  (select count(*)::int from public.above_normal('2026-10-01')
   where category_id = 'cccccccc-0000-4000-8000-000000000003'),
  0,
  'categories without a usual monthly spend are not flagged'
);

select is(
  (select count(*)::int from public.above_normal('2026-08-01')),
  0,
  'above normal needs three complete months of history'
);

update public.categories set monthly_limit_cents = 120000
where id = 'cccccccc-0000-4000-8000-000000000001';
select is(
  (select monthly_limit_cents from public.categories where id = 'cccccccc-0000-4000-8000-000000000001'),
  120000::bigint,
  'categories accept a monthly limit'
);

select throws_ok(
  $$ update public.categories set monthly_limit_cents = 0 where id = 'cccccccc-0000-4000-8000-000000000001' $$,
  '23514',
  null,
  'a monthly limit must be positive'
);

set local request.jwt.claims = '{"sub": "77777777-7777-4777-8777-777777777777", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('dddddddd-0000-4000-8000-000000000001', 'expense', 'Lazer', 'ticket', 'chart-1'),
  ('dddddddd-0000-4000-8000-000000000002', 'expense', 'Café', 'coffee', 'chart-2'),
  ('dddddddd-0000-4000-8000-000000000003', 'expense', 'Aluguel', 'house', 'chart-3'),
  ('dddddddd-0000-4000-8000-000000000004', 'expense', 'Delivery', 'utensils', 'chart-4');

insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind)
select 'expense', amount, day, category, 'pix'
from (values
  (10000, date '2026-06-01', 'dddddddd-0000-4000-8000-000000000001'::uuid),
  (10000, date '2026-07-01', 'dddddddd-0000-4000-8000-000000000001'),
  (60000, date '2026-08-01', 'dddddddd-0000-4000-8000-000000000001'),
  (10000, date '2026-09-01', 'dddddddd-0000-4000-8000-000000000001'),
  (10000, date '2026-06-02', 'dddddddd-0000-4000-8000-000000000002'),
  (10000, date '2026-07-02', 'dddddddd-0000-4000-8000-000000000002'),
  (10000, date '2026-08-02', 'dddddddd-0000-4000-8000-000000000002'),
  (13000, date '2026-09-02', 'dddddddd-0000-4000-8000-000000000002'),
  (400000, date '2026-06-03', 'dddddddd-0000-4000-8000-000000000003'),
  (400000, date '2026-07-03', 'dddddddd-0000-4000-8000-000000000003'),
  (400000, date '2026-08-03', 'dddddddd-0000-4000-8000-000000000003'),
  (450000, date '2026-09-03', 'dddddddd-0000-4000-8000-000000000003'),
  (20000, date '2026-06-04', 'dddddddd-0000-4000-8000-000000000004'),
  (20000, date '2026-07-04', 'dddddddd-0000-4000-8000-000000000004'),
  (20000, date '2026-08-04', 'dddddddd-0000-4000-8000-000000000004'),
  (60000, date '2026-09-04', 'dddddddd-0000-4000-8000-000000000004')
) as rows (amount, day, category);

select is_empty(
  $$ select * from public.above_normal('2026-08-01') $$,
  'a spike after only two complete months is not flagged yet'
);

select is(
  (select string_agg(category_id::text, ' ') from public.above_normal('2026-09-01')),
  'dddddddd-0000-4000-8000-000000000004',
  'above normal needs both the 25% jump and the minimum gap'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select is_empty($$ select * from public.month_totals('2026-01-01', '2027-01-01') $$,
  'another user gets no month totals');
select is_empty($$ select * from public.category_totals('2026-01-01', '2027-01-01') $$,
  'another user gets no category totals');
select is_empty($$ select * from public.top_descriptions('2026-01-01', '2027-01-01') $$,
  'another user gets no descriptions');

reset role;
select ok(
  not has_function_privilege('anon', 'public.above_normal(date)', 'execute')
    and not has_function_privilege('anon', 'public.month_totals(date, date, uuid)', 'execute')
    and not has_function_privilege('anon', 'public.category_totals(date, date)', 'execute')
    and not has_function_privilege('anon', 'public.top_descriptions(date, date, uuid)', 'execute'),
  'anon cannot run the insight functions'
);

select * from finish();
rollback;
