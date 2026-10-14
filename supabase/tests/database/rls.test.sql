begin;
select plan(28);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'ana@test.local', '{"full_name": "Ana"}'),
  ('22222222-2222-4222-8222-222222222222', 'bruno@test.local', '{}');

select is((select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'), 'Ana',
  'new users get a profile with their name');
select is(
  (select count(*)::int from public.categories
   where user_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')),
  0,
  'new users start without categories'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'expense', 'Restaurantes', 'utensils', 'chart-2'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'expense', 'Compras', 'shopping-bag', 'chart-4'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'income', 'Salário', 'briefcase', 'chart-3');

insert into public.cards (id, name, design, best_purchase_day, due_day) values
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Nubank', 'ametista', 3, 10),
  ('aaaaaaaa-0000-4000-8000-000000000011', 'Inter', 'por-do-sol', null, null);

insert into public.transactions (id, kind, amount_cents, occurred_on, description, category_id, payment_kind)
values ('aaaaaaaa-0000-4000-8000-000000000020', 'expense', 4590, '2026-10-02', E'  Almoço  no\tCentro ',
  'aaaaaaaa-0000-4000-8000-000000000001', 'pix');

select is(
  (select description || '|' || description_norm from public.transactions where id = 'aaaaaaaa-0000-4000-8000-000000000020'),
  E'Almoço  no\tCentro|almoco no centro',
  'description is trimmed and normalized'
);
select is(
  public.suggest_category('ALMOCO no centro', 'expense'),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid,
  'category is suggested from a matching description'
);

insert into public.transactions (id, kind, amount_cents, occurred_on, category_id, payment_kind, card_id) values
  ('aaaaaaaa-0000-4000-8000-000000000021', 'expense', 1000, '2026-10-02', 'aaaaaaaa-0000-4000-8000-000000000002', 'card', 'aaaaaaaa-0000-4000-8000-000000000010'),
  ('aaaaaaaa-0000-4000-8000-000000000022', 'expense', 1000, '2026-10-02', 'aaaaaaaa-0000-4000-8000-000000000002', 'card', 'aaaaaaaa-0000-4000-8000-000000000011');

select is(
  (select bill_closes_on || ' / ' || bill_due_on from public.transactions where id = 'aaaaaaaa-0000-4000-8000-000000000021'),
  '2026-10-02 / 2026-10-10',
  'a card with bill days puts purchases on a bill'
);
select is(
  (select bill_due_on from public.transactions where id = 'aaaaaaaa-0000-4000-8000-000000000022'),
  null,
  'a card without bill days has no bill'
);

select lives_ok(
  $$ select public.create_installment_purchase('aaaaaaaa-0000-4000-8000-000000000030', 100000, 3, '2026-03-30', 'TV',
    'aaaaaaaa-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000010') $$,
  'an installment purchase can be created'
);
select is(
  (select string_agg(amount_cents::text, ',' order by installment_number) from public.transactions
    where installment_group_id = 'aaaaaaaa-0000-4000-8000-000000000030'),
  '33334,33333,33333',
  'leftover cents go to the first installment'
);
select is(
  (select string_agg(occurred_on::text, ',' order by installment_number) from public.transactions
    where installment_group_id = 'aaaaaaaa-0000-4000-8000-000000000030'),
  '2026-03-30,2026-04-30,2026-05-30',
  'each installment is dated one month after the previous'
);
select lives_ok(
  $$ select public.create_installment_purchase('aaaaaaaa-0000-4000-8000-000000000030', 100000, 3, '2026-03-30', 'TV',
    'aaaaaaaa-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000010') $$,
  'retrying an identical installment purchase is accepted'
);
select is(
  (select count(*)::int from public.transactions where installment_group_id = 'aaaaaaaa-0000-4000-8000-000000000030'),
  3,
  'retrying does not duplicate installments'
);
select throws_ok(
  $$ update public.transactions set amount_cents = 1 where installment_group_id = 'aaaaaaaa-0000-4000-8000-000000000030' $$,
  '23514', null, 'installment amounts cannot be edited'
);
select throws_ok(
  $$ select public.create_installment_purchase(gen_random_uuid(), 1000, 2, '2026-10-01', null,
    'aaaaaaaa-0000-4000-8000-000000000002', null) $$,
  '23514', null, 'installments require a card'
);
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind)
     values ('income', 100, '2026-10-01', 'aaaaaaaa-0000-4000-8000-000000000002', 'pix') $$,
  '23503', null, 'transaction kind must match the category kind'
);
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind)
     values ('expense', 100, '2026-10-01', 'aaaaaaaa-0000-4000-8000-000000000002', 'card') $$,
  '23514', null, 'paying with a card requires a card'
);
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind, card_id)
     values ('expense', 100, '2026-10-01', 'aaaaaaaa-0000-4000-8000-000000000002', 'pix', 'aaaaaaaa-0000-4000-8000-000000000010') $$,
  '23514', null, 'pix and boleto do not take a card'
);
select throws_ok(
  $$ update public.transactions set bill_due_on = '2030-01-01' $$,
  '42501', null, 'bill dates cannot be written directly'
);
select throws_ok(
  $$ insert into public.cards (name, design) values ('Falso', 'neon') $$,
  '23514', null, 'card designs come from the preset list'
);
select throws_ok(
  $$ insert into public.cards (name, design, best_purchase_day) values ('Meio', 'ouro', 5) $$,
  '23514', null, 'bill days are both set or both empty'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';

select is((select count(*)::int from public.categories), 0, 'another user sees no categories');
select is((select count(*)::int from public.cards), 0, 'another user sees no cards');
select is((select count(*)::int from public.transactions), 0, 'another user sees no transactions');
select is((select count(*)::int from public.profiles where id = '11111111-1111-4111-8111-111111111111'), 0,
  'another user cannot see someone else''s profile');
select is_empty($$ delete from public.transactions returning id $$, 'another user cannot delete transactions');

insert into public.categories (id, kind, name, icon, color)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'expense', 'Mercado', 'shopping-cart', 'chart-1');
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind, card_id)
     values ('expense', 100, '2026-10-01', 'bbbbbbbb-0000-4000-8000-000000000001', 'card',
       'aaaaaaaa-0000-4000-8000-000000000010') $$,
  '23503', null, 'another user cannot use someone else''s card'
);
select throws_ok(
  $$ insert into public.categories (user_id, kind, name, icon, color)
     values ('11111111-1111-4111-8111-111111111111', 'expense', 'Invasão', 'ellipsis', 'chart-1') $$,
  '42501', null, 'user_id cannot be set to someone else'
);

reset role;

select ok(
  not has_table_privilege('anon', 'public.transactions', 'select')
  and not has_table_privilege('anon', 'public.categories', 'select')
  and not has_table_privilege('anon', 'public.cards', 'select')
  and not has_table_privilege('anon', 'public.profiles', 'select'),
  'anon has no table access'
);
select ok(
  not has_function_privilege('anon', 'public.restore_transactions(uuid[])', 'execute')
  and not has_function_privilege('anon', 'public.month_totals(date, date, uuid)', 'execute'),
  'anon cannot call app functions'
);

select * from finish();
rollback;
