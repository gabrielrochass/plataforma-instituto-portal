create type public.attendance_status as enum ('present', 'absent');
create type public.case_note_kind as enum (
  'family_contact', 'pedagogical', 'incident', 'achievement', 'service', 'home_visit', 'referral'
);

create table public.attendance_records (
  session_id uuid not null,
  enrollment_id uuid not null,
  class_id uuid not null,
  status public.attendance_status not null,
  recorded_by uuid references public.profiles on delete set null,
  recorded_at timestamptz not null default now(),
  primary key (session_id, enrollment_id),
  foreign key (session_id, class_id) references public.class_sessions (id, class_id) on delete cascade,
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

create trigger attendance_before_write before insert or update of status on public.attendance_records
  for each row execute function private.attendance_before_write();

create function public.take_attendance(
  p_class_id uuid,
  p_held_on date,
  p_present uuid[],
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
  day_id uuid;
begin
  select * into class_row from public.classes where id = p_class_id;
  if not found or not private.can_operate_class(p_class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  if p_held_on is null or p_held_on > private.today()
    or p_held_on not between class_row.starts_on and class_row.ends_on then
    raise exception 'invalid day' using errcode = '22023';
  end if;
  if cardinality(p_present) > 500 then
    raise exception 'invalid marks' using errcode = '22023';
  end if;

  insert into public.class_sessions (class_id, held_on, note, taken_by)
  values (p_class_id, p_held_on, nullif(btrim(p_note), ''), (select auth.uid()))
  on conflict (class_id, held_on) do update set note = excluded.note
  returning id into day_id;

  insert into public.attendance_records (session_id, enrollment_id, class_id, status)
  select day_id, e.id, p_class_id,
    case when e.id = any (coalesce(p_present, '{}')) then 'present' else 'absent' end::public.attendance_status
  from public.enrollments e
  where e.class_id = p_class_id
    and e.status <> 'cancelled'
    and e.enrolled_on <= p_held_on
    and coalesce(e.ended_on, p_held_on) >= p_held_on
  on conflict (session_id, enrollment_id) do update
    set status = excluded.status
    where public.attendance_records.status is distinct from excluded.status;

  return day_id;
end;
$$;

create function public.delete_attendance(p_session_id uuid)
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
  if (select status from public.classes where id = session_row.class_id) <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  delete from public.class_sessions where id = p_session_id;
end;
$$;

create function private.absence_streak(p_enrollment_id uuid, p_before date)
returns integer
language sql
stable
set search_path = ''
as $$
  with marks as (
    select a.status, s.held_on
    from public.attendance_records a
    join public.class_sessions s on s.id = a.session_id
    where a.enrollment_id = p_enrollment_id and s.held_on < p_before
  ),
  last_presence as (
    select max(held_on) as held_on from marks where status = 'present'
  )
  select count(*)::integer from marks, last_presence
  where marks.status = 'absent' and (last_presence.held_on is null or marks.held_on > last_presence.held_on)
$$;

create function public.attendance_roster(p_class_id uuid, p_held_on date)
returns table (
  enrollment_id uuid,
  student_id uuid,
  full_name text,
  social_name text,
  needs_accessibility boolean,
  status public.attendance_status,
  streak integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, s.id, s.full_name, s.social_name,
    exists (select 1 from public.student_care c where c.student_id = s.id and cardinality(c.accessibility) > 0),
    a.status,
    private.absence_streak(e.id, p_held_on)
  from public.enrollments e
  join public.students s on s.id = e.student_id
  left join public.class_sessions cs on cs.class_id = e.class_id and cs.held_on = p_held_on
  left join public.attendance_records a on a.session_id = cs.id and a.enrollment_id = e.id
  where e.class_id = p_class_id
    and private.can_operate_class(p_class_id)
    and e.status <> 'cancelled'
    and e.enrolled_on <= p_held_on
    and coalesce(e.ended_on, p_held_on) >= p_held_on
  order by coalesce(s.social_name, s.full_name)
$$;

create function public.class_session_list(p_class_id uuid)
returns table (
  session_id uuid,
  held_on date,
  note text,
  present integer,
  absent integer,
  taken_by_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select cs.id, cs.held_on, cs.note,
    (select count(*)::integer from public.attendance_records a where a.session_id = cs.id and a.status = 'present'),
    (select count(*)::integer from public.attendance_records a where a.session_id = cs.id and a.status = 'absent'),
    p.display_name
  from public.class_sessions cs
  left join public.profiles p on p.id = cs.taken_by
  where cs.class_id = p_class_id and private.can_operate_class(p_class_id)
  order by cs.held_on desc
$$;

create function public.attendance_days(p_from date)
returns table (class_id uuid, held_on date)
language sql
stable
security definer
set search_path = ''
as $$
  select cs.class_id, cs.held_on
  from public.class_sessions cs
  join public.classes c on c.id = cs.class_id and c.status = 'open'
  where cs.class_id in (select private.operable_class_ids())
    and cs.held_on >= greatest(p_from, private.today() - 90)
$$;

create function public.class_attendance(p_class_id uuid)
returns table (
  enrollment_id uuid,
  present integer,
  absent integer,
  streak integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id,
    count(*) filter (where a.status = 'present')::integer,
    count(*) filter (where a.status = 'absent')::integer,
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
              where a2.enrollment_id = c.id and a2.status = 'present'
            ), '2000-01-01')
        )
    )
  order by c.streak desc, coalesce(s.social_name, s.full_name)
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

grant execute on function public.take_attendance(uuid, date, uuid[], text) to authenticated;
grant execute on function public.delete_attendance(uuid) to authenticated;
grant execute on function public.attendance_roster(uuid, date) to authenticated;
grant execute on function public.class_session_list(uuid) to authenticated;
grant execute on function public.attendance_days(date) to authenticated;
grant execute on function public.class_attendance(uuid) to authenticated;
grant execute on function public.absence_alerts() to authenticated;

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
