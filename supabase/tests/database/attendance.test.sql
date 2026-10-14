begin;
select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}');

insert into public.staff_memberships (user_id, unit_id, role) values
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

insert into public.classes (id, unit_id, name, starts_on, ends_on, weekdays, workload_hours, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000aa', '0a000000-0000-4000-8000-000000000001',
   'Chamada RA', private.today() - 60, private.today() + 60, '{2}', 40, 'numeric_10', 6, 75);
insert into public.class_teachers (class_id, unit_id, user_id) values
  ('c1000000-0000-4000-8000-0000000000aa', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444');
insert into public.students (id, full_name, birth_date, phone, registered_unit_id) values
  ('5a000000-0000-4000-8000-0000000000aa', 'Ana Alerta', '2000-01-01', '81999990000', '0a000000-0000-4000-8000-000000000001'),
  ('5a000000-0000-4000-8000-0000000000bb', 'Bruno Bem', '2000-01-01', null, '0a000000-0000-4000-8000-000000000001');
insert into public.enrollments (id, student_id, class_id, enrolled_on) values
  ('e1000000-0000-4000-8000-0000000000aa', '5a000000-0000-4000-8000-0000000000aa', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 60),
  ('e1000000-0000-4000-8000-0000000000bb', '5a000000-0000-4000-8000-0000000000bb', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 15);

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select is(
  (select count(*)::int from public.attendance_roster('c1000000-0000-4000-8000-0000000000aa', private.today() - 21)),
  1,
  'the roster of a day lists only students enrolled on that day'
);
select lives_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today() - 28,
       array['e1000000-0000-4000-8000-0000000000aa']::uuid[], ' Variáveis ') $$,
  'the teacher takes attendance for a day'
);
select is(
  (select note from public.class_sessions where class_id = 'c1000000-0000-4000-8000-0000000000aa' and held_on = private.today() - 28),
  'Variáveis',
  'the note is kept'
);
select lives_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today() - 28,
       array['e1000000-0000-4000-8000-0000000000aa']::uuid[]) $$,
  'saving the same day again is harmless'
);
select is(
  (select count(*)::int from public.class_sessions where class_id = 'c1000000-0000-4000-8000-0000000000aa'),
  1,
  'one record per day'
);
select lives_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today() - 21, '{}') $$,
  'first absence'
);
select lives_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today() - 14,
       array['e1000000-0000-4000-8000-0000000000bb']::uuid[]) $$,
  'second absence, the unchecked student is absent'
);
select is_empty(
  $$ select enrollment_id from public.absence_alerts() where class_id = 'c1000000-0000-4000-8000-0000000000aa' $$,
  'two absences do not raise an alert'
);
select lives_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today(),
       array['e1000000-0000-4000-8000-0000000000bb']::uuid[]) $$,
  'third absence today'
);
select is(
  (select streak from public.absence_alerts() where class_id = 'c1000000-0000-4000-8000-0000000000aa'),
  3,
  'three absences in a row raise an alert'
);
select is(
  (select array[present, absent] from public.class_attendance('c1000000-0000-4000-8000-0000000000aa')
   where enrollment_id = 'e1000000-0000-4000-8000-0000000000bb'),
  array[2, 0],
  'attendance counts presences and absences'
);
select lives_ok(
  $$ insert into public.case_notes (student_id, kind, happened_on, body)
     values ('5a000000-0000-4000-8000-0000000000aa', 'family_contact', private.today(), 'Liguei para a família') $$,
  'the teacher records a contact with the family'
);
select is_empty(
  $$ select enrollment_id from public.absence_alerts() where class_id = 'c1000000-0000-4000-8000-0000000000aa' $$,
  'a contact clears the alert'
);
select throws_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today() + 1, '{}') $$,
  '22023', null, 'future days cannot be marked'
);
select lives_ok(
  $$ select public.delete_attendance((select id from public.class_sessions where class_id = 'c1000000-0000-4000-8000-0000000000aa' and held_on = private.today())) $$,
  'a day of attendance can be deleted'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select throws_ok(
  $$ select public.take_attendance('c1000000-0000-4000-8000-0000000000aa', private.today(), '{}') $$,
  '42501', null, 'a teacher from another unit cannot take attendance'
);

select * from finish();
rollback;
