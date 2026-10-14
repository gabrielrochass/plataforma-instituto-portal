create function private.suppress(p_counts jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  hidden text[];
  smallest text;
begin
  select coalesce(array_agg(key), '{}') into hidden
  from jsonb_each(p_counts) where value::integer between 1 and 4;
  if cardinality(hidden) = 1 then
    select key into smallest from jsonb_each(p_counts)
    where value::integer > 0 and key <> hidden[1]
    order by value::integer, key
    limit 1;
    if smallest is not null then
      hidden := hidden || smallest;
    end if;
  end if;
  return (
    select coalesce(jsonb_object_agg(key, case when key = any(hidden) then 'null'::jsonb else value end), '{}')
    from jsonb_each(p_counts)
  );
end;
$$;

create function private.count_by(p_keys text[])
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select private.suppress(coalesce(jsonb_object_agg(key, n), '{}'))
  from (select key, count(*) as n from unnest(p_keys) as key group by key) counts
$$;

create function public.impact_report(
  p_from date,
  p_to date,
  p_unit_id uuid default null,
  p_class_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select from private.admin_unit_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_unit_id is not null and p_unit_id not in (select private.admin_unit_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > 3700 then
    raise exception 'invalid period' using errcode = '22023';
  end if;

  return (
    with scope as (
      select c.id, c.name, c.unit_id, c.workload_hours
      from public.classes c
      where c.status <> 'cancelled'
        and c.unit_id in (select private.admin_unit_ids())
        and (p_unit_id is null or c.unit_id = p_unit_id)
        and (p_class_id is null or c.id = p_class_id)
    ),
    enr as (
      select e.id, e.student_id, e.status, e.enrolled_on, e.ended_on, e.exit_reason, e.class_id, s.unit_id,
        exists (select 1 from public.enrollments t where t.transferred_to_id = e.id) as is_transfer_in
      from public.enrollments e
      join scope s on s.id = e.class_id
      where e.status <> 'cancelled'
    ),
    current_enr as (
      select * from enr where enrolled_on < p_to and coalesce(ended_on, 'infinity') >= p_from
    ),
    ended as (
      select * from enr
      where ended_on >= p_from and ended_on < p_to and status in ('completed', 'failed', 'dropped_out')
    ),
    att as (
      select a.status, cs.held_on, a.class_id, s.unit_id
      from public.attendance_records a
      join scope s on s.id = a.class_id
      join public.class_sessions cs on cs.id = a.session_id
      join public.enrollments e on e.id = a.enrollment_id
      where cs.held_on >= p_from and cs.held_on < p_to
        and e.status <> 'cancelled'
    ),
    served as (
      select distinct cur.student_id, st.birth_date from current_enr cur
      join public.students st on st.id = cur.student_id
    ),
    profile as (
      select distinct on (sp.student_id) sp.*
      from public.social_profiles sp
      where sp.student_id in (select student_id from served) and sp.assessed_on < p_to
      order by sp.student_id, sp.assessed_on desc
    ),
    requests as (
      select r.status, r.enrollment_id
      from public.enrollment_requests r
      join public.enrollment_offers o on o.id = r.offer_id
      where o.unit_id in (select private.admin_unit_ids())
        and (p_unit_id is null or o.unit_id = p_unit_id)
        and (p_class_id is null or o.class_id = p_class_id)
        and (r.created_at at time zone 'America/Recife')::date >= p_from
        and (r.created_at at time zone 'America/Recife')::date < p_to
    ),
    alumni as (
      select distinct on (d.student_id) d.student_id, o.kind, o.formal_job
      from (select distinct student_id from ended where status = 'completed') d
      left join public.alumni_outcomes o on o.student_id = d.student_id
      order by d.student_id, o.observed_on desc nulls last, o.created_at desc nulls last
    ),
    months as (
      select month::date as month
      from generate_series(date_trunc('month', p_from), p_to - 1, interval '1 month') as month
    )
    select jsonb_build_object(
      'served', (select count(*) from served),
      'enrollments', (select count(*) from enr where enrolled_on >= p_from and enrolled_on < p_to and not is_transfer_in),
      'transfers', (select count(*) from enr where status = 'transferred' and ended_on >= p_from and ended_on < p_to),
      'completed', (select count(*) from ended where status = 'completed'),
      'failed', (select count(*) from ended where status = 'failed'),
      'dropped_out', (select count(*) from ended where status = 'dropped_out'),
      'attended', (select count(*) from att where status = 'present'),
      'recorded', (select count(*) from att),
      'hours', (
        select coalesce(sum(sc.workload_hours), 0) from ended join scope sc on sc.id = ended.class_id
        where ended.status = 'completed'
      ),
      'requests', (select count(*) from requests),
      'requests_converted', (select count(*) from requests where status = 'converted'),
      'requests_completed', (
        select count(*) from requests r join public.enrollments e on e.id = r.enrollment_id where e.status = 'completed'
      ),
      'exit_reasons', (select private.count_by(array_agg(exit_reason::text)) from ended where status = 'dropped_out'),
      'monthly', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'month', m.month,
          'active', (
            select count(distinct e.student_id) from enr e
            where e.enrolled_on < (m.month + interval '1 month')::date
              and coalesce(e.ended_on, 'infinity') >= greatest(m.month, p_from)
          ),
          'attended', (
            select count(*) from att a
            where a.held_on >= m.month and a.held_on < (m.month + interval '1 month')::date and a.status = 'present'
          ),
          'recorded', (
            select count(*) from att a where a.held_on >= m.month and a.held_on < (m.month + interval '1 month')::date
          )
        ) order by m.month), '[]')
        from months m
      ),
      'by_class', (
        select coalesce(jsonb_agg(item order by item->>'name'), '[]') from (
          select jsonb_build_object(
            'id', sc.id,
            'name', sc.name,
            'served', (select count(distinct student_id) from current_enr cur where cur.class_id = sc.id),
            'completed', (select count(*) from ended where ended.class_id = sc.id and status = 'completed'),
            'finished', (select count(*) from ended where ended.class_id = sc.id),
            'attended', (select count(*) from att where att.class_id = sc.id and status = 'present'),
            'recorded', (select count(*) from att where att.class_id = sc.id)
          ) as item
          from scope sc
          where sc.id in (select class_id from current_enr)
        ) items
      ),
      'by_unit', (
        select coalesce(jsonb_agg(item order by item->>'code'), '[]') from (
          select jsonb_build_object(
            'id', u.id,
            'code', u.code,
            'name', u.name,
            'served', (select count(distinct student_id) from current_enr cur where cur.unit_id = u.id),
            'completed', (select count(*) from ended where ended.unit_id = u.id and status = 'completed'),
            'finished', (select count(*) from ended where ended.unit_id = u.id),
            'attended', (select count(*) from att where att.unit_id = u.id and status = 'present'),
            'recorded', (select count(*) from att where att.unit_id = u.id)
          ) as item
          from public.units u
          where u.id in (select unit_id from current_enr)
        ) items
      ),
      'profiled', (select count(*) from profile),
      'age', (
        select private.count_by(array_agg(case
          when age < 15 then 'under_15'
          when age < 18 then '15_17'
          when age < 25 then '18_24'
          when age < 30 then '25_29'
          else '30_plus' end))
        from (select extract(year from age(p_to - 1, birth_date))::integer as age from served) ages
      ),
      'gender', (select private.count_by(array_agg(coalesce(gender::text, 'unknown'))) from profile),
      'race_color', (select private.count_by(array_agg(coalesce(race_color::text, 'unknown'))) from profile),
      'income', (
        select private.count_by(array_agg(case
          when household_income_cents is null or household_size is null then 'unknown'
          when household_income_cents / household_size <= 30000 then 'up_to_300'
          when household_income_cents / household_size <= 70000 then 'up_to_700'
          when household_income_cents / household_size <= 150000 then 'up_to_1500'
          else 'above_1500' end))
        from profile
      ),
      'benefits', (
        select private.count_by(array_agg(case when cardinality(benefits) > 0 then 'yes' else 'no' end)) from profile
      ),
      'alumni', (select count(*) from alumni),
      'outcomes', (
        select private.count_by(array_agg(case
          when kind is null then 'unknown'
          when kind = 'employed' and formal_job then 'employed_formal'
          else kind::text end))
        from alumni
      )
    )
  );
end;
$$;

revoke all on function private.suppress(jsonb) from public, anon;
revoke all on function private.count_by(text[]) from public, anon;
revoke all on function public.impact_report(date, date, uuid, uuid) from public, anon;
grant execute on function private.suppress(jsonb) to authenticated;
grant execute on function private.count_by(text[]) to authenticated;
grant execute on function public.impact_report(date, date, uuid, uuid) to authenticated;
