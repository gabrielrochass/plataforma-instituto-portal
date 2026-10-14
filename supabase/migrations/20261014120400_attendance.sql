create type public.attendance_status as enum ('present', 'absent', 'excused', 'late');
create type public.case_note_kind as enum (
  'family_contact', 'pedagogical', 'incident', 'achievement', 'service', 'home_visit', 'referral'
);

alter table public.class_sessions
  add column attendance_taken_at timestamptz,
  add column taken_by uuid references public.profiles on delete set null;

create table public.attendance_records (
  session_id uuid not null,
  enrollment_id uuid not null,
  class_id uuid not null,
  status public.attendance_status not null,
  note text check (private.valid_text(note, 200)),
  recorded_by uuid references public.profiles on delete set null,
  recorded_at timestamptz not null default now(),
  primary key (session_id, enrollment_id),
  foreign key (session_id, class_id) references public.class_sessions (id, class_id),
  foreign key (enrollment_id, class_id) references public.enrollments (id, class_id)
);

create index attendance_enrollment_idx on public.attendance_records (enrollment_id);
create index attendance_class_idx on public.attendance_records (class_id);

create table public.case_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  kind public.case_note_kind not null,
  happened_on date not null check (happened_on between '2000-01-01' and '2100-12-31'),
  body text not null check (private.valid_note(body, 4000)),
  author_id uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_notes_student_idx on public.case_notes (student_id, happened_on desc, created_at desc);

create trigger case_notes_touch before update on public.case_notes
  for each row execute function private.touch_updated_at();

create function private.attendance_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_row public.class_sessions;
  enrollment_row public.enrollments;
begin
  select * into session_row from public.class_sessions where id = new.session_id;
  select * into enrollment_row from public.enrollments where id = new.enrollment_id;
  if (select status from public.classes where id = new.class_id) <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  if session_row.cancelled_at is not null then
    raise exception 'session cancelled' using errcode = '55000';
  end if;
  if session_row.held_on > private.today() then
    raise exception 'session in the future' using errcode = '22023';
  end if;
  if session_row.held_on < enrollment_row.enrolled_on
    or session_row.held_on > coalesce(enrollment_row.ended_on, session_row.held_on) then
    raise exception 'outside the enrollment' using errcode = '55000';
  end if;
  new.recorded_by := (select auth.uid());
  new.recorded_at := now();
  return new;
end;
$$;

create trigger attendance_before_write before insert or update on public.attendance_records
  for each row execute function private.attendance_before_write();

create function public.take_attendance(p_session_id uuid, p_marks jsonb, p_topic text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_row public.class_sessions;
begin
  select * into session_row from public.class_sessions where id = p_session_id for update;
  if not found or not private.can_operate_class(session_row.class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(p_marks) <> 'array' or jsonb_array_length(p_marks) > 300 then
    raise exception 'invalid marks' using errcode = '22023';
  end if;

  insert into public.attendance_records (session_id, enrollment_id, class_id, status, note)
  select p_session_id, mark.enrollment_id, session_row.class_id, mark.status, nullif(btrim(mark.note), '')
  from jsonb_to_recordset(p_marks) as mark (enrollment_id uuid, status public.attendance_status, note text)
  on conflict (session_id, enrollment_id) do update
    set status = excluded.status, note = excluded.note
    where (public.attendance_records.status, public.attendance_records.note)
      is distinct from (excluded.status, excluded.note);

  update public.class_sessions
  set topic = nullif(btrim(p_topic), ''),
      attendance_taken_at = coalesce(attendance_taken_at, now()),
      taken_by = coalesce(taken_by, (select auth.uid()))
  where id = p_session_id;
end;
$$;

create function public.cancel_session(p_session_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_row public.class_sessions;
begin
  select * into session_row from public.class_sessions where id = p_session_id for update;
  if not found or not private.can_operate_class(session_row.class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.attendance_records where session_id = p_session_id) then
    raise exception 'session has attendance' using errcode = '55000';
  end if;
  update public.class_sessions
  set cancelled_at = now(), cancel_reason = btrim(p_reason)
  where id = p_session_id;
end;
$$;

create function public.restore_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_row public.class_sessions;
begin
  select * into session_row from public.class_sessions where id = p_session_id for update;
  if not found or not private.can_operate_class(session_row.class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.class_sessions set cancelled_at = null, cancel_reason = null where id = p_session_id;
end;
$$;

create function private.absence_streak(p_enrollment_id uuid, p_before date)
returns integer
language sql
stable
set search_path = ''
as $$
  with marks as (
    select a.status, s.held_on, s.starts_at
    from public.attendance_records a
    join public.class_sessions s on s.id = a.session_id
    where a.enrollment_id = p_enrollment_id and s.held_on < p_before and a.status <> 'excused'
  ),
  last_presence as (
    select max(held_on) as held_on from marks where status in ('present', 'late')
  )
  select count(*)::integer from marks, last_presence
  where marks.status = 'absent' and (last_presence.held_on is null or marks.held_on > last_presence.held_on)
$$;

create function public.session_roster(p_session_id uuid)
returns table (
  enrollment_id uuid,
  student_id uuid,
  full_name text,
  social_name text,
  needs_accessibility boolean,
  status public.attendance_status,
  note text,
  streak integer,
  contact_name text,
  contact_phone text,
  contact_whatsapp boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, s.id, s.full_name, s.social_name,
    exists (select 1 from public.student_care c where c.student_id = s.id and cardinality(c.accessibility) > 0),
    a.status, a.note,
    private.absence_streak(e.id, cs.held_on),
    coalesce(g.full_name, case when s.phone is not null then s.full_name end),
    coalesce(s.phone, g.phone),
    case when s.phone is not null then true else coalesce(g.is_whatsapp, false) end
  from public.class_sessions cs
  join public.enrollments e on e.class_id = cs.class_id
    and e.enrolled_on <= cs.held_on
    and coalesce(e.ended_on, cs.held_on) >= cs.held_on
    and e.status in ('active', 'completed', 'failed', 'transferred', 'dropped_out')
  join public.students s on s.id = e.student_id
  left join public.attendance_records a on a.session_id = cs.id and a.enrollment_id = e.id
  left join lateral (
    select g.full_name, g.phone, g.is_whatsapp from public.guardians g
    where g.student_id = s.id order by g.created_at limit 1
  ) g on true
  where cs.id = p_session_id and private.can_operate_class(cs.class_id)
  order by coalesce(s.social_name, s.full_name)
$$;

create function public.class_attendance(p_class_id uuid)
returns table (
  enrollment_id uuid,
  present integer,
  late integer,
  absent integer,
  excused integer,
  streak integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id,
    count(*) filter (where a.status = 'present')::integer,
    count(*) filter (where a.status = 'late')::integer,
    count(*) filter (where a.status = 'absent')::integer,
    count(*) filter (where a.status = 'excused')::integer,
    private.absence_streak(e.id, private.today() + 1)
  from public.enrollments e
  left join public.attendance_records a on a.enrollment_id = e.id
  where e.class_id = p_class_id and private.can_operate_class(p_class_id)
  group by e.id
$$;

create function public.absence_alerts()
returns table (
  enrollment_id uuid,
  student_id uuid,
  student_name text,
  class_id uuid,
  class_name text,
  unit_code text,
  streak integer,
  contact_name text,
  contact_phone text,
  contact_whatsapp boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with candidates as (
    select e.id, e.student_id, e.class_id, private.absence_streak(e.id, private.today() + 1) as streak
    from public.enrollments e
    where e.status = 'active' and e.class_id in (select private.operable_class_ids())
  )
  select c.id, s.id, coalesce(s.social_name, s.full_name), cl.id, cl.name, u.code, c.streak,
    coalesce(g.full_name, case when s.phone is not null then s.full_name end),
    coalesce(s.phone, g.phone),
    case when s.phone is not null then true else coalesce(g.is_whatsapp, false) end
  from candidates c
  join public.students s on s.id = c.student_id
  join public.classes cl on cl.id = c.class_id and cl.status = 'open'
  join public.units u on u.id = cl.unit_id
  left join lateral (
    select g.full_name, g.phone, g.is_whatsapp from public.guardians g
    where g.student_id = s.id order by g.created_at limit 1
  ) g on true
  where c.streak >= 3
    and not exists (
      select 1 from public.case_notes n
      where n.student_id = s.id and n.kind = 'family_contact'
        and n.happened_on >= (
          select min(cs.held_on) from public.attendance_records a
          join public.class_sessions cs on cs.id = a.session_id
          where a.enrollment_id = c.id and a.status = 'absent'
            and cs.held_on > coalesce((
              select max(cs2.held_on) from public.attendance_records a2
              join public.class_sessions cs2 on cs2.id = a2.session_id
              where a2.enrollment_id = c.id and a2.status in ('present', 'late')
            ), '2000-01-01')
        )
    )
  order by c.streak desc, coalesce(s.social_name, s.full_name)
$$;

create function public.pending_sessions(p_days integer default 14)
returns table (
  session_id uuid,
  class_id uuid,
  class_name text,
  unit_code text,
  held_on date,
  starts_at time,
  ends_at time,
  teaches boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select cs.id, c.id, c.name, u.code, cs.held_on, cs.starts_at, cs.ends_at,
    c.id in (select private.taught_class_ids())
  from public.class_sessions cs
  join public.classes c on c.id = cs.class_id and c.status = 'open'
  join public.units u on u.id = c.unit_id
  where cs.class_id in (select private.operable_class_ids())
    and cs.cancelled_at is null
    and cs.attendance_taken_at is null
    and cs.held_on between private.today() - least(greatest(p_days, 1), 60) and private.today()
    and exists (select 1 from public.enrollments e where e.class_id = c.id and e.status = 'active')
  order by cs.held_on desc, cs.starts_at
$$;

create function public.today_sessions()
returns table (
  session_id uuid,
  class_id uuid,
  class_name text,
  unit_code text,
  starts_at time,
  ends_at time,
  taken boolean,
  cancelled boolean,
  present integer,
  absent integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select cs.id, c.id, c.name, u.code, cs.starts_at, cs.ends_at,
    cs.attendance_taken_at is not null, cs.cancelled_at is not null,
    (select count(*)::integer from public.attendance_records a where a.session_id = cs.id and a.status in ('present', 'late')),
    (select count(*)::integer from public.attendance_records a where a.session_id = cs.id and a.status in ('absent', 'excused'))
  from public.class_sessions cs
  join public.classes c on c.id = cs.class_id and c.status = 'open'
  join public.units u on u.id = c.unit_id
  where cs.class_id in (select private.taught_class_ids())
    and cs.held_on = private.today()
  order by cs.starts_at
$$;

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
  missed integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.name, co.name, u.code, e.status, e.enrolled_on, e.ended_on, e.exit_reason,
    tc.name, private.can_operate_class(c.id),
    (select count(*)::integer from public.attendance_records a where a.enrollment_id = e.id and a.status in ('present', 'late')),
    (select count(*)::integer from public.attendance_records a where a.enrollment_id = e.id and a.status in ('absent', 'excused'))
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  join public.courses co on co.id = c.course_id
  join public.units u on u.id = c.unit_id
  left join public.enrollments t on t.id = e.transferred_to_id
  left join public.classes tc on tc.id = t.class_id
  where private.can_see_student(p_student_id) and e.student_id = p_student_id
  order by e.enrolled_on desc, e.created_at desc
$$;

create or replace function public.update_class(
  p_id uuid,
  p_name text,
  p_ends_on date,
  p_schedule jsonb,
  p_teacher_ids uuid[],
  p_grading_scheme public.grading_scheme,
  p_min_attendance smallint,
  p_remove_session_ids uuid[],
  p_add_sessions jsonb,
  p_capacity smallint default null,
  p_passing_score numeric default null,
  p_concept_labels text[] default null,
  p_concept_passing smallint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
begin
  select * into class_row from public.classes where id = p_id for update;
  if not found or not private.can_operate_class(p_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  perform private.check_teachers(class_row.unit_id, p_teacher_ids);
  if cardinality(p_teacher_ids) = 0
    and class_row.unit_id not in (select private.admin_unit_ids()) then
    raise exception 'a teacher must stay' using errcode = '23514';
  end if;

  update public.classes set
    name = btrim(p_name),
    ends_on = p_ends_on,
    schedule = p_schedule,
    capacity = p_capacity,
    grading_scheme = p_grading_scheme,
    passing_score = p_passing_score,
    concept_labels = p_concept_labels,
    concept_passing = p_concept_passing,
    min_attendance = p_min_attendance
  where id = p_id;

  delete from public.class_teachers where class_id = p_id and user_id <> all (p_teacher_ids);
  insert into public.class_teachers (class_id, unit_id, user_id)
  select p_id, class_row.unit_id, unnest(p_teacher_ids)
  on conflict do nothing;

  delete from public.class_sessions s
  where s.class_id = p_id
    and s.id = any (p_remove_session_ids)
    and s.held_on >= private.today()
    and not s.is_extra
    and not exists (select 1 from public.attendance_records a where a.session_id = s.id);
  perform private.insert_sessions(p_id, p_add_sessions);
end;
$$;

alter table public.attendance_records enable row level security;
alter table public.case_notes enable row level security;

create policy "class staff see attendance" on public.attendance_records
  for select to authenticated
  using ((select private.is_admin_geral()) or class_id in (select private.operable_class_ids()));

create policy "authors and coordination see notes" on public.case_notes
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or (select private.is_admin_geral())
    or student_id in (select private.social_student_ids())
  );
create policy "staff write notes about their students" on public.case_notes
  for insert to authenticated
  with check (
    ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()))
    and (
      kind in ('family_contact', 'pedagogical', 'incident', 'achievement')
      or (select private.is_admin_geral())
      or student_id in (select private.social_student_ids())
    )
  );
create policy "authors fix recent notes" on public.case_notes
  for update to authenticated
  using (author_id = (select auth.uid()) and created_at > now() - interval '24 hours')
  with check (author_id = (select auth.uid()));

grant select on public.attendance_records to authenticated;
grant select on public.case_notes to authenticated;
grant insert (id, student_id, kind, happened_on, body) on public.case_notes to authenticated;
grant update (kind, happened_on, body) on public.case_notes to authenticated;

revoke all on function private.attendance_before_write() from public, anon, authenticated;
revoke all on function private.absence_streak(uuid, date) from public, anon, authenticated;

grant execute on function public.take_attendance(uuid, jsonb, text) to authenticated;
grant execute on function public.cancel_session(uuid, text) to authenticated;
grant execute on function public.restore_session(uuid) to authenticated;
grant execute on function public.session_roster(uuid) to authenticated;
grant execute on function public.class_attendance(uuid) to authenticated;
grant execute on function public.absence_alerts() to authenticated;
grant execute on function public.pending_sessions(integer) to authenticated;
grant execute on function public.today_sessions() to authenticated;
grant execute on function public.student_timeline(uuid) to authenticated;

create function public.home_counts()
returns table (active_students integer, social_pending integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(distinct e.student_id)::integer
     from public.enrollments e
     join public.classes c on c.id = e.class_id
     where e.status = 'active' and c.unit_id in (select private.admin_unit_ids())),
    (select count(*)::integer
     from public.students s
     where s.last_assessed_on is null and s.id in (select private.social_student_ids()))
$$;

grant execute on function public.home_counts() to authenticated;
