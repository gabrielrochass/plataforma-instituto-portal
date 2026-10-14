begin;
select plan(22);

delete from public.staff_memberships;

insert into auth.users (id, email, raw_user_meta_data) values
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}');
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

insert into public.courses (id, name, workload_hours) values ('c0000000-0000-4000-8000-0000000000dd', 'Notas teste', 40);
insert into public.classes (id, course_id, unit_id, name, starts_on, ends_on, schedule, grading_scheme, passing_score, concept_labels, concept_passing, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000d1', 'c0000000-0000-4000-8000-0000000000dd', '0a000000-0000-4000-8000-000000000001',
   'Notas numéricas', private.today() - 30, private.today() + 30, '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]', 'numeric_10', 6, null, null, 75),
  ('c1000000-0000-4000-8000-0000000000d2', 'c0000000-0000-4000-8000-0000000000dd', '0a000000-0000-4000-8000-000000000001',
   'Notas conceito', private.today() - 30, private.today() + 30, '[{"weekday": 3, "starts_at": "08:00", "ends_at": "10:00"}]', 'concept', null, array['Ótimo', 'Bom', 'Regular', 'Insuficiente'], 3, 75),
  ('c1000000-0000-4000-8000-0000000000d3', 'c0000000-0000-4000-8000-0000000000dd', '0a000000-0000-4000-8000-000000000001',
   'Só presença', private.today() - 30, private.today() + 30, '[{"weekday": 4, "starts_at": "08:00", "ends_at": "10:00"}]', 'attendance_only', null, null, null, 75);
insert into public.class_teachers (class_id, unit_id, user_id) values
  ('c1000000-0000-4000-8000-0000000000d1', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444'),
  ('c1000000-0000-4000-8000-0000000000d2', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444');
insert into public.class_sessions (id, class_id, held_on, starts_at, ends_at) values
  ('5e000000-0000-4000-8000-0000000000d1', 'c1000000-0000-4000-8000-0000000000d1', private.today() - 14, '08:00', '10:00'),
  ('5e000000-0000-4000-8000-0000000000d2', 'c1000000-0000-4000-8000-0000000000d1', private.today() - 7, '08:00', '10:00');
insert into public.students (id, full_name, birth_date, phone, registered_unit_id) values
  ('5a000000-0000-4000-8000-0000000000d1', 'Ana Nota', '2000-01-01', '81999990001', '0a000000-0000-4000-8000-000000000001'),
  ('5a000000-0000-4000-8000-0000000000d2', 'Bruno Nota', '2000-01-01', '81999990002', '0a000000-0000-4000-8000-000000000001');
insert into public.enrollments (id, student_id, class_id, enrolled_on) values
  ('e1000000-0000-4000-8000-0000000000d1', '5a000000-0000-4000-8000-0000000000d1', 'c1000000-0000-4000-8000-0000000000d1', private.today() - 30),
  ('e1000000-0000-4000-8000-0000000000d2', '5a000000-0000-4000-8000-0000000000d2', 'c1000000-0000-4000-8000-0000000000d1', private.today() - 10),
  ('e2000000-0000-4000-8000-0000000000d1', '5a000000-0000-4000-8000-0000000000d1', 'c1000000-0000-4000-8000-0000000000d2', private.today() - 30);
insert into public.attendance_records (session_id, enrollment_id, class_id, status) values
  ('5e000000-0000-4000-8000-0000000000d1', 'e1000000-0000-4000-8000-0000000000d1', 'c1000000-0000-4000-8000-0000000000d1', 'present'),
  ('5e000000-0000-4000-8000-0000000000d2', 'e1000000-0000-4000-8000-0000000000d1', 'c1000000-0000-4000-8000-0000000000d1', 'late'),
  ('5e000000-0000-4000-8000-0000000000d2', 'e1000000-0000-4000-8000-0000000000d2', 'c1000000-0000-4000-8000-0000000000d1', 'absent');

set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.assessments (id, class_id, title, held_on, weight) values
       ('a5000000-0000-4000-8000-0000000000d1', 'c1000000-0000-4000-8000-0000000000d1', 'Prova 1', private.today() - 20, 1),
       ('a5000000-0000-4000-8000-0000000000d2', 'c1000000-0000-4000-8000-0000000000d1', 'Projeto', private.today() - 5, 2) $$,
  'the teacher creates weighted assessments'
);
select throws_ok(
  $$ insert into public.assessments (class_id, title) values ('c1000000-0000-4000-8000-0000000000d3', 'Prova') $$,
  '23514', null, 'classes graded only by attendance have no assessments'
);
select lives_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d1',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000d1", "score": 4}]') $$,
  'grades are saved'
);
select lives_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d2',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000d1", "score": 8.5},
         {"enrollment_id": "e1000000-0000-4000-8000-0000000000d2", "missed": true}]') $$,
  'a missed assessment is recorded apart from a zero'
);
select throws_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d1',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000d1", "score": 11}]') $$,
  '23514', null, 'a score above the scale is refused'
);
select is(
  (select final_score from public.class_results('c1000000-0000-4000-8000-0000000000d1') where student_name = 'Ana Nota'),
  7.00,
  'the average is weighted: (4 x 1 + 8.5 x 2) / 3 = 7'
);
select is(
  (select final_score from public.class_results('c1000000-0000-4000-8000-0000000000d1') where student_name = 'Bruno Nota'),
  0.00,
  'assessments before the student arrived do not count and a missed one counts as zero'
);
select is(
  (select attendance_pct from public.class_results('c1000000-0000-4000-8000-0000000000d1') where student_name = 'Ana Nota'),
  100.00,
  'late counts as present'
);
select is(
  (select array[passed_score, passed_attendance] from public.class_results('c1000000-0000-4000-8000-0000000000d1') where student_name = 'Bruno Nota'),
  array[false, false],
  'the result tells score and attendance apart'
);

select lives_ok(
  $$ insert into public.assessments (id, class_id, title, weight) values
       ('a5000000-0000-4000-8000-0000000000d3', 'c1000000-0000-4000-8000-0000000000d2', 'Trabalho', 1),
       ('a5000000-0000-4000-8000-0000000000d4', 'c1000000-0000-4000-8000-0000000000d2', 'Apresentação', 1) $$,
  'concept classes have assessments too'
);
select throws_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d3',
       '[{"enrollment_id": "e2000000-0000-4000-8000-0000000000d1", "concept": "Excelente"}]') $$,
  '23514', null, 'only the class concepts are accepted'
);
select lives_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d3',
       '[{"enrollment_id": "e2000000-0000-4000-8000-0000000000d1", "concept": "Ótimo"}]') $$,
  'a concept is saved'
);
select is(
  (select final_concept from public.class_results('c1000000-0000-4000-8000-0000000000d2')),
  'Regular',
  'a missing concept counts as the worst: Ótimo and Insuficiente round down to Regular'
);
select lives_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d4',
       '[{"enrollment_id": "e2000000-0000-4000-8000-0000000000d1", "concept": "Ótimo"}]') $$,
  'the second concept is saved'
);
select is(
  (select final_concept from public.class_results('c1000000-0000-4000-8000-0000000000d2')),
  'Ótimo',
  'two Ótimo give Ótimo'
);
select throws_ok(
  $$ update public.classes set grading_scheme = 'numeric_10', passing_score = 6, concept_labels = null, concept_passing = null
     where id = 'c1000000-0000-4000-8000-0000000000d2' $$,
  '42501', null, 'the scheme cannot be changed directly'
);

select lives_ok(
  $$ select public.close_class('c1000000-0000-4000-8000-0000000000d1',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000d2", "passed": true, "reason": "Recuperação"}]') $$,
  'the teacher closes the class with one decision overridden'
);
select is(
  (select array_agg(status::text || ':' || coalesce(exit_note, '') order by student_id)
   from public.enrollments where class_id = 'c1000000-0000-4000-8000-0000000000d1'),
  array['completed:', 'completed:Recuperação'],
  'results are frozen with the reason for the override'
);
select throws_ok(
  $$ select public.save_grades('a5000000-0000-4000-8000-0000000000d1',
       '[{"enrollment_id": "e1000000-0000-4000-8000-0000000000d1", "score": 10}]') $$,
  '55000', null, 'a closed class rejects new grades'
);
select throws_ok(
  $$ select public.reopen_class('c1000000-0000-4000-8000-0000000000d1') $$,
  '42501', null, 'only coordination reopens a class'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ select public.reopen_class('c1000000-0000-4000-8000-0000000000d1') $$,
  'coordination reopens the class'
);
select is(
  (select count(*)::int from public.enrollments where class_id = 'c1000000-0000-4000-8000-0000000000d1' and status = 'active'),
  2,
  'reopening brings the students back'
);

select * from finish();
rollback;
