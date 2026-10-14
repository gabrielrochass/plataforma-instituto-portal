create type public.assessment_moment as enum ('intake', 'follow_up', 'exit');
create type public.housing_kind as enum ('owned', 'rented', 'ceded', 'occupied', 'shelter', 'street', 'other');
create type public.schooling_level as enum (
  'none', 'elementary_incomplete', 'elementary', 'high_school_incomplete', 'high_school',
  'higher_incomplete', 'higher', 'postgraduate'
);
create type public.work_status as enum (
  'formal', 'informal', 'self_employed', 'unemployed', 'not_working', 'apprentice_intern'
);
create type public.race_color as enum ('white', 'black', 'brown', 'yellow', 'indigenous', 'undeclared');
create type public.gender_identity as enum (
  'woman', 'man', 'trans_woman', 'trans_man', 'non_binary', 'other', 'undeclared'
);
create type public.outcome_kind as enum (
  'employed', 'internship', 'studying', 'self_employed', 'job_seeking', 'other'
);

create domain public.benefit_list as text[]
  check (value <@ array['bolsa_familia', 'bpc', 'cadunico', 'auxilio_gas', 'tarifa_social', 'pe_de_meia', 'other']);
create domain public.disability_list as text[]
  check (value <@ array['visual', 'hearing', 'physical', 'intellectual', 'autism', 'psychosocial', 'multiple', 'other']);

create table public.social_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  assessed_on date not null check (assessed_on between '2000-01-01' and '2100-12-31'),
  moment public.assessment_moment not null,
  neighborhood text check (private.valid_text(neighborhood, 80)),
  city text check (private.valid_text(city, 80)),
  household_size smallint check (household_size between 1 and 30),
  household_income_cents bigint check (household_income_cents between 0 and 99999999999),
  housing public.housing_kind,
  benefits public.benefit_list not null default '{}',
  has_internet boolean,
  has_computer boolean,
  schooling public.schooling_level,
  studying_now boolean,
  work public.work_status,
  gender public.gender_identity,
  race_color public.race_color,
  disability public.disability_list,
  health_notes text check (private.valid_note(health_notes, 1000)),
  notes text check (private.valid_note(notes, 4000)),
  author_id uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, assessed_on)
);

create index social_profiles_student_idx on public.social_profiles (student_id, assessed_on desc);

create table public.alumni_outcomes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students on delete cascade,
  kind public.outcome_kind not null,
  observed_on date not null check (observed_on between '2000-01-01' and '2100-12-31'),
  formal_job boolean,
  related_to_course boolean,
  organization text check (private.valid_text(organization, 120)),
  note text check (private.valid_note(note, 500)),
  author_id uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create index alumni_outcomes_student_idx on public.alumni_outcomes (student_id, observed_on desc);

alter table public.students add column anonymized_at timestamptz;

create table private.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  action text not null check (action in ('insert', 'update', 'delete', 'read', 'export', 'anonymize')),
  table_name text not null,
  row_id text,
  student_id uuid,
  columns text[]
);

create index audit_log_student_idx on private.audit_log (student_id, at desc) where student_id is not null;

create function private.log_access(p_action text, p_table text, p_student_id uuid, p_row_id text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.audit_log (actor_id, action, table_name, row_id, student_id)
  values ((select auth.uid()), p_action, p_table, p_row_id, p_student_id)
$$;

create function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  new_row jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  student uuid := coalesce(new_row, old_row) ->> tg_argv[0];
  changed text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(key order by key) into changed
    from jsonb_each(new_row) n
    where n.value is distinct from old_row -> n.key and n.key not in ('updated_at', 'name_norm');
    if changed is null then
      return new;
    end if;
  end if;
  insert into private.audit_log (actor_id, action, table_name, row_id, student_id, columns)
  values ((select auth.uid()), lower(tg_op), tg_table_name, coalesce(new_row, old_row) ->> 'id', student, changed);
  return coalesce(new, old);
end;
$$;

create trigger social_profiles_audit after insert or update or delete on public.social_profiles
  for each row execute function private.audit_row('student_id');
create trigger alumni_outcomes_audit after insert or update or delete on public.alumni_outcomes
  for each row execute function private.audit_row('student_id');
create trigger consents_audit after insert or update on public.consents
  for each row execute function private.audit_row('student_id');
create trigger students_audit after update on public.students
  for each row execute function private.audit_row('id');

create function private.social_profiles_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.race_color is not null and new.race_color <> 'undeclared'
      or cardinality(new.disability) > 0 or new.health_notes is not null)
    and not exists (
      select 1 from public.consents c
      where c.student_id = new.student_id and c.kind = 'sensitive_data' and c.revoked_on is null
    ) then
    raise exception 'sensitive data needs consent' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger social_profiles_before_write before insert or update on public.social_profiles
  for each row execute function private.social_profiles_before_write();

create function private.social_profiles_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.students
  set last_assessed_on = (select max(assessed_on) from public.social_profiles where student_id = coalesce(new.student_id, old.student_id))
  where id = coalesce(new.student_id, old.student_id);
  return null;
end;
$$;

create trigger social_profiles_after_write after insert or update or delete on public.social_profiles
  for each row execute function private.social_profiles_after_write();

create function private.consents_after_revoke()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'sensitive_data' and new.revoked_on is not null and old.revoked_on is null then
    update public.social_profiles
    set race_color = null, disability = null, health_notes = null
    where student_id = new.student_id;
  end if;
  return new;
end;
$$;

create trigger consents_after_revoke after update of revoked_on on public.consents
  for each row execute function private.consents_after_revoke();

create function public.student_social_profiles(p_student_id uuid)
returns setof public.social_profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.log_access('read', 'social_profiles', p_student_id);
  return query
    select * from public.social_profiles where student_id = p_student_id order by assessed_on desc;
end;
$$;

create function public.student_alumni_outcomes(p_student_id uuid)
returns setof public.alumni_outcomes
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.log_access('read', 'alumni_outcomes', p_student_id);
  return query
    select * from public.alumni_outcomes where student_id = p_student_id order by observed_on desc;
end;
$$;

create function public.student_access_log(p_student_id uuid)
returns table (at timestamptz, actor text, action text, table_name text, columns text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select l.at, coalesce(p.display_name, ''), l.action, l.table_name, l.columns
    from private.audit_log l
    left join public.profiles p on p.id = l.actor_id
    where l.student_id = p_student_id
    order by l.at desc
    limit 50;
end;
$$;

create function public.export_student_data(p_student_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  perform private.log_access('export', 'students', p_student_id);
  select jsonb_build_object(
    'aluno', (select to_jsonb(s) - 'name_norm' - 'user_id' from public.students s where s.id = p_student_id),
    'responsaveis', coalesce((select jsonb_agg(to_jsonb(g) - 'student_id') from public.guardians g where g.student_id = p_student_id), '[]'),
    'termos', coalesce((select jsonb_agg(to_jsonb(c) - 'student_id') from public.consents c where c.student_id = p_student_id), '[]'),
    'sala_de_aula', (select to_jsonb(c) - 'student_id' from public.student_care c where c.student_id = p_student_id),
    'matriculas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'turma', cl.name, 'situacao', e.status, 'inicio', e.enrolled_on, 'fim', e.ended_on,
        'frequencia', e.attendance_pct, 'media_final', e.final_score, 'conceito_final', e.final_concept,
        'presencas', (select count(*) from public.attendance_records a where a.enrollment_id = e.id and a.status = 'present'),
        'faltas', (select count(*) from public.attendance_records a where a.enrollment_id = e.id and a.status = 'absent')
      ) order by e.enrolled_on)
      from public.enrollments e
      join public.classes cl on cl.id = e.class_id
      where e.student_id = p_student_id
    ), '[]'),
    'acompanhamento', coalesce((select jsonb_agg(jsonb_build_object('tipo', n.kind, 'data', n.happened_on, 'texto', n.body) order by n.happened_on) from public.case_notes n where n.student_id = p_student_id), '[]'),
    'fichas_sociais', coalesce((select jsonb_agg(to_jsonb(f) - 'student_id' - 'author_id' order by f.assessed_on) from public.social_profiles f where f.student_id = p_student_id), '[]'),
    'egressos', coalesce((select jsonb_agg(to_jsonb(o) - 'student_id' - 'author_id' order by o.observed_on) from public.alumni_outcomes o where o.student_id = p_student_id), '[]')
  ) into result;
  return result;
end;
$$;

create or replace function private.guardians_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.students s
    join public.enrollments e on e.student_id = s.id and e.status = 'active'
    where s.id = old.student_id and s.anonymized_at is null
      and s.birth_date > (private.today() - interval '18 years')::date
  ) and not exists (
    select 1 from public.guardians g where g.student_id = old.student_id and g.id <> old.id
  ) then
    raise exception 'a minor needs a guardian' using errcode = '23514';
  end if;
  return old;
end;
$$;

create function public.anonymize_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin_geral()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.students set
    full_name = 'Pessoa anonimizada',
    social_name = null,
    birth_date = make_date(extract(year from birth_date)::integer, 1, 1),
    cpf = null, phone = null, email = null, user_id = null,
    anonymized_at = now()
  where id = p_student_id and anonymized_at is null;
  if not found then
    raise exception 'student unavailable' using errcode = '22023';
  end if;
  delete from public.guardians where student_id = p_student_id;
  delete from public.social_profiles where student_id = p_student_id;
  delete from public.alumni_outcomes where student_id = p_student_id;
  delete from public.case_notes where student_id = p_student_id;
  update public.student_care set accessibility = '{}', accessibility_notes = null, notes_for_teachers = null
  where student_id = p_student_id;
  update public.enrollment_requests set full_name = 'Pessoa anonimizada', social_name = null, phone = '81900000000',
    email = null, neighborhood = null, guardian_name = null, guardian_phone = null
  where student_id = p_student_id;
  update private.audit_log set columns = null where student_id = p_student_id;
  perform private.log_access('anonymize', 'students', p_student_id);
end;
$$;

create function private.purge_expired()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.enrollment_requests
  where (status in ('declined', 'withdrawn') and coalesce(decided_at, created_at) < now() - interval '180 days')
     or (status in ('pending', 'waitlisted') and created_at < now() - interval '1 year');
  delete from private.rate_limits where window_start < now() - interval '2 days';
  delete from private.staff_invites where coalesce(accepted_at, revoked_at, expires_at) < now() - interval '90 days';
  delete from private.password_resets where expires_at < now() - interval '30 days';
$$;

drop function public.student_private(uuid);

create function public.student_private(p_student_id uuid)
returns table (cpf text, anonymized boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    return;
  end if;
  perform private.log_access('read', 'students.cpf', p_student_id);
  return query select s.cpf, s.anonymized_at is not null from public.students s where s.id = p_student_id;
end;
$$;

alter table public.social_profiles enable row level security;
alter table public.alumni_outcomes enable row level security;

create function public.save_social_profile(p_student_id uuid, p_profile jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data public.social_profiles;
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  row_data := jsonb_populate_record(null::public.social_profiles, p_profile);
  insert into public.social_profiles (
    student_id, assessed_on, moment, neighborhood, city, household_size, household_income_cents, housing, benefits,
    has_internet, has_computer, schooling, studying_now, work, gender, race_color, disability, health_notes, notes, author_id
  ) values (
    p_student_id, row_data.assessed_on, row_data.moment, row_data.neighborhood, row_data.city, row_data.household_size,
    row_data.household_income_cents, row_data.housing, coalesce(row_data.benefits, '{}'), row_data.has_internet,
    row_data.has_computer, row_data.schooling, row_data.studying_now, row_data.work, row_data.gender, row_data.race_color,
    row_data.disability, row_data.health_notes, row_data.notes, (select auth.uid())
  )
  on conflict (student_id, assessed_on) do update set
    moment = excluded.moment, neighborhood = excluded.neighborhood, city = excluded.city,
    household_size = excluded.household_size, household_income_cents = excluded.household_income_cents,
    housing = excluded.housing, benefits = excluded.benefits, has_internet = excluded.has_internet,
    has_computer = excluded.has_computer, schooling = excluded.schooling, studying_now = excluded.studying_now,
    work = excluded.work, gender = excluded.gender, race_color = excluded.race_color,
    disability = excluded.disability, health_notes = excluded.health_notes, notes = excluded.notes,
    author_id = excluded.author_id;
end;
$$;

create function public.add_alumni_outcome(
  p_student_id uuid,
  p_kind public.outcome_kind,
  p_observed_on date,
  p_formal_job boolean default null,
  p_related_to_course boolean default null,
  p_organization text default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not ((select private.is_admin_geral()) or p_student_id in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.alumni_outcomes (student_id, kind, observed_on, formal_job, related_to_course, organization, note)
  values (p_student_id, p_kind, p_observed_on, p_formal_job, p_related_to_course,
    nullif(btrim(p_organization), ''), nullif(btrim(p_note), ''));
end;
$$;

create function public.remove_alumni_outcome(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  student uuid;
begin
  select student_id into student from public.alumni_outcomes where id = p_id;
  if student is null or not ((select private.is_admin_geral()) or student in (select private.social_student_ids())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from public.alumni_outcomes where id = p_id;
end;
$$;


revoke all on function private.log_access(text, text, uuid, text) from public, anon, authenticated;
revoke all on function private.audit_row() from public, anon, authenticated;
revoke all on function private.social_profiles_before_write() from public, anon, authenticated;
revoke all on function private.social_profiles_after_write() from public, anon, authenticated;
revoke all on function private.consents_after_revoke() from public, anon, authenticated;
revoke all on function private.purge_expired() from public, anon, authenticated;

grant execute on function public.student_social_profiles(uuid) to authenticated;
grant execute on function public.student_alumni_outcomes(uuid) to authenticated;
grant execute on function public.student_access_log(uuid) to authenticated;
grant execute on function public.export_student_data(uuid) to authenticated;
grant execute on function public.anonymize_student(uuid) to authenticated;
grant execute on function public.student_private(uuid) to authenticated;
grant execute on function public.save_social_profile(uuid, jsonb) to authenticated;
grant execute on function public.add_alumni_outcome(uuid, public.outcome_kind, date, boolean, boolean, text, text) to authenticated;
grant execute on function public.remove_alumni_outcome(uuid) to authenticated;
