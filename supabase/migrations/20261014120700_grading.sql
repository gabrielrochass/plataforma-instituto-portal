create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes on delete cascade,
  title text not null check (private.valid_text(title, 80)),
  held_on date check (held_on between '2000-01-01' and '2100-12-31'),
  weight numeric(5, 2) not null default 1 check (weight > 0 and weight <= 100),
  created_at timestamptz not null default now(),
  unique (id, class_id)
);

create index assessments_class_idx on public.assessments (class_id, held_on, created_at);

create table public.grades (
  assessment_id uuid not null,
  enrollment_id uuid not null,
  class_id uuid not null,
  score numeric(6, 2) check (score >= 0),
  concept text,
  missed boolean not null default false,
  graded_by uuid references public.profiles on delete set null,
  graded_at timestamptz not null default now(),
  primary key (assessment_id, enrollment_id),
  foreign key (assessment_id, class_id) references public.assessments (id, class_id) on delete cascade,
  foreign key (enrollment_id, class_id) references public.enrollments (id, class_id),
  check (num_nonnulls(score, concept) + missed::integer = 1)
);

create index grades_enrollment_idx on public.grades (enrollment_id);

alter table public.enrollments
  add column attendance_pct numeric(5, 2),
  add column final_score numeric(6, 2),
  add column final_concept text,
  add column closed_by uuid references public.profiles on delete set null;

create function private.scheme_scale(scheme public.grading_scheme)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case scheme when 'numeric_10' then 10 when 'numeric_100' then 100 end::numeric
$$;

create function private.assessments_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
begin
  select * into class_row from public.classes where id = coalesce(new.class_id, old.class_id);
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  if tg_op <> 'DELETE' and class_row.grading_scheme = 'attendance_only' then
    raise exception 'class has no grades' using errcode = '23514';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger assessments_before_write before insert or update or delete on public.assessments
  for each row execute function private.assessments_before_write();

create function private.grades_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
begin
  select * into class_row from public.classes where id = new.class_id;
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  if (select status from public.enrollments where id = new.enrollment_id) <> 'active' then
    raise exception 'enrollment closed' using errcode = '55000';
  end if;
  if class_row.grading_scheme = 'concept' then
    if new.score is not null or (new.concept is not null and not new.concept = any (class_row.concept_labels)) then
      raise exception 'unknown concept' using errcode = '23514';
    end if;
  elsif new.concept is not null or new.score > private.scheme_scale(class_row.grading_scheme) then
    raise exception 'score out of range' using errcode = '23514';
  end if;
  new.graded_by := (select auth.uid());
  new.graded_at := now();
  return new;
end;
$$;

create trigger grades_before_write before insert or update on public.grades
  for each row execute function private.grades_before_write();

create function public.save_grades(p_assessment_id uuid, p_grades jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  assessment public.assessments;
begin
  select * into assessment from public.assessments where id = p_assessment_id;
  if not found or not private.can_operate_class(assessment.class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_grades) <> 'array' or jsonb_array_length(p_grades) > 300 then
    raise exception 'invalid grades' using errcode = '22023';
  end if;

  delete from public.grades g
  using jsonb_to_recordset(p_grades) as item (enrollment_id uuid, score numeric, concept text, missed boolean)
  where g.assessment_id = p_assessment_id and g.enrollment_id = item.enrollment_id
    and item.score is null and item.concept is null and not coalesce(item.missed, false);

  insert into public.grades (assessment_id, enrollment_id, class_id, score, concept, missed)
  select p_assessment_id, item.enrollment_id, assessment.class_id, item.score, item.concept, coalesce(item.missed, false)
  from jsonb_to_recordset(p_grades) as item (enrollment_id uuid, score numeric, concept text, missed boolean)
  where item.score is not null or item.concept is not null or coalesce(item.missed, false)
  on conflict (assessment_id, enrollment_id) do update
    set score = excluded.score, concept = excluded.concept, missed = excluded.missed;
end;
$$;

create function public.class_results(p_class_id uuid)
returns table (
  enrollment_id uuid,
  student_id uuid,
  student_name text,
  attendance_pct numeric,
  final_score numeric,
  final_concept text,
  missing_grades integer,
  passed_score boolean,
  passed_attendance boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with class_row as (
    select * from public.classes where id = p_class_id and private.can_operate_class(p_class_id)
  ),
  roster as (
    select e.id, e.student_id, e.enrolled_on, coalesce(s.social_name, s.full_name) as name
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.class_id = p_class_id and e.status = 'active'
  ),
  attendance as (
    select r.id,
      case when count(a.*) = 0 then null
        else round(100.0 * count(*) filter (where a.status in ('present', 'late')) / count(a.*), 2)
      end as pct
    from roster r
    left join public.attendance_records a on a.enrollment_id = r.id
    group by r.id
  ),
  applicable as (
    select r.id as enrollment_id, x.id as assessment_id, x.weight, g.score, g.concept, g.missed,
      g.assessment_id is null as missing
    from roster r
    join public.assessments x on x.class_id = p_class_id and (x.held_on is null or x.held_on >= r.enrolled_on)
    left join public.grades g on g.assessment_id = x.id and g.enrollment_id = r.id
  ),
  scores as (
    select a.enrollment_id,
      round(sum(a.weight * coalesce(a.score, 0)) / nullif(sum(a.weight), 0), 2) as score,
      round(sum(a.weight * coalesce(
        array_position((select concept_labels from class_row), a.concept) - 1,
        cardinality((select concept_labels from class_row)) - 1
      )) / nullif(sum(a.weight), 0)) as concept_rank,
      count(*) filter (where a.missing)::integer as missing
    from applicable a
    group by a.enrollment_id
  )
  select r.id, r.student_id, r.name, at.pct,
    case when c.grading_scheme in ('numeric_10', 'numeric_100') then coalesce(sc.score, 0) end,
    case when c.grading_scheme = 'concept'
      then c.concept_labels[coalesce(sc.concept_rank, cardinality(c.concept_labels) - 1)::integer + 1] end,
    coalesce(sc.missing, 0),
    case c.grading_scheme
      when 'attendance_only' then true
      when 'concept' then coalesce(sc.concept_rank, cardinality(c.concept_labels) - 1) < c.concept_passing
      else coalesce(sc.score, 0) >= c.passing_score
    end,
    coalesce(at.pct, 0) >= c.min_attendance
  from roster r
  cross join class_row c
  left join attendance at on at.id = r.id
  left join scores sc on sc.enrollment_id = r.id
  order by r.name
$$;

create function public.close_class(p_class_id uuid, p_overrides jsonb default '[]')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
  closed_on date;
begin
  select * into class_row from public.classes where id = p_class_id for update;
  if not found or not private.can_operate_class(p_class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  closed_on := least(private.today(), class_row.ends_on);

  update public.enrollments e set
    status = case
      when coalesce(o.passed, r.passed_score and r.passed_attendance) then 'completed'
      else 'failed'
    end::public.enrollment_status,
    ended_on = greatest(e.enrolled_on, closed_on),
    attendance_pct = r.attendance_pct,
    final_score = r.final_score,
    final_concept = r.final_concept,
    exit_note = nullif(btrim(o.reason), ''),
    closed_by = (select auth.uid())
  from public.class_results(p_class_id) r
  left join jsonb_to_recordset(coalesce(p_overrides, '[]')) as o (enrollment_id uuid, passed boolean, reason text)
    on o.enrollment_id = r.enrollment_id
  where e.id = r.enrollment_id;

  update public.classes set status = 'finished', finished_at = now() where id = p_class_id;
end;
$$;

create function public.reopen_class(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
begin
  select * into class_row from public.classes where id = p_class_id for update;
  if not found or class_row.unit_id not in (select private.admin_unit_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if class_row.status <> 'finished' then
    raise exception 'class not finished' using errcode = '55000';
  end if;
  update public.enrollments
  set status = 'active', ended_on = null, attendance_pct = null, final_score = null,
      final_concept = null, exit_note = null, closed_by = null
  where class_id = p_class_id and status in ('completed', 'failed');
  update public.classes set status = 'open', finished_at = null where id = p_class_id;
end;
$$;

create function private.classes_grading_lock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.grading_scheme is distinct from old.grading_scheme or new.concept_labels is distinct from old.concept_labels)
    and exists (select 1 from public.grades g where g.class_id = new.id) then
    raise exception 'grading locked' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger classes_grading_lock before update of grading_scheme, concept_labels on public.classes
  for each row execute function private.classes_grading_lock();

alter table public.assessments enable row level security;
alter table public.grades enable row level security;

create policy "class staff see assessments" on public.assessments
  for select to authenticated
  using ((select private.is_admin_geral()) or class_id in (select private.operable_class_ids()));
create policy "class staff add assessments" on public.assessments
  for insert to authenticated
  with check (class_id in (select private.operable_class_ids()));
create policy "class staff edit assessments" on public.assessments
  for update to authenticated
  using (class_id in (select private.operable_class_ids()))
  with check (class_id in (select private.operable_class_ids()));
create policy "class staff remove assessments" on public.assessments
  for delete to authenticated
  using (class_id in (select private.operable_class_ids()));

create policy "class staff see grades" on public.grades
  for select to authenticated
  using ((select private.is_admin_geral()) or class_id in (select private.operable_class_ids()));

grant select, delete on public.assessments to authenticated;
grant insert (id, class_id, title, held_on, weight) on public.assessments to authenticated;
grant update (title, held_on, weight) on public.assessments to authenticated;
grant select on public.grades to authenticated;

revoke all on function private.assessments_before_write() from public, anon, authenticated;
revoke all on function private.grades_before_write() from public, anon, authenticated;
revoke all on function private.classes_grading_lock() from public, anon, authenticated;
grant execute on function private.scheme_scale(public.grading_scheme) to authenticated;

grant execute on function public.save_grades(uuid, jsonb) to authenticated;
grant execute on function public.class_results(uuid) to authenticated;
grant execute on function public.close_class(uuid, jsonb) to authenticated;
grant execute on function public.reopen_class(uuid) to authenticated;

drop function public.student_timeline(uuid);

create function public.student_timeline(p_student_id uuid)
returns table (
  enrollment_id uuid,
  class_id uuid,
  class_name text,
  course_name text,
  unit_code text,
  status public.enrollment_status,
  enrolled_on date,
  ended_on date,
  exit_reason public.exit_reason,
  transferred_to_class text,
  operable boolean,
  attended integer,
  missed integer,
  final_score numeric,
  final_concept text
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.name, co.name, u.code, e.status, e.enrolled_on, e.ended_on, e.exit_reason,
    tc.name, private.can_operate_class(c.id),
    (select count(*)::integer from public.attendance_records a where a.enrollment_id = e.id and a.status in ('present', 'late')),
    (select count(*)::integer from public.attendance_records a where a.enrollment_id = e.id and a.status in ('absent', 'excused')),
    e.final_score, e.final_concept
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  join public.courses co on co.id = c.course_id
  join public.units u on u.id = c.unit_id
  left join public.enrollments t on t.id = e.transferred_to_id
  left join public.classes tc on tc.id = t.class_id
  where private.can_see_student(p_student_id) and e.student_id = p_student_id
  order by e.enrolled_on desc, e.created_at desc
$$;

grant execute on function public.student_timeline(uuid) to authenticated;
