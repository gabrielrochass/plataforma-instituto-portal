begin;
select plan(17);

insert into auth.users (id, email, raw_user_meta_data) values
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}'),
  ('55555555-5555-4555-8555-555555555555', 'prof-ra2@test.local', '{"full_name": "Ana"}'),
  ('66666666-6666-4666-8666-666666666666', 'prof-bv@test.local', '{"full_name": "Beto"}');

insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('55555555-5555-4555-8555-555555555555', '0a000000-0000-4000-8000-000000000001', 'teacher'),
  ('66666666-6666-4666-8666-666666666666', '0a000000-0000-4000-8000-000000000002', 'teacher');

set local role authenticated;

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ insert into public.courses (id, name, workload_hours) values ('c0000000-0000-4000-8000-000000000001', 'Programação', 60) $$,
  'a unit admin adds a course'
);
select throws_ok(
  $$ insert into public.courses (name, workload_hours, grading_scheme, passing_score) values ('Errado', 10, 'numeric_10', 60) $$,
  '23514', null, 'the passing score must fit the scale'
);
select throws_ok(
  $$ insert into public.courses (name, workload_hours, grading_scheme, passing_score, concept_labels, concept_passing)
     values ('Conceitos', 10, 'concept', null, array['Bom', 'bom'], 1) $$,
  '23514', null, 'concept labels must be unique'
);

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.courses (name, workload_hours) values ('Inglês', 40) $$,
  '42501', null, 'a teacher cannot add courses'
);
select lives_ok(
  $$ select public.create_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_course_id => 'c0000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => ' Python Manhã ',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_schedule => '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]',
       p_capacity => 20::smallint,
       p_teacher_ids => array['55555555-5555-4555-8555-555555555555']::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_sessions => '[{"held_on": "2026-10-06", "starts_at": "08:00", "ends_at": "10:00"},
         {"held_on": "2026-10-13", "starts_at": "08:00", "ends_at": "10:00"}]'
     ) $$,
  'a teacher creates a class in their unit'
);
select lives_ok(
  $$ select public.create_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_course_id => 'c0000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Python Manhã',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_schedule => '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]',
       p_capacity => 20::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_sessions => '[{"held_on": "2026-10-20", "starts_at": "08:00", "ends_at": "10:00"}]'
     ) $$,
  'creating the same class again is harmless'
);
select is(
  (select name from public.classes where id = 'c1000000-0000-4000-8000-000000000001'),
  'Python Manhã',
  'the class name is trimmed'
);
select is(
  (select count(*)::int from public.class_sessions where class_id = 'c1000000-0000-4000-8000-000000000001'),
  2,
  'the chosen sessions are saved once'
);
select is(
  (select array_agg(user_id order by user_id) from public.class_teachers where class_id = 'c1000000-0000-4000-8000-000000000001'),
  array['44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555']::uuid[],
  'the teacher who creates the class teaches it'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_course_id => 'c0000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000002',
       p_name => 'Outra',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_schedule => '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]',
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_sessions => '[]'
     ) $$,
  '42501', null, 'a teacher cannot create a class in another unit'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_course_id => 'c0000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Fora',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_schedule => '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]',
       p_teacher_ids => array['66666666-6666-4666-8666-666666666666']::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_sessions => '[]'
     ) $$,
  '23514', null, 'a teacher from another unit cannot be assigned'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_course_id => 'c0000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Horário ruim',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_schedule => '[{"weekday": 2, "starts_at": "10:00", "ends_at": "08:00"}]',
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_sessions => '[]'
     ) $$,
  '23514', null, 'a schedule must end after it starts'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_course_id => 'c0000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Aula fora',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-10-31',
       p_schedule => '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]',
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_sessions => '[{"held_on": "2026-11-03", "starts_at": "08:00", "ends_at": "10:00"}]'
     ) $$,
  '22023', null, 'sessions must fall inside the class period'
);
select throws_ok(
  $$ update public.classes set unit_id = '0a000000-0000-4000-8000-000000000002' $$,
  '42501', null, 'classes are never moved directly'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select is_empty($$ select id from public.classes where id = 'c1000000-0000-4000-8000-000000000001' $$, 'a teacher in another unit does not see the class');
select is_empty($$ select id from public.class_sessions where class_id = 'c1000000-0000-4000-8000-000000000001' $$, 'nor its sessions');
select throws_ok(
  $$ select public.update_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_name => 'Tomada',
       p_ends_on => '2026-12-18',
       p_schedule => '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]',
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint,
       p_remove_session_ids => '{}'::uuid[],
       p_add_sessions => '[]'
     ) $$,
  '42501', null, 'nor change it'
);

select * from finish();
rollback;
