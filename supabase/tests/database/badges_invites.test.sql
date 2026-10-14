begin;
select plan(9);

delete from public.staff_memberships;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'geral@test.local', '{"full_name": "Gera"}'),
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}'),
  ('77777777-7777-4777-8777-777777777777', 'novo@test.local', '{"full_name": "Novo"}');
update public.profiles set is_admin_geral = (id = '11111111-1111-4111-8111-111111111111');
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');
insert into public.students (id, full_name, birth_date, phone, registered_unit_id) values
  ('5a000000-0000-4000-8000-0000000000b1', 'Cris Crachá', '2000-01-01', '81999991111', '0a000000-0000-4000-8000-000000000001');

select ok(
  (select badge_token ~ '^[2-9A-HJ-NP-Z]{10}$' from public.students where id = '5a000000-0000-4000-8000-0000000000b1'),
  'every student gets a badge code'
);

create temporary table first_token on commit drop as
select badge_token from public.students where id = '5a000000-0000-4000-8000-0000000000b1';
grant select on first_token to authenticated;

set local role authenticated;

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select throws_ok(
  $$ select public.renew_badge('5a000000-0000-4000-8000-0000000000b1') $$,
  '42501', null, 'staff of another unit cannot renew the badge'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ select public.renew_badge('5a000000-0000-4000-8000-0000000000b1') $$,
  'the unit admin renews a lost badge'
);
select isnt(
  (select badge_token from public.students where id = '5a000000-0000-4000-8000-0000000000b1'),
  (select badge_token from first_token),
  'the old badge stops working'
);
select throws_ok(
  $$ select public.create_invite(gen_random_uuid(), repeat('d', 64), 'Gil', null, 'admin', true) $$,
  '42501', null, 'a unit admin cannot invite an admin geral'
);
select throws_ok(
  $$ update public.students set badge_token = 'AAAAAAAAAA' where id = '5a000000-0000-4000-8000-0000000000b1' $$,
  '42501', null, 'the badge code is never written directly'
);

set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select lives_ok(
  $$ select public.create_invite('aaaaaaaa-0000-4000-8000-0000000000e1', repeat('e', 64), 'Gil', null, 'admin', true) $$,
  'admin geral invites another admin geral'
);

set local request.jwt.claims = '{"sub": "77777777-7777-4777-8777-777777777777", "role": "authenticated"}';
select lives_ok(
  $$ select public.accept_invite(repeat('e', 64)) $$,
  'the invite is accepted'
);

reset role;
select is(
  (select is_admin_geral from public.profiles where id = '77777777-7777-4777-8777-777777777777'),
  true,
  'the new person is admin geral without a unit'
);

select * from finish();
rollback;
