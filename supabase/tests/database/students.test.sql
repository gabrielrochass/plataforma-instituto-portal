begin;
select plan(26);

insert into auth.users (id, email, raw_user_meta_data) values
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('33333333-3333-4333-8333-333333333333', 'adm-bv@test.local', '{"full_name": "Bia"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}');

insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('33333333-3333-4333-8333-333333333333', '0a000000-0000-4000-8000-000000000002', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

insert into public.classes (id, unit_id, name, starts_on, ends_on, weekdays, workload_hours, capacity, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-000000000001',
   'Python RA', '2026-08-01', '2026-12-18', '{2}', 40, 2, 'numeric_10', 6, 75),
  ('c2000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-000000000002',
   'Python BV', '2026-08-01', '2026-12-18', '{3}', 40, null, 'numeric_10', 6, 75),
  ('c3000000-0000-4000-8000-000000000003', '0a000000-0000-4000-8000-000000000001',
   'Python Tarde RA', '2026-08-01', '2026-12-18', '{4}', 40, null, 'numeric_10', 6, 75);
insert into public.class_teachers (class_id, unit_id, user_id) values
  ('c1000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444'),
  ('c3000000-0000-4000-8000-000000000003', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444'),
  ('c2000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-000000000002', '66666666-6666-4666-8666-666666666666');

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select throws_ok(
  $$ select public.register_student(
       p_id => '5a000000-0000-4000-8000-000000000001',
       p_full_name => 'Maria Souza',
       p_birth_date => '2012-03-10',
       p_guardians => '[]',
       p_accessibility => '{}',
       p_consents => '{data_processing}',
       p_class_id => 'c1000000-0000-4000-8000-000000000001',
       p_enrollment_id => 'e1000000-0000-4000-8000-000000000001'
     ) $$,
  '23514', null, 'a minor cannot be enrolled without a guardian'
);
select lives_ok(
  $$ select public.register_student(
       p_id => '5a000000-0000-4000-8000-000000000001',
       p_full_name => 'Maria Souza',
       p_social_name => 'Mari',
       p_birth_date => '2012-03-10',
       p_cpf => '52998224725',
       p_phone => '81999991234',
       p_guardians => '[{"full_name": "Joana Souza", "relationship": "mother", "phone": "81988887777"}]',
       p_accessibility => '{visual}',
       p_accessibility_notes => 'Senta na frente',
       p_consents => '{data_processing,image_use}',
       p_class_id => 'c1000000-0000-4000-8000-000000000001',
       p_enrollment_id => 'e1000000-0000-4000-8000-000000000001'
     ) $$,
  'a teacher registers and enrolls a minor with a guardian'
);
select is(
  (select registered_unit_id from public.students where id = '5a000000-0000-4000-8000-000000000001'),
  '0a000000-0000-4000-8000-000000000001'::uuid,
  'the student belongs to the class unit'
);
select throws_ok(
  $$ select cpf from public.students $$,
  '42501', null, 'a teacher never reads the CPF'
);
select is_empty(
  $$ select cpf from public.student_private('5a000000-0000-4000-8000-000000000001') $$,
  'not even through the private details'
);
select throws_ok(
  $$ update public.students set cpf = null where id = '5a000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'nor changes it'
);
select is(
  (select accessibility from public.student_care where student_id = '5a000000-0000-4000-8000-000000000001'),
  '{visual}'::public.accessibility_list,
  'the teacher sees the classroom notes of a current student'
);
select is(
  (select array_agg(display_name) from public.find_students('maria souza')),
  array['Mari'],
  'search finds the student by name, ignoring case and accents'
);
select is(
  (select display_name from public.find_students('529.982.247-25')),
  'Mari',
  'search finds the student by CPF'
);
select throws_ok(
  $$ select * from public.find_students('ma') $$,
  '22023', null, 'search needs at least three letters'
);
select lives_ok(
  $$ select public.register_student(
       p_id => '5a000000-0000-4000-8000-000000000002',
       p_full_name => 'Pedro Lima',
       p_birth_date => '2000-01-01',
       p_guardians => '[]',
       p_accessibility => '{}',
       p_consents => '{}',
       p_class_id => 'c1000000-0000-4000-8000-000000000001',
       p_enrollment_id => 'e1000000-0000-4000-8000-000000000002'
     ) $$,
  'an adult needs no guardian'
);
select throws_ok(
  $$ select public.register_student(
       p_id => '5a000000-0000-4000-8000-000000000003',
       p_full_name => 'Lia Melo',
       p_birth_date => '2000-01-01',
       p_guardians => '[]',
       p_accessibility => '{}',
       p_consents => '{}',
       p_class_id => 'c1000000-0000-4000-8000-000000000001',
       p_enrollment_id => 'e1000000-0000-4000-8000-000000000003'
     ) $$,
  '54000', null, 'a full class refuses one more student'
);
select throws_ok(
  $$ select public.register_student(
       p_id => '5a000000-0000-4000-8000-000000000004',
       p_full_name => 'Outro CPF',
       p_birth_date => '2000-01-01',
       p_cpf => '52998224725',
       p_guardians => '[]',
       p_accessibility => '{}',
       p_consents => '{}',
       p_class_id => 'c3000000-0000-4000-8000-000000000003',
       p_enrollment_id => 'e1000000-0000-4000-8000-000000000004'
     ) $$,
  '23505', null, 'a CPF is registered only once'
);
select throws_ok(
  $$ select public.register_student(
       p_id => '5a000000-0000-4000-8000-000000000005',
       p_full_name => 'Sem turma',
       p_birth_date => '2000-01-01',
       p_cpf => '12345678900',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_guardians => '[]',
       p_accessibility => '{}',
       p_consents => '{}'
     ) $$,
  '23514', null, 'an invalid CPF is refused'
);
select throws_ok(
  $$ delete from public.guardians where student_id = '5a000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'the last guardian of an enrolled minor stays'
);

select lives_ok(
  $$ select public.transfer_enrollment(
       'e1000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001',
       'c3000000-0000-4000-8000-000000000003', '2026-10-14', 'schedule'
     ) $$,
  'a teacher moves a student between their classes'
);
select lives_ok(
  $$ select public.transfer_enrollment(
       'e1000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001',
       'c3000000-0000-4000-8000-000000000003', '2026-10-14', 'schedule'
     ) $$,
  'repeating the transfer is harmless'
);
select is(
  (select array_agg(class_name || ':' || status order by status) from public.student_timeline('5a000000-0000-4000-8000-000000000001')),
  array['Python Tarde RA:active', 'Python RA:transferred'],
  'the profile keeps both classes in the history'
);
select is(
  (select transferred_to_class from public.student_timeline('5a000000-0000-4000-8000-000000000001') where status = 'transferred'),
  'Python Tarde RA',
  'the old enrollment points to the new class'
);
select throws_ok(
  $$ select public.transfer_enrollment(
       'e1000000-0000-4000-8000-000000000002', gen_random_uuid(),
       'c2000000-0000-4000-8000-000000000002', '2026-10-14', 'moved'
     ) $$,
  '42501', null, 'a teacher cannot move a student into a class they do not teach'
);
select lives_ok(
  $$ select public.end_enrollment(p_enrollment_id => 'e1000000-0000-4000-8000-000000000002', p_status => 'dropped_out', p_reason => 'work', p_note => ' Arrumou emprego ', p_on => '2026-10-14') $$,
  'a teacher records a drop out with its reason'
);
select lives_ok(
  $$ select public.reopen_enrollment('e1000000-0000-4000-8000-000000000002') $$,
  'and can undo it right away'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select is_empty($$ select id from public.students where id::text like '5a000000-%' $$, 'a teacher in another unit sees no students');
select is(
  (select visible from public.find_students('maria souza')),
  false,
  'search across units tells there is a match without opening it'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is(
  (select cpf from public.student_private('5a000000-0000-4000-8000-000000000001')),
  '52998224725',
  'the unit admin reads the CPF'
);

reset role;
select ok(
  not has_function_privilege('anon', 'public.find_students(text)', 'execute')
  and not has_table_privilege('anon', 'public.students', 'select'),
  'anon has no access to students'
);

select * from finish();
rollback;
