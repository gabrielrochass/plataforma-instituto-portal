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

create function private.valid_weekdays(value smallint[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(value) between 1 and 7
    and value <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    and (select count(distinct day) from unnest(value) day) = cardinality(value)
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

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units,
  name text not null check (private.valid_text(name, 80)),
  starts_on date not null check (starts_on between '2000-01-01' and '2100-12-31'),
  ends_on date not null,
  weekdays smallint[] not null check (private.valid_weekdays(weekdays)),
  workload_hours smallint not null check (workload_hours between 1 and 2000),
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
  note text check (private.valid_note(note, 1000)),
  taken_by uuid default auth.uid() references public.profiles on delete set null,
  taken_at timestamptz not null default now(),
  unique (id, class_id),
  unique (class_id, held_on)
);

create index class_sessions_day_idx on public.class_sessions (held_on);

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
  p_unit_id uuid,
  p_name text,
  p_starts_on date,
  p_ends_on date,
  p_weekdays smallint[],
  p_workload_hours smallint,
  p_teacher_ids uuid[],
  p_grading_scheme public.grading_scheme,
  p_min_attendance smallint,
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

  teachers := array(select distinct unnest(
    coalesce(p_teacher_ids, '{}')
    || case when p_unit_id in (select private.admin_unit_ids()) then '{}'::uuid[] else array[me] end
  ));
  perform private.check_teachers(p_unit_id, teachers);

  insert into public.classes (
    id, unit_id, name, starts_on, ends_on, weekdays, workload_hours, capacity,
    grading_scheme, passing_score, concept_labels, concept_passing, min_attendance, created_by
  ) values (
    p_id, p_unit_id, btrim(p_name), p_starts_on, p_ends_on, p_weekdays, p_workload_hours, p_capacity,
    p_grading_scheme, p_passing_score, p_concept_labels, p_concept_passing, p_min_attendance, me
  );

  insert into public.class_teachers (class_id, unit_id, user_id)
  select p_id, p_unit_id, unnest(teachers);
end;
$$;

create function public.update_class(
  p_id uuid,
  p_name text,
  p_starts_on date,
  p_ends_on date,
  p_weekdays smallint[],
  p_workload_hours smallint,
  p_teacher_ids uuid[],
  p_grading_scheme public.grading_scheme,
  p_min_attendance smallint,
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
  if exists (
    select 1 from public.class_sessions s
    where s.class_id = p_id and (s.held_on < p_starts_on or s.held_on > p_ends_on)
  ) then
    raise exception 'attendance outside the period' using errcode = '23514';
  end if;

  update public.classes set
    name = btrim(p_name),
    starts_on = p_starts_on,
    ends_on = p_ends_on,
    weekdays = p_weekdays,
    workload_hours = p_workload_hours,
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
end;
$$;

alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.class_sessions enable row level security;

create policy "unit staff see classes" on public.classes
  for select to authenticated
  using (unit_id in (select private.member_unit_ids()));

create policy "unit staff see teachers" on public.class_teachers
  for select to authenticated
  using (unit_id in (select private.member_unit_ids()));

create policy "unit staff see sessions" on public.class_sessions
  for select to authenticated
  using (class_id in (select c.id from public.classes c));

grant select on public.classes to authenticated;
grant select on public.class_teachers to authenticated;
grant select on public.class_sessions to authenticated;

revoke all on function private.taught_class_ids() from public, anon;
revoke all on function private.operable_class_ids() from public, anon;
revoke all on function private.can_operate_class(uuid) from public, anon;
revoke all on function private.is_any_admin() from public, anon;
revoke all on function private.check_teachers(uuid, uuid[]) from public, anon, authenticated;
grant execute on function private.taught_class_ids() to authenticated;
grant execute on function private.operable_class_ids() to authenticated;
grant execute on function private.can_operate_class(uuid) to authenticated;
grant execute on function private.is_any_admin() to authenticated;
grant execute on function private.valid_text(text, integer) to authenticated;
grant execute on function private.valid_note(text, integer) to authenticated;
grant execute on function private.valid_grading(public.grading_scheme, numeric, text[], smallint) to authenticated;
grant execute on function private.valid_weekdays(smallint[]) to authenticated;
grant execute on function private.normalize_text(text) to authenticated;
grant execute on function private.today() to authenticated;

grant execute on function public.create_class(uuid, uuid, text, date, date, smallint[], smallint, uuid[], public.grading_scheme, smallint, smallint, numeric, text[], smallint) to authenticated;
grant execute on function public.update_class(uuid, text, date, date, smallint[], smallint, uuid[], public.grading_scheme, smallint, smallint, numeric, text[], smallint) to authenticated;
