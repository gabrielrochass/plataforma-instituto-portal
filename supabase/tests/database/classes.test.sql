begin;
select plan(13);

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

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select lives_ok(
  $$ select public.create_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => ' Python Manhã ',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2,4}',
       p_workload_hours => 60::smallint,
       p_capacity => 20::smallint,
       p_teacher_ids => array['55555555-5555-4555-8555-555555555555']::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  'a teacher creates a class in their unit'
);
select lives_ok(
  $$ select public.create_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Outro nome',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2}',
       p_workload_hours => 60::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  'creating the same class again is harmless'
);
select is(
  (select name || '|' || weekdays::text || '|' || workload_hours from public.classes where id = 'c1000000-0000-4000-8000-000000000001'),
  'Python Manhã|{2,4}|60',
  'the class keeps the first save, trimmed'
);
select is(
  (select array_agg(user_id order by user_id) from public.class_teachers where class_id = 'c1000000-0000-4000-8000-000000000001'),
  array['44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555']::uuid[],
  'the teacher who creates the class teaches it'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_unit_id => '0a000000-0000-4000-8000-000000000002',
       p_name => 'Outra',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2}',
       p_workload_hours => 40::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  '42501', null, 'a teacher cannot create a class in another unit'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Fora',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2}',
       p_workload_hours => 40::smallint,
       p_teacher_ids => array['66666666-6666-4666-8666-666666666666']::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  '23514', null, 'a teacher from another unit cannot be assigned'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Dia errado',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{8}',
       p_workload_hours => 40::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  '23514', null, 'weekdays go from 1 to 7'
);
select throws_ok(
  $$ select public.create_class(
       p_id => gen_random_uuid(),
       p_unit_id => '0a000000-0000-4000-8000-000000000001',
       p_name => 'Nota errada',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2}',
       p_workload_hours => 40::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 60,
       p_min_attendance => 75::smallint
     ) $$,
  '23514', null, 'the passing score must fit the scale'
);
select throws_ok(
  $$ update public.classes set unit_id = '0a000000-0000-4000-8000-000000000002' $$,
  '42501', null, 'classes are never moved directly'
);

reset role;
insert into public.class_sessions (class_id, held_on) values ('c1000000-0000-4000-8000-000000000001', '2026-10-06');
set local role authenticated;
select throws_ok(
  $$ select public.update_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_name => 'Python Manhã',
       p_starts_on => '2026-10-10',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2}',
       p_workload_hours => 60::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  '23514', null, 'the period cannot leave attendance out'
);
select lives_ok(
  $$ select public.update_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_name => 'Python Tarde',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-20',
       p_weekdays => '{3}',
       p_workload_hours => 80::smallint,
       p_teacher_ids => array['55555555-5555-4555-8555-555555555555']::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  'a teacher edits the class'
);

set local request.jwt.claims = '{"sub": "66666666-6666-4666-8666-666666666666", "role": "authenticated"}';
select is_empty($$ select id from public.classes where id = 'c1000000-0000-4000-8000-000000000001' $$, 'a teacher in another unit does not see the class');
select throws_ok(
  $$ select public.update_class(
       p_id => 'c1000000-0000-4000-8000-000000000001',
       p_name => 'Tomada',
       p_starts_on => '2026-10-01',
       p_ends_on => '2026-12-18',
       p_weekdays => '{2}',
       p_workload_hours => 60::smallint,
       p_teacher_ids => '{}'::uuid[],
       p_grading_scheme => 'numeric_10',
       p_passing_score => 6,
       p_min_attendance => 75::smallint
     ) $$,
  '42501', null, 'nor change it'
);

select * from finish();
rollback;
