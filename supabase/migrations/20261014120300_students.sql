create type public.guardian_relationship as enum (
  'mother', 'father', 'grandparent', 'sibling', 'aunt_uncle', 'legal_guardian', 'other'
);
create type public.consent_kind as enum ('data_processing', 'image_use', 'sensitive_data');
create type public.enrollment_status as enum (
  'active', 'completed', 'failed', 'transferred', 'dropped_out', 'cancelled'
);
create type public.exit_reason as enum (
  'work', 'schedule', 'moved', 'health', 'family', 'transport', 'financial',
  'lost_interest', 'no_contact', 'level', 'class_cancelled', 'other'
);

create domain public.accessibility_list as text[]
  check (value <@ array['visual', 'hearing', 'physical', 'intellectual', 'autism', 'adhd', 'other']);

create function private.valid_cpf(value text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits integer[];
  first_check integer;
  second_check integer;
begin
  if value is null then
    return true;
  end if;
  if value !~ '^\d{11}$' or value ~ '^(\d)\1{10}$' then
    return false;
  end if;
  digits := array(select substr(value, position, 1)::integer from generate_series(1, 11) position);
  first_check := (select sum(digits[position] * (11 - position)) from generate_series(1, 9) position) * 10 % 11;
  second_check := (select sum(digits[position] * (12 - position)) from generate_series(1, 10) position) * 10 % 11;
  return (first_check % 10) = digits[10] and (second_check % 10) = digits[11];
end;
$$;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (private.valid_text(full_name, 120)),
  social_name text check (private.valid_text(social_name, 120)),
  name_norm text not null default '',
  birth_date date not null check (birth_date between '1900-01-01' and '2100-12-31'),
  cpf text check (private.valid_cpf(cpf)),
  phone text check (phone ~ '^[1-9]{2}9?\d{8}$'),
  email text check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  registered_unit_id uuid not null references public.units,
  last_assessed_on date,
  user_id uuid unique references auth.users on delete set null,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index students_cpf_key on public.students (cpf) where cpf is not null;
create index students_unit_idx on public.students (registered_unit_id);
create index students_name_idx on public.students using gin (name_norm extensions.gin_trgm_ops);

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  full_name text not null check (private.valid_text(full_name, 120)),
  relationship public.guardian_relationship not null,
  phone text not null check (phone ~ '^[1-9]{2}9?\d{8}$'),
  is_whatsapp boolean not null default true,
  created_at timestamptz not null default now()
);

create index guardians_student_idx on public.guardians (student_id, created_at);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  kind public.consent_kind not null,
  signed_on date not null check (signed_on between '2000-01-01' and '2100-12-31'),
  revoked_on date,
  recorded_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  check (revoked_on >= signed_on)
);

create unique index consents_active_key on public.consents (student_id, kind) where revoked_on is null;

create table public.student_care (
  student_id uuid primary key references public.students on delete cascade,
  accessibility public.accessibility_list not null default '{}',
  accessibility_notes text check (private.valid_note(accessibility_notes, 500)),
  notes_for_teachers text check (private.valid_note(notes_for_teachers, 1000)),
  updated_by uuid default auth.uid() references public.profiles on delete set null,
  updated_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students,
  class_id uuid not null references public.classes,
  status public.enrollment_status not null default 'active',
  enrolled_on date not null default private.today() check (enrolled_on between '2000-01-01' and '2100-12-31'),
  ended_on date,
  exit_reason public.exit_reason,
  exit_note text check (private.valid_note(exit_note, 500)),
  transferred_to_id uuid unique references public.enrollments,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, class_id),
  check (ended_on >= enrolled_on),
  check ((status = 'active') = (ended_on is null)),
  check ((status = 'transferred') = (transferred_to_id is not null)),
  check (status not in ('dropped_out', 'cancelled') or exit_reason is not null),
  check (transferred_to_id <> id)
);

create unique index enrollments_active_key on public.enrollments (student_id, class_id) where status = 'active';
create index enrollments_class_idx on public.enrollments (class_id, status);
create index enrollments_student_idx on public.enrollments (student_id);

create function private.students_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name_norm := private.normalize_text(concat_ws(' ', new.social_name, new.full_name));
  new.updated_at := now();
  return new;
end;
$$;

create trigger students_before_write before insert or update on public.students
  for each row execute function private.students_before_write();

create trigger enrollments_touch before update on public.enrollments
  for each row execute function private.touch_updated_at();

create function private.visible_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.student_id from public.enrollments e where e.class_id in (select private.operable_class_ids())
  union
  select s.id from public.students s
  where s.registered_unit_id in (select private.admin_unit_ids())
    or s.created_by = (select private.active_user_id())
$$;

create function private.current_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.student_id from public.enrollments e
  where e.status = 'active' and e.class_id in (select private.operable_class_ids())
$$;

create function private.social_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.student_id from public.enrollments e
  join public.classes c on c.id = e.class_id
  where c.unit_id in (select private.admin_unit_ids())
  union
  select s.id from public.students s where s.registered_unit_id in (select private.admin_unit_ids())
$$;

create function private.can_see_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin_geral()) or p_student_id in (select private.visible_student_ids())
$$;

create function private.enrollments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
  birth date;
begin
  perform pg_advisory_xact_lock(hashtextextended('enrollments' || new.class_id::text, 0));
  select * into class_row from public.classes where id = new.class_id;
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  if new.enrolled_on > class_row.ends_on then
    raise exception 'class already ended' using errcode = '23514';
  end if;
  if class_row.capacity is not null and (
    select count(*) from public.enrollments e where e.class_id = new.class_id and e.status = 'active'
  ) >= class_row.capacity then
    raise exception 'class is full' using errcode = '54000';
  end if;
  select birth_date into birth from public.students where id = new.student_id;
  if birth > (new.enrolled_on - interval '18 years')::date
    and not exists (select 1 from public.guardians g where g.student_id = new.student_id) then
    raise exception 'a minor needs a guardian' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enrollments_before_insert before insert on public.enrollments
  for each row execute function private.enrollments_before_insert();

create function private.guardians_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.students s
    join public.enrollments e on e.student_id = s.id and e.status = 'active'
    where s.id = old.student_id and s.birth_date > (private.today() - interval '18 years')::date
  ) and not exists (
    select 1 from public.guardians g where g.student_id = old.student_id and g.id <> old.id
  ) then
    raise exception 'a minor needs a guardian' using errcode = '23514';
  end if;
  return old;
end;
$$;

create trigger guardians_before_delete before delete on public.guardians
  for each row execute function private.guardians_before_delete();

create function private.students_cpf_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.cpf is distinct from old.cpf
    and not (select private.is_admin_geral())
    and new.id not in (select private.social_student_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger students_cpf_guard before update of cpf on public.students
  for each row execute function private.students_cpf_guard();

create function public.register_student(
  p_id uuid,
  p_full_name text,
  p_birth_date date,
  p_guardians jsonb,
  p_accessibility public.accessibility_list,
  p_consents public.consent_kind[],
  p_social_name text default null,
  p_cpf text default null,
  p_phone text default null,
  p_email text default null,
  p_unit_id uuid default null,
  p_accessibility_notes text default null,
  p_notes_for_teachers text default null,
  p_class_id uuid default null,
  p_enrollment_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  unit uuid := p_unit_id;
begin
  if p_class_id is not null then
    if not private.can_operate_class(p_class_id) then
      raise exception 'not allowed' using errcode = '42501';
    end if;
    select unit_id into unit from public.classes where id = p_class_id;
  elsif p_unit_id not in (select private.member_unit_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.students where id = p_id) then
    return;
  end if;

  insert into public.students (id, full_name, social_name, birth_date, cpf, phone, email, registered_unit_id, created_by)
  values (
    p_id, btrim(p_full_name), nullif(btrim(p_social_name), ''), p_birth_date, p_cpf, p_phone,
    nullif(lower(btrim(p_email)), ''), unit, (select auth.uid())
  );

  insert into public.guardians (student_id, full_name, relationship, phone, is_whatsapp)
  select p_id, btrim(g.full_name), g.relationship, g.phone, coalesce(g.is_whatsapp, true)
  from jsonb_to_recordset(coalesce(p_guardians, '[]')) as g (
    full_name text, relationship public.guardian_relationship, phone text, is_whatsapp boolean
  );

  insert into public.student_care (student_id, accessibility, accessibility_notes, notes_for_teachers)
  values (p_id, coalesce(p_accessibility, '{}'), p_accessibility_notes, p_notes_for_teachers);

  insert into public.consents (student_id, kind, signed_on)
  select p_id, kind, private.today() from unnest(coalesce(p_consents, '{}')) kind;

  if p_class_id is not null then
    insert into public.enrollments (id, student_id, class_id) values (p_enrollment_id, p_id, p_class_id);
  end if;
end;
$$;

create function public.find_students(p_query text)
returns table (
  id uuid,
  display_name text,
  birth_year integer,
  unit_code text,
  visible boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized text := private.normalize_text(p_query);
  digits text := regexp_replace(coalesce(p_query, ''), '\D', '', 'g');
begin
  if not (select private.is_staff()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if char_length(coalesce(normalized, '')) < 3 and char_length(digits) <> 11 then
    raise exception 'query too short' using errcode = '22023';
  end if;

  return query
  select s.id, coalesce(s.social_name, s.full_name), extract(year from s.birth_date)::integer, u.code,
    private.can_see_student(s.id)
  from public.students s
  join public.units u on u.id = s.registered_unit_id
  where (char_length(digits) = 11 and s.cpf = digits)
    or (
      normalized is not null and char_length(normalized) >= 3
      and not exists (
        select 1 from unnest(string_to_array(normalized, ' ')) word
        where s.name_norm not like '%' || word || '%'
      )
    )
  order by s.full_name
  limit 10;
end;
$$;

create function public.enroll_student(p_enrollment_id uuid, p_student_id uuid, p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can_operate_class(p_class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.enrollments where id = p_enrollment_id) then
    return;
  end if;
  insert into public.enrollments (id, student_id, class_id) values (p_enrollment_id, p_student_id, p_class_id);
end;
$$;

create function public.transfer_enrollment(
  p_enrollment_id uuid,
  p_new_enrollment_id uuid,
  p_to_class_id uuid,
  p_on date,
  p_reason public.exit_reason
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  source public.enrollments;
begin
  select * into source from public.enrollments where id = p_enrollment_id for update;
  if not found
    or not private.can_operate_class(source.class_id)
    or not private.can_operate_class(p_to_class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if source.transferred_to_id = p_new_enrollment_id then
    return;
  end if;
  if source.status <> 'active' then
    raise exception 'enrollment closed' using errcode = '55000';
  end if;
  if p_to_class_id = source.class_id or p_on < source.enrolled_on then
    raise exception 'invalid transfer' using errcode = '22023';
  end if;

  insert into public.enrollments (id, student_id, class_id, enrolled_on)
  values (p_new_enrollment_id, source.student_id, p_to_class_id, p_on);

  update public.enrollments
  set status = 'transferred', ended_on = p_on, exit_reason = p_reason, transferred_to_id = p_new_enrollment_id
  where id = p_enrollment_id;
end;
$$;

create function public.end_enrollment(
  p_enrollment_id uuid,
  p_status public.enrollment_status,
  p_reason public.exit_reason,
  p_on date,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  source public.enrollments;
begin
  select * into source from public.enrollments where id = p_enrollment_id for update;
  if not found or not private.can_operate_class(source.class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_status not in ('dropped_out', 'cancelled') or p_reason is null or p_on < source.enrolled_on then
    raise exception 'invalid exit' using errcode = '22023';
  end if;
  if source.status <> 'active' then
    raise exception 'enrollment closed' using errcode = '55000';
  end if;

  update public.enrollments
  set status = p_status, ended_on = p_on, exit_reason = p_reason, exit_note = nullif(btrim(p_note), '')
  where id = p_enrollment_id;
end;
$$;

create function public.reopen_enrollment(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  source public.enrollments;
begin
  select * into source from public.enrollments where id = p_enrollment_id for update;
  if not found or not private.can_operate_class(source.class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if source.status not in ('dropped_out', 'cancelled') or source.updated_at < now() - interval '1 hour' then
    raise exception 'cannot reopen' using errcode = '55000';
  end if;
  update public.enrollments
  set status = 'active', ended_on = null, exit_reason = null, exit_note = null
  where id = p_enrollment_id;
end;
$$;

create function public.cancel_class(p_class_id uuid)
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
  if class_row.status <> 'open' then
    raise exception 'class closed' using errcode = '55000';
  end if;
  update public.enrollments
  set status = 'cancelled', ended_on = greatest(private.today(), enrolled_on), exit_reason = 'class_cancelled'
  where class_id = p_class_id and status = 'active';
  delete from public.class_sessions where class_id = p_class_id and held_on >= private.today();
  update public.classes set status = 'cancelled' where id = p_class_id;
end;
$$;

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
  operable boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.name, co.name, u.code, e.status, e.enrolled_on, e.ended_on, e.exit_reason,
    tc.name, private.can_operate_class(c.id)
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  join public.courses co on co.id = c.course_id
  join public.units u on u.id = c.unit_id
  left join public.enrollments t on t.id = e.transferred_to_id
  left join public.classes tc on tc.id = t.class_id
  where private.can_see_student(p_student_id) and e.student_id = p_student_id
  order by e.enrolled_on desc, e.created_at desc
$$;

create function public.student_private(p_student_id uuid)
returns table (cpf text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.cpf from public.students s
  where s.id = p_student_id
    and ((select private.is_admin_geral()) or s.id in (select private.social_student_ids()))
$$;

alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.consents enable row level security;
alter table public.student_care enable row level security;
alter table public.enrollments enable row level security;

create policy "staff see their students" on public.students
  for select to authenticated
  using ((select private.is_admin_geral()) or id in (select private.visible_student_ids()));
create policy "staff edit their students" on public.students
  for update to authenticated
  using ((select private.is_admin_geral()) or id in (select private.visible_student_ids()))
  with check ((select private.is_admin_geral()) or id in (select private.visible_student_ids()));

create policy "staff see guardians" on public.guardians
  for select to authenticated
  using ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));
create policy "staff add guardians" on public.guardians
  for insert to authenticated
  with check ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));
create policy "staff edit guardians" on public.guardians
  for update to authenticated
  using ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()))
  with check ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));
create policy "staff remove guardians" on public.guardians
  for delete to authenticated
  using ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));

create policy "staff see consents" on public.consents
  for select to authenticated
  using ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));
create policy "staff record consents" on public.consents
  for insert to authenticated
  with check ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));
create policy "admins revoke consents" on public.consents
  for update to authenticated
  using ((select private.is_admin_geral()) or student_id in (select private.social_student_ids()))
  with check ((select private.is_admin_geral()) or student_id in (select private.social_student_ids()));

create policy "teachers see care of current students" on public.student_care
  for select to authenticated
  using (
    (select private.is_admin_geral())
    or student_id in (select private.current_student_ids())
    or student_id in (select private.social_student_ids())
  );
create policy "staff edit care" on public.student_care
  for update to authenticated
  using ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()))
  with check ((select private.is_admin_geral()) or student_id in (select private.visible_student_ids()));

create policy "staff see enrollments" on public.enrollments
  for select to authenticated
  using (
    (select private.is_admin_geral())
    or class_id in (select private.operable_class_ids())
    or student_id in (select private.social_student_ids())
  );

grant select (
  id, full_name, social_name, birth_date, phone, email, registered_unit_id, last_assessed_on,
  created_by, created_at, updated_at
) on public.students to authenticated;
grant update (full_name, social_name, birth_date, phone, email, cpf) on public.students to authenticated;
grant select, delete on public.guardians to authenticated;
grant insert (id, student_id, full_name, relationship, phone, is_whatsapp) on public.guardians to authenticated;
grant update (full_name, relationship, phone, is_whatsapp) on public.guardians to authenticated;
grant select on public.consents to authenticated;
grant insert (id, student_id, kind, signed_on) on public.consents to authenticated;
grant update (revoked_on) on public.consents to authenticated;
grant select on public.student_care to authenticated;
grant update (accessibility, accessibility_notes, notes_for_teachers) on public.student_care to authenticated;
grant select on public.enrollments to authenticated;

revoke all on function private.visible_student_ids() from public, anon;
revoke all on function private.current_student_ids() from public, anon;
revoke all on function private.social_student_ids() from public, anon;
revoke all on function private.can_see_student(uuid) from public, anon;
revoke all on function private.enrollments_before_insert() from public, anon, authenticated;
revoke all on function private.guardians_before_delete() from public, anon, authenticated;
revoke all on function private.students_cpf_guard() from public, anon, authenticated;
grant execute on function private.visible_student_ids() to authenticated;
grant execute on function private.current_student_ids() to authenticated;
grant execute on function private.social_student_ids() to authenticated;
grant execute on function private.can_see_student(uuid) to authenticated;
grant execute on function private.valid_cpf(text) to authenticated;

grant execute on function public.register_student(uuid, text, date, jsonb, public.accessibility_list, public.consent_kind[], text, text, text, text, uuid, text, text, uuid, uuid) to authenticated;
grant execute on function public.find_students(text) to authenticated;
grant execute on function public.enroll_student(uuid, uuid, uuid) to authenticated;
grant execute on function public.transfer_enrollment(uuid, uuid, uuid, date, public.exit_reason) to authenticated;
grant execute on function public.end_enrollment(uuid, public.enrollment_status, public.exit_reason, date, text) to authenticated;
grant execute on function public.reopen_enrollment(uuid) to authenticated;
grant execute on function public.cancel_class(uuid) to authenticated;
grant execute on function public.student_timeline(uuid) to authenticated;
grant execute on function public.student_private(uuid) to authenticated;

create function public.class_list(p_class_id uuid default null)
returns table (
  id uuid,
  name text,
  course_id uuid,
  course_name text,
  workload_hours smallint,
  unit_id uuid,
  unit_code text,
  unit_name text,
  starts_on date,
  ends_on date,
  schedule jsonb,
  capacity smallint,
  status public.class_status,
  grading_scheme public.grading_scheme,
  passing_score numeric,
  concept_labels text[],
  concept_passing smallint,
  min_attendance smallint,
  active_count integer,
  teacher_ids uuid[],
  teacher_names text[],
  operable boolean,
  manageable boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, co.id, co.name, co.workload_hours, u.id, u.code, u.name, c.starts_on, c.ends_on, c.schedule,
    c.capacity, c.status, c.grading_scheme, c.passing_score, c.concept_labels, c.concept_passing, c.min_attendance,
    (select count(*)::integer from public.enrollments e where e.class_id = c.id and e.status = 'active'),
    coalesce((select array_agg(t.user_id order by p.display_name) from public.class_teachers t
      join public.profiles p on p.id = t.user_id where t.class_id = c.id), '{}'),
    coalesce((select array_agg(coalesce(p.display_name, '') order by p.display_name) from public.class_teachers t
      join public.profiles p on p.id = t.user_id where t.class_id = c.id), '{}'),
    private.can_operate_class(c.id),
    c.unit_id in (select private.admin_unit_ids())
  from public.classes c
  join public.courses co on co.id = c.course_id
  join public.units u on u.id = c.unit_id
  where c.unit_id in (select private.member_unit_ids())
    and (p_class_id is null or c.id = p_class_id)
  order by c.status, c.starts_on desc, c.name
$$;

create function public.student_list(
  p_query text default null,
  p_unit_id uuid default null,
  p_situation text default 'active'
)
returns table (
  id uuid,
  full_name text,
  social_name text,
  birth_date date,
  unit_code text,
  active_count integer,
  social_pending boolean,
  needs_accessibility boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible as (
    select s.* from public.students s
    where (select private.is_admin_geral()) or s.id in (select private.visible_student_ids())
  )
  select s.id, s.full_name, s.social_name, s.birth_date, u.code,
    (select count(*)::integer from public.enrollments e where e.student_id = s.id and e.status = 'active'),
    s.last_assessed_on is null,
    exists (select 1 from public.student_care c where c.student_id = s.id and cardinality(c.accessibility) > 0)
  from visible s
  join public.units u on u.id = s.registered_unit_id
  where (p_unit_id is null or s.registered_unit_id = p_unit_id
      or exists (select 1 from public.enrollments e join public.classes c on c.id = e.class_id
        where e.student_id = s.id and c.unit_id = p_unit_id))
    and (
      p_situation = 'all'
      or (p_situation = 'pending' and s.last_assessed_on is null)
      or (p_situation = 'active' and exists (
        select 1 from public.enrollments e where e.student_id = s.id and e.status = 'active'))
    )
    and (
      private.normalize_text(p_query) is null
      or regexp_replace(coalesce(p_query, ''), '\D', '', 'g') = s.cpf
      or not exists (
        select 1 from unnest(string_to_array(private.normalize_text(p_query), ' ')) word
        where s.name_norm not like '%' || word || '%'
      )
    )
  order by coalesce(s.social_name, s.full_name)
  limit 300
$$;

grant execute on function public.class_list(uuid) to authenticated;
grant execute on function public.student_list(text, uuid, text) to authenticated;
