begin;
select plan(17);

delete from public.staff_memberships;

insert into auth.users (id, email, raw_user_meta_data) values
  ('22222222-2222-4222-8222-222222222222', 'adm-ra@test.local', '{"full_name": "Rita"}'),
  ('33333333-3333-4333-8333-333333333333', 'adm-bv@test.local', '{"full_name": "Bia"}'),
  ('44444444-4444-4444-8444-444444444444', 'prof-ra@test.local', '{"full_name": "Paulo"}');
insert into public.staff_memberships (user_id, unit_id, role) values
  ('22222222-2222-4222-8222-222222222222', '0a000000-0000-4000-8000-000000000001', 'admin'),
  ('33333333-3333-4333-8333-333333333333', '0a000000-0000-4000-8000-000000000002', 'admin'),
  ('44444444-4444-4444-8444-444444444444', '0a000000-0000-4000-8000-000000000001', 'teacher');

insert into public.classes (id, unit_id, name, starts_on, ends_on, weekdays, workload_hours, grading_scheme, passing_score, min_attendance) values
  ('c1000000-0000-4000-8000-0000000000cc', '0a000000-0000-4000-8000-000000000001',
   'Turma inscrição', private.today(), private.today() + 60, '{2}', 40, 'numeric_10', 6, 75);
insert into public.enrollment_offers (id, class_id, unit_id) values
  ('0f000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-0000000000cc', '0a000000-0000-4000-8000-000000000001');

set local role anon;
select ok(
  exists (select 1 from public.open_offers() where id = '0f000000-0000-4000-8000-000000000001'),
  'anyone sees the open offers'
);
select throws_ok(
  $$ select public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Lia', '2000-01-01', '81988880000', false) $$,
  '22023', null, 'consent is required'
);
select throws_ok(
  $$ select public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Lia', (current_date - 3650), '81988880000', true) $$,
  '23514', null, 'a minor needs a guardian'
);
select matches(
  public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', ' Lia Melo ', '2000-01-01', '81988880000', true),
  '^[2-9A-HJ-NP-Z]{8}$',
  'an adult receives a protocol code'
);
select is(
  public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Lia Melo', '2000-01-01', '81988880000', true),
  public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Lia Melo', '2000-01-01', '81988880000', true),
  'sending twice returns the same protocol'
);
select lives_ok(
  $$ select public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Teo', '2000-02-02', '81977770000', true) $$,
  'a second person enters the queue'
);
select lives_ok(
  $$ select public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Teo', '2000-03-03', '81977770000', true) $$,
  'the same phone can send a second request'
);
select lives_ok(
  $$ select public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Teo', '2000-04-04', '81977770000', true) $$,
  'and a third'
);
select throws_ok(
  $$ select public.submit_enrollment_request('0f000000-0000-4000-8000-000000000001', 'Teo', '2000-05-05', '81977770000', true) $$,
  '54000', null, 'a fourth request from the same phone in one day is refused'
);
select throws_ok(
  $$ select id from public.enrollment_requests $$,
  '42501', null, 'anon cannot read requests'
);

reset role;
update public.enrollment_requests r set created_at = r.created_at + make_interval(secs => s.n)
from (
  select id, row_number() over (order by birth_date) as n
  from public.enrollment_requests where offer_id = '0f000000-0000-4000-8000-000000000001'
) s
where r.id = s.id;
set local role authenticated;
set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select is_empty($$ select id from public.enrollment_requests $$, 'a teacher does not see requests');

set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';
select is_empty($$ select id from public.request_list() where offer_id = '0f000000-0000-4000-8000-000000000001' $$, 'another unit does not see the queue');

set local request.jwt.claims = '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}';
select is(
  (select array_agg(queue_position order by created_at) from public.request_list() where offer_id = '0f000000-0000-4000-8000-000000000001'),
  array[1, 2, 3, 4],
  'the queue follows the order of arrival'
);
select lives_ok(
  $$ select public.convert_enrollment_request(
       (select id from public.enrollment_requests where phone = '81988880000'),
       'c1000000-0000-4000-8000-0000000000cc', 'e1000000-0000-4000-8000-0000000000cc',
       p_new_student_id => '5a000000-0000-4000-8000-0000000000cc') $$,
  'the unit admin turns the request into an enrollment'
);
select is(
  (select full_name || '|' || status from public.students s join public.enrollments e on e.student_id = s.id
   where s.id = '5a000000-0000-4000-8000-0000000000cc'),
  'Lia Melo|active',
  'the student is created and enrolled'
);
select is(
  (select status from public.enrollment_requests where phone = '81988880000'),
  'converted'::public.request_status,
  'the request is marked as converted'
);
select is_empty(
  $$ update public.enrollment_requests set status = 'pending' where phone = '81988880000' returning id $$,
  'a converted request cannot be reopened'
);

select * from finish();
rollback;
