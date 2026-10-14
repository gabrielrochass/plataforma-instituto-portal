begin;
select plan(30);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'geral@test.local', '{"full_name": "Gera"}'),
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('33333333-3333-4333-8333-333333333333', 'adm-bv@test.local', '{"full_name": "Bia"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('55555555-5555-4555-8555-555555555555', 'prof-ambas@test.local', '{"full_name": "Ana"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}'),
  ('77777777-7777-4777-8777-777777777777', 'novo@test.local', '{"full_name": "Novo"}');

update public.profiles set is_admin_geral = true where id = '11111111-1111-4111-8111-111111111111';
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('33333333-3333-4333-8333-333333333333', '0a000000-0000-4000-8000-000000000002', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('55555555-5555-4555-8555-555555555555', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('55555555-5555-4555-8555-555555555555', '0a000000-0000-4000-8000-000000000002', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

set local role authenticated;

set local request.jwt.claims = '{"sub": "77777777-7777-4777-8777-777777777777", "role": "authenticated"}';
select is_empty($$ select id from public.units $$, 'someone without a unit sees no units');
select is((select count(*)::int from public.profiles), 1, 'someone without a unit sees only their own profile');

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select is((select count(*)::int from public.units), 2, 'staff see every unit');
select is(
  (select count(*)::int from public.staff_memberships),
  3,
  'a teacher sees the staff of their own unit and their own rows'
);
select throws_ok(
  $$ update public.profiles set is_admin_geral = true where id = '44444444-4444-4444-8444-444444444444' $$,
  '42501', null, 'nobody can make themselves admin geral'
);
select throws_ok(
  $$ select public.create_invite(gen_random_uuid(), repeat('a', 64), 'Clara', '0a000000-0000-4000-8000-000000000001', 'teacher') $$,
  '42501', null, 'a teacher cannot invite'
);
select throws_ok(
  $$ insert into public.staff_memberships (user_id, unit_id, role)
     values ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000002', 'admin') $$,
  '42501', null, 'memberships are never written directly'
);
select is_empty($$ select id from public.team_members() $$, 'a teacher does not see the team list');
select is_empty($$ select id from public.pending_invites() $$, 'a teacher does not see invites');

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ select public.create_invite('aaaaaaaa-0000-4000-8000-000000000001', repeat('a', 64), ' Clara ', '0a000000-0000-4000-8000-000000000001', 'teacher') $$,
  'a unit admin invites a teacher to their unit'
);
select lives_ok(
  $$ select public.create_invite('aaaaaaaa-0000-4000-8000-000000000001', repeat('a', 64), 'Clara', '0a000000-0000-4000-8000-000000000001', 'teacher') $$,
  'repeating the same invite is harmless'
);
select throws_ok(
  $$ select public.create_invite(gen_random_uuid(), repeat('b', 64), 'Clara', '0a000000-0000-4000-8000-000000000002', 'teacher') $$,
  '42501', null, 'a unit admin cannot invite to another unit'
);
select throws_ok(
  $$ select public.create_invite(gen_random_uuid(), repeat('c', 64), 'Clara', '0a000000-0000-4000-8000-000000000001', 'admin') $$,
  '42501', null, 'a unit admin cannot invite another admin'
);
select is(
  (select display_name from public.pending_invites()),
  'Clara',
  'the unit admin sees the pending invite with a trimmed name'
);
select is(
  (select array_agg(display_name order by display_name) from public.team_members()),
  array['Ana', 'Paulo', 'Rita'],
  'a unit admin sees only the people of their unit'
);
select is(
  (select array_agg(display_name order by display_name) from public.team_members() where manageable),
  array['Paulo'],
  'a unit admin manages only teachers who work only in their unit'
);
select throws_ok(
  $$ select public.set_staff_active('55555555-5555-4555-8555-555555555555', false) $$,
  '42501', null, 'a unit admin cannot deactivate a teacher who also works in another unit'
);
select lives_ok(
  $$ select public.set_membership('55555555-5555-4555-8555-555555555555', '0a000000-0000-4000-8000-000000000001', 'teacher') $$,
  'a unit admin keeps a shared teacher in their unit'
);
select throws_ok(
  $$ select public.set_membership('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000001', 'teacher') $$,
  '42501', null, 'a unit admin cannot pull in someone they do not know'
);
select lives_ok(
  $$ select public.remove_membership('55555555-5555-4555-8555-555555555555', '0a000000-0000-4000-8000-000000000001') $$,
  'a unit admin removes a teacher from their unit'
);
select lives_ok(
  $$ select public.set_staff_active('44444444-4444-4444-8444-444444444444', false) $$,
  'a unit admin deactivates their own teacher'
);
select throws_ok(
  $$ select public.set_admin_geral('22222222-2222-4222-8222-222222222222', true) $$,
  '42501', null, 'only admin geral grants admin geral'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select is_empty($$ select id from public.units $$, 'a deactivated person loses access at once');

set local request.jwt.claims = '{"sub": "77777777-7777-4777-8777-777777777777", "role": "authenticated"}';
select is(
  public.accept_invite(repeat('a', 64)),
  '0a000000-0000-4000-8000-000000000001'::uuid,
  'accepting the invite joins the unit'
);
select is((select count(*)::int from public.units), 2, 'the new teacher now sees the units');
select throws_ok(
  $$ select public.accept_invite(repeat('f', 64)) $$,
  '22023', null, 'an unknown invite is refused'
);

set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select throws_ok(
  $$ select public.set_admin_geral('11111111-1111-4111-8111-111111111111', false) $$,
  '23514', null, 'the last admin geral cannot step down'
);
select lives_ok(
  $$ insert into public.units (code, name) values ('IB', 'Imbiribeira') $$,
  'admin geral adds a unit'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.units (code, name) values ('XX', 'Outra') $$,
  '42501', null, 'a unit admin cannot add units'
);

reset role;

select ok(
  not has_function_privilege('anon', 'public.invite_info(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.consume_password_reset(text)', 'execute')
  and not has_table_privilege('authenticated', 'private.staff_invites', 'select'),
  'invite and reset tokens stay out of reach of clients'
);

select * from finish();
rollback;
