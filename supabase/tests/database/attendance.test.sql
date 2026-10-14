begin;
select plan(20);

insert into auth.users (id, email, raw_user_meta_data) values
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}');

insert into public.staff_memberships (user_id, unit_id, role) values
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

insert into public.courses (id, name, workload_hours) values ('c0000000-0000-4000-8000-0000000000aa', 'Chamada teste', 60);
insert into public.classes (id, course_id, unit_id, name, starts_on, ends_on, schedule, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000aa', 'c0000000-0000-4000-8000-0000000000aa', '0a000000-0000-4000-8000-000000000001',
   'Chamada RA', private.today() - 60, private.today() + 60, '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]', 'numeric_10', 6, 75);
insert into public.class_teachers (class_id, unit_id, user_id) values
  ('c1000000-0000-4000-8000-0000000000aa', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444');
insert into public.class_sessions (id, class_id, held_on, starts_at, ends_at) values
  ('5e000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 28, '08:00', '10:00'),
  ('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 21, '08:00', '10:00'),
  ('5e000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 14, '08:00', '10:00'),
  ('5e000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 7, '08:00', '10:00'),
  ('5e000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-0000000000aa', private.today(), '08:00', '10:00'),
  ('5e000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-0000000000aa', private.today() + 7, '08:00', '10:00');
insert into public.students (id, full_name, birth_date, phone, registered_unit_id) values
  ('5a000000-0000-4000-8000-0000000000aa', 'Ana Alerta', '2000-01-01', '81999990000', '0a000000-0000-4000-8000-000000000001'),
  ('5a000000-0000-4000-8000-0000000000bb', 'Bruno Bem', '2000-01-01', null, '0a000000-0000-4000-8000-000000000001');
insert into public.enrollments (id, student_id, class_id, enrolled_on) values
  ('e1000000-0000-4000-8000-0000000000aa', '5a000000-0000-4000-8000-0000000000aa', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 60),
  ('e1000000-0000-4000-8000-0000000000bb', '5a000000-0000-4000-8000-0000000000bb', 'c1000000-0000-4000-8000-0000000000aa', private.today() - 15);

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select is(
  (select count(*)::int from public.session_roster('5e000000-0000-4000-8000-000000000002')),
  1,
  'the roster of a session lists only students enrolled on that day'
);
select lives_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000001',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000aa", "status": "present"}]', ' Variáveis ') $$,
  'the teacher takes attendance'
);
select is(
  (select topic from public.class_sessions where id = '5e000000-0000-4000-8000-000000000001'),
  'Variáveis',
  'the class diary keeps what was taught'
);
select isnt(
  (select attendance_taken_at from public.class_sessions where id = '5e000000-0000-4000-8000-000000000001'),
  null,
  'the session is marked as done'
);
select lives_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000002',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000aa", "status": "absent"}]') $$,
  'first absence'
);
select lives_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000003',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000aa", "status": "excused", "note": "Atestado"},
         {"enrollment_id": "e1000000-0000-4000-8000-0000000000bb", "status": "present"}]') $$,
  'an excused absence in between'
);
select lives_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000004',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000aa", "status": "absent"},
         {"enrollment_id": "e1000000-0000-4000-8000-0000000000bb", "status": "late"}]') $$,
  'second absence'
);
select is_empty(
  $$ select enrollment_id from public.absence_alerts() where class_id = 'c1000000-0000-4000-8000-0000000000aa' $$,
  'two absences do not raise an alert'
);
select lives_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000005',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000aa", "status": "absent"},
         {"enrollment_id": "e1000000-0000-4000-8000-0000000000bb", "status": "present"}]') $$,
  'third absence today'
);
select is(
  (select streak from public.absence_alerts() where class_id = 'c1000000-0000-4000-8000-0000000000aa'),
  3,
  'three absences in a row raise an alert, the excused one is skipped'
);
select is(
  (select array[present, late, absent, excused] from public.class_attendance('c1000000-0000-4000-8000-0000000000aa')
   where enrollment_id = 'e1000000-0000-4000-8000-0000000000aa'),
  array[1, 0, 3, 1],
  'attendance counts every kind of mark'
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
  $$ insert into public.case_notes (student_id, kind, happened_on, body)
     values ('5a000000-0000-4000-8000-0000000000aa', 'home_visit', private.today(), 'Visita') $$,
  '42501', null, 'home visits are recorded only by coordination'
);
select throws_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000006',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000aa", "status": "present"}]') $$,
  '22023', null, 'future sessions cannot be marked'
);
select throws_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000001',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000bb", "status": "present"}]') $$,
  '55000', null, 'a student cannot be marked before enrolling'
);
select throws_ok(
  $$ select public.cancel_session('5e000000-0000-4000-8000-000000000001', 'Chuva') $$,
  '55000', null, 'a session with attendance cannot be cancelled'
);
select lives_ok(
  $$ select public.cancel_session('5e000000-0000-4000-8000-000000000006', 'Feriado escolar') $$,
  'an empty future session can be cancelled'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select throws_ok(
  $$ select public.take_attendance('5e000000-0000-4000-8000-000000000004', '[]') $$,
  '42501', null, 'a teacher from another unit cannot take attendance'
);
select is_empty(
  $$ select session_id from public.attendance_records where class_id = 'c1000000-0000-4000-8000-0000000000aa' $$,
  'nor read it'
);

select * from finish();
rollback;
