begin;
select plan(17);

insert into auth.users (id, email) values
  ('55555555-5555-4555-8555-555555555555', 'eva@test.local'),
  ('66666666-6666-4666-8666-666666666666', 'fabio@test.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "55555555-5555-4555-8555-555555555555", "role": "authenticated"}';

insert into public.jars (id, name, icon, color, target_cents, target_date) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'Viagem', 'plane', 'chart-1', 1000000, '2027-06-30'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'Reserva', 'piggy-bank', 'chart-3', null, null);

insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on, is_opening) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'deposit', 200000, '2026-07-01', true);

insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on, note) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'deposit', 50000, '2026-07-10', 'Salário'),
  ('eeeeeeee-0000-4000-8000-000000000001', 'deposit', 60000, '2026-08-10', null),
  ('eeeeeeee-0000-4000-8000-000000000001', 'withdrawal', 20000, '2026-08-20', 'Imprevisto'),
  ('eeeeeeee-0000-4000-8000-000000000001', 'deposit', 50000, '2026-09-10', null),
  ('eeeeeeee-0000-4000-8000-000000000002', 'deposit', 30000, '2026-09-15', null);

select is(
  (select string_agg(jar_id || ':' || balance_cents || ':' || opening_cents || ':' || first_month, ' ' order by jar_id)
   from public.jar_totals()),
  'eeeeeeee-0000-4000-8000-000000000001:340000:200000:2026-07-01 eeeeeeee-0000-4000-8000-000000000002:30000:0:2026-09-01',
  'jar totals add deposits, subtract withdrawals and start at the first regular entry'
);

select is(
  (select string_agg(month || ':' || net_cents, ' ' order by month)
   from public.jar_months('2026-06-01', '2026-10-01')
   where jar_id = 'eeeeeeee-0000-4000-8000-000000000001'),
  '2026-07-01:50000 2026-08-01:40000 2026-09-01:50000',
  'monthly net contributions leave the opening balance out'
);

select throws_ok(
  $$ insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on, is_opening)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'deposit', 1000, '2026-07-02', true) $$,
  '23505',
  null,
  'a jar has at most one opening balance'
);

select throws_ok(
  $$ insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on, is_opening)
     values ('eeeeeeee-0000-4000-8000-000000000002', 'withdrawal', 1000, '2026-09-16', true) $$,
  '23514',
  null,
  'an opening balance is a deposit'
);

select throws_ok(
  $$ insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on)
     values ('eeeeeeee-0000-4000-8000-000000000002', 'deposit', 0, '2026-09-16') $$,
  '23514',
  null,
  'amounts are positive'
);

select throws_ok(
  $$ insert into public.jars (name, icon, color) values ('viagem', 'plane', 'chart-2') $$,
  '23505',
  null,
  'active jar names are unique per user'
);

select lives_ok(
  $$ select public.create_jar('eeeeeeee-0000-4000-8000-000000000003', 'Carro', 'car', 'chart-4',
       '2026-10-05', 4000000, '2028-06-30', null, 500000) $$,
  'create_jar creates a jar with its opening balance'
);

select is(
  (select balance_cents || ':' || opening_cents from public.jar_totals()
   where jar_id = 'eeeeeeee-0000-4000-8000-000000000003'),
  '500000:500000',
  'the opening balance comes in with the jar'
);

select throws_ok(
  $$ select public.create_jar('eeeeeeee-0000-4000-8000-000000000004', 'Moto', 'car', 'chart-4',
       '2026-10-05', null, null, null, 0) $$,
  '23514',
  null,
  'a failed opening balance creates nothing'
);

select is_empty(
  $$ select 1 from public.jars where id = 'eeeeeeee-0000-4000-8000-000000000004' $$,
  'no jar is left behind without its opening balance'
);

update public.jars set archived_at = now() where id = 'eeeeeeee-0000-4000-8000-000000000002';
select is(
  (select archived_at is not null from public.jars where id = 'eeeeeeee-0000-4000-8000-000000000002'),
  true,
  'jars can be archived'
);

select lives_ok(
  $$ update public.jars
     set name = 'Viagem longa', icon = 'plane', color = 'chart-2', target_cents = 1200000,
         target_date = '2027-12-31', planned_monthly_cents = 50000
     where id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  'the owner can edit every jar field'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';

select is_empty($$ select * from public.jars $$, 'another user sees no jars');
select is_empty($$ select * from public.jar_entries $$, 'another user sees no jar entries');
select is_empty($$ select * from public.jar_totals() $$, 'another user gets no jar totals');

select throws_ok(
  $$ insert into public.jar_entries (jar_id, kind, amount_cents, occurred_on)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'deposit', 1000, '2026-09-20') $$,
  '23503',
  null,
  'nobody can deposit into another user''s jar'
);

reset role;
select ok(
  not has_table_privilege('anon', 'public.jars', 'select')
    and not has_table_privilege('anon', 'public.jar_entries', 'select')
    and not has_function_privilege('anon', 'public.jar_totals()', 'execute')
    and not has_function_privilege('anon', 'public.jar_months(date, date)', 'execute')
    and not has_function_privilege('anon', 'public.create_jar(uuid, text, text, text, date, bigint, date, bigint, bigint)', 'execute'),
  'anon has no access to jars'
);

select * from finish();
rollback;
