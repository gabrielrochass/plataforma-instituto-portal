begin;
select plan(20);

delete from public.staff_memberships;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'geral@test.local', '{"full_name": "Gera"}'),
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('33333333-3333-4333-8333-333333333333', 'adm-bv@test.local', '{"full_name": "Bia"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}');
update public.profiles set is_admin_geral = (id = '11111111-1111-4111-8111-111111111111');
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('33333333-3333-4333-8333-333333333333', '0a000000-0000-4000-8000-000000000002', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

insert into public.classes (id, unit_id, name, starts_on, ends_on, weekdays, workload_hours, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000a1', '0a000000-0000-4000-8000-000000000001',
   'Certificado A', private.today() - 90, private.today() - 1, '{2}', 40, 'numeric_10', 6, 75),
  ('c1000000-0000-4000-8000-0000000000a2', '0a000000-0000-4000-8000-000000000001',
   'Certificado B', private.today() - 90, private.today() + 30, '{3}', 40, 'numeric_10', 6, 75);
insert into public.class_teachers (class_id, unit_id, user_id) values
  ('c1000000-0000-4000-8000-0000000000a1', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444'),
  ('c1000000-0000-4000-8000-0000000000a2', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444');
insert into public.students (id, full_name, social_name, birth_date, phone, registered_unit_id) values
  ('5a000000-0000-4000-8000-0000000000a1', 'Ana Certa', null, '2000-01-01', '81999990011', '0a000000-0000-4000-8000-000000000001'),
  ('5a000000-0000-4000-8000-0000000000a2', 'João Registro', 'Joana Certa', '2000-01-01', '81999990012', '0a000000-0000-4000-8000-000000000001'),
  ('5a000000-0000-4000-8000-0000000000a3', 'Caio Falta', null, '2000-01-01', '81999990013', '0a000000-0000-4000-8000-000000000001');
insert into public.enrollments (id, student_id, class_id, enrolled_on)
select ('e1000000-0000-4000-8000-0000000000a' || n)::uuid, ('5a000000-0000-4000-8000-0000000000a' || n)::uuid,
  'c1000000-0000-4000-8000-0000000000a1', private.today() - 90
from generate_series(1, 3) n;
update public.enrollments set status = 'completed', ended_on = private.today() - 1, attendance_pct = 90
where id in ('e1000000-0000-4000-8000-0000000000a1', 'e1000000-0000-4000-8000-0000000000a2');
update public.enrollments set status = 'failed', ended_on = private.today() - 1, attendance_pct = 40
where id = 'e1000000-0000-4000-8000-0000000000a3';
update public.classes set status = 'finished', finished_at = now() where id = 'c1000000-0000-4000-8000-0000000000a1';

select set_eq(
  $$ select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') $$,
  array['open_offers', 'submit_enrollment_request', 'verify_certificate'],
  'anon only runs the public functions'
);

set local role authenticated;

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select public.issue_certificates('c1000000-0000-4000-8000-0000000000a1') $$,
  '42501', null, 'teachers do not issue certificates'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select throws_ok(
  $$ select public.issue_certificates('c1000000-0000-4000-8000-0000000000a2') $$,
  '55000', null, 'only finished classes get certificates'
);
select is(public.issue_certificates('c1000000-0000-4000-8000-0000000000a1'), 2, 'everyone who completed gets one');
select is(public.issue_certificates('c1000000-0000-4000-8000-0000000000a1'), 0, 'issuing again changes nothing');
select is(
  (select string_agg(student_name, ',' order by student_name) from public.certificates where class_id = 'c1000000-0000-4000-8000-0000000000a1'),
  'Ana Certa,Joana Certa',
  'the social name goes on the certificate'
);

create temporary table codes on commit drop as
select student_id, code, id from public.certificates where class_id = 'c1000000-0000-4000-8000-0000000000a1';
grant select on codes to anon, authenticated;

set local role anon;
select is(
  (select student_name || '|' || workload_hours || '|' || revoked from public.verify_certificate(
    (select lower(replace(code, '-', ' ')) from codes where student_id = '5a000000-0000-4000-8000-0000000000a1'))),
  'Ana Certa|40|false',
  'anyone verifies a code typed loosely'
);
select is_empty(
  $$ select * from public.verify_certificate('2222-2222-2222') $$,
  'unknown codes return nothing'
);
select throws_ok(
  $$ select * from public.certificates $$,
  '42501', null, 'anon cannot list certificates'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';
select throws_ok(
  $$ select public.revoke_certificate((select id from codes where student_id = '5a000000-0000-4000-8000-0000000000a1'), 'Erro') $$,
  '22023', null, 'another unit cannot revoke'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ select public.revoke_certificate((select id from codes where student_id = '5a000000-0000-4000-8000-0000000000a1'), 'Nome errado') $$,
  'the unit admin revokes'
);
select is(
  (select revoked from public.verify_certificate((select code from codes where student_id = '5a000000-0000-4000-8000-0000000000a1'))),
  true,
  'a revoked code shows as invalid'
);
select is(public.issue_certificates('c1000000-0000-4000-8000-0000000000a1'), 1, 'a new one can be issued after revoking');

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select public.post_announcement('Para todos', 'Texto', 'everyone') $$,
  '42501', null, 'teachers do not post to everyone'
);
select lives_ok(
  $$ select public.post_announcement('Prova sexta', 'Tragam lápis', 'class', null, 'c1000000-0000-4000-8000-0000000000a2') $$,
  'teachers post to their own class'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select is(
  (select count(*)::int from public.announcement_list() where title = 'Prova sexta'),
  0,
  'other units do not see a class announcement'
);

set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select lives_ok(
  $$ select public.post_announcement('Recesso', 'Sem aulas na sexta', 'everyone') $$,
  'admin geral posts to everyone'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select lives_ok(
  $$ select public.mark_announcement_read((select id from public.announcement_list() where title = 'Recesso')) $$,
  'a teacher confirms reading'
);
select throws_ok(
  $$ select public.archive_announcement((select id from public.announcement_list() where title = 'Recesso')) $$,
  '42501', null, 'only the author or coordination archives'
);

set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select is(
  (select read_count from public.announcement_list() where title = 'Recesso'),
  1,
  'the author sees how many people read it'
);

select * from finish();
rollback;
