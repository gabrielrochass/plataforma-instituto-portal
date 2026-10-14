begin;
select plan(18);

insert into auth.users (id, email) values
  ('88888888-8888-4888-8888-888888888888', 'hana@test.local'),
  ('99999999-9999-4999-8999-999999999999', 'ivo@test.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "88888888-8888-4888-8888-888888888888", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('cccccccc-0000-4000-8000-000000000001', 'expense', 'Mercado', 'shopping-cart', 'chart-3');
insert into public.cards (id, name, design, best_purchase_day, due_day) values
  ('cccccccc-0000-4000-8000-000000000002', 'Nubank', 'ametista', 3, 10);
insert into public.transactions (id, kind, amount_cents, occurred_on, category_id, payment_kind, card_id) values
  ('cccccccc-0000-4000-8000-000000000010', 'expense', 2500, '2026-08-05', 'cccccccc-0000-4000-8000-000000000001', 'card', 'cccccccc-0000-4000-8000-000000000002'),
  ('cccccccc-0000-4000-8000-000000000011', 'expense', 3000, '2026-09-05', 'cccccccc-0000-4000-8000-000000000001', 'pix', null);
insert into public.jars (id, name, icon, color) values
  ('cccccccc-0000-4000-8000-000000000020', 'Viagem', 'plane', 'chart-1');
insert into public.jar_entries (id, jar_id, kind, amount_cents, occurred_on) values
  ('cccccccc-0000-4000-8000-000000000021', 'cccccccc-0000-4000-8000-000000000020', 'deposit', 5000, '2026-08-10');

select lives_ok(
  $$ insert into public.month_closings (month) values ('2026-08-01') $$,
  'a month that is over can be closed'
);
select throws_ok(
  $$ insert into public.month_closings (month) values (date_trunc('month', private.today_sp())::date) $$,
  '22023',
  null,
  'the current month cannot be closed'
);
select throws_ok(
  $$ insert into public.month_closings (month) values ('2026-07-15') $$,
  '23514',
  null,
  'a closing is always the first day of a month'
);
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind)
     values ('expense', 100, '2026-08-20', 'cccccccc-0000-4000-8000-000000000001', 'pix') $$,
  '55000',
  null,
  'a closed month takes no new entries'
);
select throws_ok(
  $$ update public.transactions set amount_cents = 2600 where id = 'cccccccc-0000-4000-8000-000000000010' $$,
  '55000',
  null,
  'entries of a closed month cannot change'
);
select throws_ok(
  $$ update public.transactions set occurred_on = '2026-08-30' where id = 'cccccccc-0000-4000-8000-000000000011' $$,
  '55000',
  null,
  'an entry cannot move into a closed month'
);
select throws_ok(
  $$ delete from public.transactions where id = 'cccccccc-0000-4000-8000-000000000010' $$,
  '55000',
  null,
  'entries of a closed month cannot be deleted'
);
select lives_ok(
  $$ update public.cards set due_day = 15 where id = 'cccccccc-0000-4000-8000-000000000002' $$,
  'changing the card still reprices bills of a closed month'
);
select is(
  (select bill_due_on from public.transactions where id = 'cccccccc-0000-4000-8000-000000000010'),
  '2026-09-15'::date,
  'the closed month entry got the new bill'
);
select throws_ok(
  $$ insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on)
     values ('cccccccc-0000-4000-8000-000000000020', 'deposit', 100, '2026-08-11') $$,
  '55000',
  null,
  'a closed month takes no jar movements'
);
select throws_ok(
  $$ delete from public.jar_entries where id = 'cccccccc-0000-4000-8000-000000000021' $$,
  '55000',
  null,
  'jar movements of a closed month cannot be deleted'
);

set local request.jwt.claims = '{"sub": "99999999-9999-4999-8999-999999999999", "role": "authenticated"}';

select is_empty($$ select * from public.month_closings $$, 'nobody sees another person''s closings');
select lives_ok(
  $$ insert into public.categories (id, kind, name, icon, color)
     values ('cccccccc-0000-4000-8000-000000000030', 'expense', 'Casa', 'house', 'chart-2');
     insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind)
     values ('expense', 100, '2026-08-20', 'cccccccc-0000-4000-8000-000000000030', 'pix') $$,
  'another person''s closing does not lock my month'
);

set local request.jwt.claims = '{"sub": "88888888-8888-4888-8888-888888888888", "role": "authenticated"}';

delete from public.month_closings where month = '2026-08-01';

select lives_ok(
  $$ update public.transactions set amount_cents = 2600 where id = 'cccccccc-0000-4000-8000-000000000010' $$,
  'reopening the month unlocks its entries'
);

insert into public.month_closings (month) values ('2026-08-01');

reset role;

select ok(
  not has_table_privilege('anon', 'public.month_closings', 'select, insert, delete'),
  'anon has no access to closings'
);
select lives_ok(
  $$ delete from auth.users where id = '88888888-8888-4888-8888-888888888888' $$,
  'an account with closed months can be deleted'
);
select is(
  (select count(*)::int from public.transactions where user_id = '88888888-8888-4888-8888-888888888888'),
  0,
  'deleting the account removes entries of closed months'
);
select is(
  (select count(*)::int from public.month_closings where user_id = '88888888-8888-4888-8888-888888888888'),
  0,
  'deleting the account removes its closings'
);

select * from finish();
rollback;
