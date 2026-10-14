begin;
select plan(20);

delete from public.staff_memberships;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'geral@test.local', '{"full_name": "Gera"}'),
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('33333333-3333-4333-8333-333333333333', 'adm-bv@test.local', '{"full_name": "Bia"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}');
update public.profiles set is_admin_geral = (id = '11111111-1111-4111-8111-111111111111');
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('33333333-3333-4333-8333-333333333333', '0a000000-0000-4000-8000-000000000002', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher');

insert into public.courses (id, name, workload_hours) values ('c0000000-0000-4000-8000-0000000000ee', 'Social teste', 40);
insert into public.classes (id, course_id, unit_id, name, starts_on, ends_on, schedule, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000e1', 'c0000000-0000-4000-8000-0000000000ee', '0a000000-0000-4000-8000-000000000001',
   'Social RA', private.today() - 30, private.today() + 30, '[{"weekday": 2, "starts_at": "08:00", "ends_at": "10:00"}]', 'numeric_10', 6, 75);
insert into public.class_teachers (class_id, unit_id, user_id) values
  ('c1000000-0000-4000-8000-0000000000e1', '0a000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444');
insert into public.students (id, full_name, birth_date, phone, cpf, registered_unit_id) values
  ('5a000000-0000-4000-8000-0000000000e1', 'Eva Social', '2000-05-10', '81999995555', '52998224725', '0a000000-0000-4000-8000-000000000001');
insert into public.guardians (student_id, full_name, relationship, phone) values
  ('5a000000-0000-4000-8000-0000000000e1', 'Mãe da Eva', 'mother', '81988885555');
insert into public.enrollments (id, student_id, class_id, enrolled_on) values
  ('e1000000-0000-4000-8000-0000000000e1', '5a000000-0000-4000-8000-0000000000e1', 'c1000000-0000-4000-8000-0000000000e1', private.today() - 30);

set local role authenticated;

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select public.save_social_profile('5a000000-0000-4000-8000-0000000000e1', '{"assessed_on": "2026-01-10", "moment": "intake"}') $$,
  '42501', null, 'a teacher cannot write the social profile'
);
select throws_ok(
  $$ select * from public.student_social_profiles('5a000000-0000-4000-8000-0000000000e1') $$,
  '42501', null, 'nor read it'
);
select throws_ok(
  $$ select id from public.social_profiles $$,
  '42501', null, 'the table itself stays closed'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ select public.save_social_profile('5a000000-0000-4000-8000-0000000000e1',
       '{"assessed_on": "2026-01-10", "moment": "intake", "household_size": 4, "household_income_cents": 150000, "benefits": ["bolsa_familia"], "gender": "woman"}') $$,
  'coordination fills the first social profile'
);
select is(
  (select last_assessed_on from public.students where id = '5a000000-0000-4000-8000-0000000000e1'),
  '2026-01-10'::date,
  'the student is no longer pending'
);
select throws_ok(
  $$ select public.save_social_profile('5a000000-0000-4000-8000-0000000000e1',
       '{"assessed_on": "2026-06-10", "moment": "follow_up", "race_color": "black"}') $$,
  '23514', null, 'race needs a sensitive data consent'
);
select lives_ok(
  $$ select public.save_social_profile('5a000000-0000-4000-8000-0000000000e1',
       '{"assessed_on": "2026-06-10", "moment": "follow_up", "race_color": "undeclared", "household_size": 4, "household_income_cents": 250000}') $$,
  '"prefer not to say" needs no consent'
);
select lives_ok(
  $$ insert into public.consents (student_id, kind, signed_on) values ('5a000000-0000-4000-8000-0000000000e1', 'sensitive_data', private.today()) $$,
  'coordination records the sensitive data consent'
);
select lives_ok(
  $$ select public.save_social_profile('5a000000-0000-4000-8000-0000000000e1',
       '{"assessed_on": "2026-06-10", "moment": "follow_up", "race_color": "black", "health_notes": "Asma", "household_size": 4, "household_income_cents": 250000}') $$,
  'saving the same day again corrects that version'
);
select is(
  (select array_agg(household_income_cents order by assessed_on) from public.student_social_profiles('5a000000-0000-4000-8000-0000000000e1')),
  array[150000, 250000]::bigint[],
  'both versions are kept for comparison'
);
select ok(
  exists (select 1 from public.student_access_log('5a000000-0000-4000-8000-0000000000e1') where action = 'read' and table_name = 'social_profiles'),
  'reading the profile is logged'
);
select ok(
  exists (select 1 from public.student_access_log('5a000000-0000-4000-8000-0000000000e1')
          where action = 'update' and table_name = 'social_profiles' and columns @> array['race_color']),
  'changes log the column names, never the values'
);
select lives_ok(
  $$ update public.consents set revoked_on = private.today()
     where student_id = '5a000000-0000-4000-8000-0000000000e1' and kind = 'sensitive_data' $$,
  'the consent is revoked'
);
select is(
  (select count(*)::int from public.student_social_profiles('5a000000-0000-4000-8000-0000000000e1') where race_color is not null and race_color <> 'undeclared' or health_notes is not null),
  0,
  'revoking the consent erases the sensitive fields'
);
select lives_ok(
  $$ select public.add_alumni_outcome('5a000000-0000-4000-8000-0000000000e1', 'employed', private.today(), true, true, 'Padaria') $$,
  'coordination records an alumni outcome'
);

set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.student_social_profiles('5a000000-0000-4000-8000-0000000000e1') $$,
  '42501', null, 'another unit cannot read the profile'
);
select throws_ok(
  $$ select public.anonymize_student('5a000000-0000-4000-8000-0000000000e1') $$,
  '42501', null, 'only admin geral anonymizes'
);

set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select ok(
  (public.export_student_data('5a000000-0000-4000-8000-0000000000e1') -> 'aluno' ->> 'cpf') = '52998224725',
  'the export carries every personal datum'
);
select lives_ok(
  $$ select public.anonymize_student('5a000000-0000-4000-8000-0000000000e1') $$,
  'admin geral anonymizes the student'
);

reset role;
select is(
  (select full_name || '|' || coalesce(cpf, '-') || '|' || birth_date::text
     || '|' || (select count(*) from public.guardians where student_id = s.id)
     || '|' || (select count(*) from public.social_profiles where student_id = s.id)
     || '|' || (select count(*) from public.enrollments where student_id = s.id)
   from public.students s where s.id = '5a000000-0000-4000-8000-0000000000e1'),
  'Pessoa anonimizada|-|2000-01-01|0|0|1',
  'personal data is gone while the enrollment stays for the numbers'
);

select * from finish();
rollback;
