begin;
select plan(14);

delete from public.staff_memberships;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'geral@test.local', '{"full_name": "Gera"}'),
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('33333333-3333-4333-8333-333333333333', 'adm-bv@test.local', '{"full_name": "Bia"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}');
update public.profiles set is_admin_geral = (id = '11111111-1111-4111-8111-111111111111');
insert into public.units (id, code, name) values ('0a000000-0000-4000-8000-0000000000f9', 'IMP', 'Unidade impacto');
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-0000000000f9', 'admin'),
  ('33333333-3333-4333-8333-333333333333', '0a000000-0000-4000-8000-000000000002', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-0000000000f9', 'teacher');

insert into public.classes (id, unit_id, name, starts_on, ends_on, weekdays, workload_hours, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000f1', '0a000000-0000-4000-8000-0000000000f9',
   'Impacto A', private.today() - 60, private.today() + 30, '{2}', 40, 'numeric_10', 6, 75),
  ('c1000000-0000-4000-8000-0000000000f2', '0a000000-0000-4000-8000-0000000000f9',
   'Impacto B', private.today() - 60, private.today() + 30, '{3}', 40, 'numeric_10', 6, 75);
insert into public.class_sessions (id, class_id, held_on) values
  ('5e000000-0000-4000-8000-0000000000f1', 'c1000000-0000-4000-8000-0000000000f1', private.today() - 20);
insert into public.students (id, full_name, birth_date, phone, registered_unit_id)
select ('5a000000-0000-4000-8000-0000000000f' || n)::uuid, 'Pessoa ' || n, '2000-01-01', '8199999000' || n,
  '0a000000-0000-4000-8000-0000000000f9'
from generate_series(1, 6) n;
insert into public.enrollments (id, student_id, class_id, enrolled_on)
select ('e1000000-0000-4000-8000-0000000000f' || n)::uuid, ('5a000000-0000-4000-8000-0000000000f' || n)::uuid,
  'c1000000-0000-4000-8000-0000000000f1', private.today() - 50
from generate_series(1, 6) n;
insert into public.attendance_records (session_id, enrollment_id, class_id, status) values
  ('5e000000-0000-4000-8000-0000000000f1', 'e1000000-0000-4000-8000-0000000000f1', 'c1000000-0000-4000-8000-0000000000f1', 'present'),
  ('5e000000-0000-4000-8000-0000000000f1', 'e1000000-0000-4000-8000-0000000000f2', 'c1000000-0000-4000-8000-0000000000f1', 'present'),
  ('5e000000-0000-4000-8000-0000000000f1', 'e1000000-0000-4000-8000-0000000000f3', 'c1000000-0000-4000-8000-0000000000f1', 'absent'),
  ('5e000000-0000-4000-8000-0000000000f1', 'e1000000-0000-4000-8000-0000000000f4', 'c1000000-0000-4000-8000-0000000000f1', 'absent');
insert into public.enrollments (id, student_id, class_id, enrolled_on) values
  ('e2000000-0000-4000-8000-0000000000f6', '5a000000-0000-4000-8000-0000000000f6', 'c1000000-0000-4000-8000-0000000000f2', private.today() - 10);
update public.enrollments set status = 'transferred', ended_on = private.today() - 10,
  transferred_to_id = 'e2000000-0000-4000-8000-0000000000f6'
where id = 'e1000000-0000-4000-8000-0000000000f6';
update public.enrollments set status = 'completed', ended_on = private.today() - 5
where id in ('e1000000-0000-4000-8000-0000000000f1', 'e1000000-0000-4000-8000-0000000000f2', 'e1000000-0000-4000-8000-0000000000f3');
update public.enrollments set status = 'dropped_out', ended_on = private.today() - 15, exit_reason = 'work'
where id = 'e1000000-0000-4000-8000-0000000000f4';
insert into public.social_profiles (student_id, assessed_on, moment, gender)
select ('5a000000-0000-4000-8000-0000000000f' || n)::uuid, private.today() - 50, 'intake',
  (case when n = 6 then 'man' else 'woman' end)::public.gender_identity
from generate_series(1, 6) n;
insert into public.alumni_outcomes (student_id, kind, observed_on, formal_job) values
  ('5a000000-0000-4000-8000-0000000000f1', 'employed', private.today(), true);

select is(
  private.suppress('{"a": 10, "b": 7, "c": 2, "d": 0}'),
  '{"a": 10, "b": null, "c": null, "d": 0}'::jsonb,
  'small cells are hidden and so is the next smallest, so totals do not reveal them'
);

set local role authenticated;

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select public.impact_report(private.today() - 60, private.today() + 1) $$,
  '42501', null, 'teachers do not see impact'
);

set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';
select throws_ok(
  $$ select public.impact_report(private.today() - 60, private.today() + 1, '0a000000-0000-4000-8000-0000000000f9') $$,
  '42501', null, 'a unit admin cannot ask for another unit'
);
select ok(
  not exists (
    select 1 from jsonb_array_elements(public.impact_report(private.today() - 60, private.today() + 1) -> 'by_class') item
    where item ->> 'id' in ('c1000000-0000-4000-8000-0000000000f1', 'c1000000-0000-4000-8000-0000000000f2')
  ),
  'and sees only their own units'
);

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select throws_ok(
  $$ select public.impact_report(private.today(), private.today()) $$,
  '22023', null, 'the period must not be empty'
);

create temporary table report on commit drop as
select public.impact_report(private.today() - 60, private.today() + 1, '0a000000-0000-4000-8000-0000000000f9') as r;

select is(
  (select concat_ws('|', r->>'served', r->>'enrollments', r->>'transfers', r->>'completed', r->>'failed', r->>'dropped_out') from report),
  '6|6|1|3|0|1',
  'a transfer counts once as a person and once as an enrollment'
);
select is(
  (select concat_ws('|', r->>'attended', r->>'recorded', r->>'hours') from report),
  '2|4|120',
  'attendance and certified hours follow the single formula'
);
select is(
  (select r->'gender' from report),
  '{"man": null, "woman": null}'::jsonb,
  'one man among six would be identifiable, so both cells are hidden'
);
select is(
  (select r->'age' from report),
  '{"25_29": 6}'::jsonb,
  'ages are grouped'
);
select is(
  (select concat_ws('|', r->>'alumni', r->>'profiled') from report),
  '3|6',
  'alumni and profiled people are counted'
);
select is(
  (select r->'exit_reasons' from report),
  '{"work": null}'::jsonb,
  'a single dropout reason is hidden'
);
select is(
  (select jsonb_array_length(r->'monthly') > 0 and (r->'by_class'->0->>'served')::int = 6 from report),
  true,
  'monthly series and per class rows are returned'
);

set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';
select lives_ok(
  $$ select public.anonymize_student('5a000000-0000-4000-8000-0000000000f5') $$,
  'a person is anonymized'
);
select is(
  (public.impact_report(private.today() - 60, private.today() + 1, '0a000000-0000-4000-8000-0000000000f9') ->> 'served')::int,
  6,
  'anonymization keeps the impact numbers'
);

select * from finish();
rollback;
