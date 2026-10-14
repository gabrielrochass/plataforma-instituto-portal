create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.grading_scheme as enum ('numeric_10', 'numeric_100', 'concept', 'attendance_only');
create type public.class_status as enum ('open', 'finished', 'cancelled');

create function private.valid_text(value text, max_length integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null or (
    char_length(value) between 1 and max_length
    and value = btrim(value)
    and value !~ '[[:cntrl:]]'
  )
$$;

create function private.valid_note(value text, max_length integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null or (
    char_length(value) between 1 and max_length
    and value = btrim(value)
    and value !~ '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]'
  )
$$;

create function private.valid_grading(
  scheme public.grading_scheme,
  passing_score numeric,
  concept_labels text[],
  concept_passing smallint
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case scheme
    when 'numeric_10' then passing_score between 0 and 10 and concept_labels is null and concept_passing is null
    when 'numeric_100' then passing_score between 0 and 100 and concept_labels is null and concept_passing is null
    when 'concept' then passing_score is null
      and cardinality(concept_labels) between 2 and 10
      and concept_passing between 1 and cardinality(concept_labels)
      and (select bool_and(private.valid_text(label, 20)) from unnest(concept_labels) label)
      and (select count(distinct lower(label)) from unnest(concept_labels) label) = cardinality(concept_labels)
    else passing_score is null and concept_labels is null and concept_passing is null
  end
$$;

create function private.valid_schedule(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and jsonb_array_length(value) between 1 and 14
    and (
      select bool_and(
        (slot ->> 'weekday') ~ '^[1-7]$'
        and (slot ->> 'starts_at') ~ '^([01]\d|2[0-3]):[0-5]\d$'
        and (slot ->> 'ends_at') ~ '^([01]\d|2[0-3]):[0-5]\d$'
        and (slot ->> 'ends_at') > (slot ->> 'starts_at')
      )
      from jsonb_array_elements(value) slot
    )
$$;

create function private.normalize_text(value text)
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(btrim(lower(regexp_replace(
    extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')), '\s+', ' ', 'g'
  ))), '')
$$;

create function private.today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Recife')::date
$$;

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (private.valid_text(name, 80)),
  description text check (private.valid_note(description, 2000)),
  workload_hours smallint not null check (workload_hours between 1 and 2000),
  grading_scheme public.grading_scheme not null default 'numeric_10',
  passing_score numeric(5, 2) default 6,
  concept_labels text[],
  concept_passing smallint,
  min_attendance smallint not null default 75 check (min_attendance between 0 and 100),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (private.valid_grading(grading_scheme, passing_score, concept_labels, concept_passing))
);

create unique index courses_name_key on public.courses (lower(name)) where archived_at is null;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses,
  unit_id uuid not null references public.units,
  name text not null check (private.valid_text(name, 80)),
  starts_on date not null check (starts_on between '2000-01-01' and '2100-12-31'),
  ends_on date not null,
  schedule jsonb not null check (private.valid_schedule(schedule)),
  capacity smallint check (capacity between 1 and 500),
  status public.class_status not null default 'open',
  grading_scheme public.grading_scheme not null,
  passing_score numeric(5, 2),
  concept_labels text[],
  concept_passing smallint,
  min_attendance smallint not null check (min_attendance between 0 and 100),
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (id, unit_id),
  check (ends_on between starts_on and starts_on + 730),
  check ((status = 'finished') = (finished_at is not null)),
  check (private.valid_grading(grading_scheme, passing_score, concept_labels, concept_passing))
);

create unique index classes_name_key on public.classes (unit_id, lower(name)) where status <> 'cancelled';
create index classes_unit_idx on public.classes (unit_id, status, starts_on desc);
create index classes_course_idx on public.classes (course_id);

create table public.class_teachers (
  class_id uuid not null,
  unit_id uuid not null,
  user_id uuid not null references public.profiles on delete cascade,
  primary key (class_id, user_id),
  foreign key (class_id, unit_id) references public.classes (id, unit_id) on delete cascade
);

create index class_teachers_user_idx on public.class_teachers (user_id);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes on delete cascade,
  held_on date not null check (held_on between '2000-01-01' and '2100-12-31'),
  starts_at time not null,
  ends_at time not null,
  is_extra boolean not null default false,
  topic text check (private.valid_note(topic, 500)),
  cancelled_at timestamptz,
  cancel_reason text check (private.valid_text(cancel_reason, 120)),
  unique (id, class_id),
  unique (class_id, held_on, starts_at),
  check (ends_at > starts_at),
  check ((cancelled_at is null) = (cancel_reason is null))
);

create index class_sessions_day_idx on public.class_sessions (held_on);

create table public.calendar_closures (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units,
  starts_on date not null check (starts_on between '2000-01-01' and '2100-12-31'),
  ends_on date not null,
  reason text not null check (private.valid_text(reason, 80)),
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on between starts_on and starts_on + 366)
);

create index calendar_closures_range_idx on public.calendar_closures (starts_on, ends_on);

create trigger courses_touch before update on public.courses
  for each row execute function private.touch_updated_at();
create trigger classes_touch before update on public.classes
  for each row execute function private.touch_updated_at();

create function private.taught_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select t.class_id
  from public.class_teachers t
  join public.staff_memberships m on m.user_id = t.user_id and m.unit_id = t.unit_id
  where t.user_id = (select private.active_user_id())
$$;

create function private.operable_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.classes c where c.unit_id in (select private.admin_unit_ids())
  union
  select private.taught_class_ids()
$$;

create function private.can_operate_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_class_id in (select private.operable_class_ids())
$$;

create function private.is_any_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admin_unit_ids())
$$;

create function private.insert_sessions(p_class_id uuid, p_sessions jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  class_row public.classes;
begin
  select * into class_row from public.classes where id = p_class_id;
  if jsonb_typeof(p_sessions) <> 'array' or jsonb_array_length(p_sessions) > 400 then
    raise exception 'too many sessions' using errcode = '54000';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_sessions) as s (held_on date, starts_at time, ends_at time)
    where s.held_on not between class_row.starts_on and class_row.ends_on
  ) then
    raise exception 'session outside the class period' using errcode = '22023';
  end if;

  insert into public.class_sessions (class_id, held_on, starts_at, ends_at)
  select p_class_id, s.held_on, s.starts_at, s.ends_at
  from jsonb_to_recordset(p_sessions) as s (held_on date, starts_at time, ends_at time)
  on conflict (class_id, held_on, starts_at) do nothing;
end;
$$;

create function private.check_teachers(p_unit_id uuid, p_teacher_ids uuid[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from unnest(p_teacher_ids) as t (user_id)
    where not exists (
      select 1 from public.staff_memberships m
      join public.profiles p on p.id = m.user_id
      where m.user_id = t.user_id and m.unit_id = p_unit_id and p.deactivated_at is null
    )
  ) then
    raise exception 'teacher outside the unit' using errcode = '23514';
  end if;
end;
$$;

create function public.create_class(
  p_id uuid,
  p_course_id uuid,
  p_unit_id uuid,
  p_name text,
  p_starts_on date,
  p_ends_on date,
  p_schedule jsonb,
  p_teacher_ids uuid[],
  p_grading_scheme public.grading_scheme,
  p_min_attendance smallint,
  p_sessions jsonb,
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
  me uuid := (select private.active_user_id());
  teachers uuid[];
begin
  if p_unit_id not in (select private.member_unit_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.classes where id = p_id) then
    return;
  end if;
  if not exists (select 1 from public.courses where id = p_course_id and archived_at is null) then
    raise exception 'course unavailable' using errcode = '23514';
  end if;

  teachers := array(select distinct unnest(
    coalesce(p_teacher_ids, '{}')
    || case when p_unit_id in (select private.admin_unit_ids()) then '{}'::uuid[] else array[me] end
  ));
  perform private.check_teachers(p_unit_id, teachers);

  insert into public.classes (
    id, course_id, unit_id, name, starts_on, ends_on, schedule, capacity,
    grading_scheme, passing_score, concept_labels, concept_passing, min_attendance, created_by
  ) values (
    p_id, p_course_id, p_unit_id, btrim(p_name), p_starts_on, p_ends_on, p_schedule, p_capacity,
    p_grading_scheme, p_passing_score, p_concept_labels, p_concept_passing, p_min_attendance, me
  );

  insert into public.class_teachers (class_id, unit_id, user_id)
  select p_id, p_unit_id, unnest(teachers);

  perform private.insert_sessions(p_id, p_sessions);
end;
$$;

create function public.update_class(
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

  delete from public.class_sessions
  where class_id = p_id
    and id = any (p_remove_session_ids)
    and held_on >= private.today()
    and not is_extra;
  perform private.insert_sessions(p_id, p_add_sessions);
end;
$$;

alter table public.courses enable row level security;
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.class_sessions enable row level security;
alter table public.calendar_closures enable row level security;

create policy "staff see courses" on public.courses
  for select to authenticated using ((select private.is_staff()));
create policy "admins add courses" on public.courses
  for insert to authenticated with check ((select private.is_any_admin()));
create policy "admins edit courses" on public.courses
  for update to authenticated
  using ((select private.is_any_admin()))
  with check ((select private.is_any_admin()));

create policy "unit staff see classes" on public.classes
  for select to authenticated
  using (unit_id in (select private.member_unit_ids()));

create policy "unit staff see teachers" on public.class_teachers
  for select to authenticated
  using (unit_id in (select private.member_unit_ids()));

create policy "unit staff see sessions" on public.class_sessions
  for select to authenticated
  using (class_id in (select c.id from public.classes c));

create policy "staff see closures" on public.calendar_closures
  for select to authenticated using ((select private.is_staff()));
create policy "admins manage closures" on public.calendar_closures
  for all to authenticated
  using (unit_id in (select private.admin_unit_ids()) or (unit_id is null and (select private.is_admin_geral())))
  with check (unit_id in (select private.admin_unit_ids()) or (unit_id is null and (select private.is_admin_geral())));

grant select on public.courses to authenticated;
grant insert (id, name, description, workload_hours, grading_scheme, passing_score, concept_labels, concept_passing, min_attendance)
  on public.courses to authenticated;
grant update (name, description, workload_hours, grading_scheme, passing_score, concept_labels, concept_passing, min_attendance, archived_at)
  on public.courses to authenticated;
grant select on public.classes to authenticated;
grant select on public.class_teachers to authenticated;
grant select on public.class_sessions to authenticated;
grant select, delete on public.calendar_closures to authenticated;
grant insert (id, unit_id, starts_on, ends_on, reason) on public.calendar_closures to authenticated;

revoke all on function private.taught_class_ids() from public, anon;
revoke all on function private.operable_class_ids() from public, anon;
revoke all on function private.can_operate_class(uuid) from public, anon;
revoke all on function private.is_any_admin() from public, anon;
revoke all on function private.check_teachers(uuid, uuid[]) from public, anon, authenticated;
revoke all on function private.insert_sessions(uuid, jsonb) from public, anon, authenticated;
grant execute on function private.taught_class_ids() to authenticated;
grant execute on function private.operable_class_ids() to authenticated;
grant execute on function private.can_operate_class(uuid) to authenticated;
grant execute on function private.is_any_admin() to authenticated;
grant execute on function private.valid_text(text, integer) to authenticated;
grant execute on function private.valid_note(text, integer) to authenticated;
grant execute on function private.valid_grading(public.grading_scheme, numeric, text[], smallint) to authenticated;
grant execute on function private.valid_schedule(jsonb) to authenticated;
grant execute on function private.normalize_text(text) to authenticated;
grant execute on function private.today() to authenticated;

grant execute on function public.create_class(uuid, uuid, uuid, text, date, date, jsonb, uuid[], public.grading_scheme, smallint, jsonb, smallint, numeric, text[], smallint) to authenticated;
grant execute on function public.update_class(uuid, text, date, jsonb, uuid[], public.grading_scheme, smallint, uuid[], jsonb, smallint, numeric, text[], smallint) to authenticated;
