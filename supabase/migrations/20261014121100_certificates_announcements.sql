create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$'),
  enrollment_id uuid not null references public.enrollments,
  class_id uuid not null references public.classes,
  student_id uuid not null references public.students,
  student_name text not null check (private.valid_text(student_name, 120)),
  course_name text not null check (private.valid_text(course_name, 80)),
  unit_name text not null check (private.valid_text(unit_name, 80)),
  workload_hours smallint not null,
  starts_on date not null,
  ends_on date not null,
  attendance_pct numeric(5, 2),
  issued_on date not null default private.today(),
  issued_by uuid default auth.uid() references public.profiles on delete set null,
  revoked_at timestamptz,
  revoke_reason text check (private.valid_text(revoke_reason, 200)),
  created_at timestamptz not null default now(),
  check ((revoked_at is null) = (revoke_reason is null))
);

create unique index certificates_enrollment_key on public.certificates (enrollment_id) where revoked_at is null;
create index certificates_class_idx on public.certificates (class_id);

alter table public.certificates enable row level security;

create policy "class staff see certificates" on public.certificates
  for select to authenticated
  using ((select private.is_admin_geral()) or class_id in (select private.operable_class_ids()));

grant select on public.certificates to authenticated;

create function private.certificate_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select substr(code, 1, 4) || '-' || substr(code, 5, 4) || '-' || substr(code, 9, 4)
  from (select private.random_code(12) as code) generated
$$;

create function public.issue_certificates(p_class_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_row public.classes;
  issued integer;
begin
  select * into class_row from public.classes where id = p_class_id;
  if class_row.id is null or class_row.unit_id not in (select private.admin_unit_ids()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if class_row.status <> 'finished' then
    raise exception 'class not finished' using errcode = '55000';
  end if;
  insert into public.certificates (
    code, enrollment_id, class_id, student_id, student_name, course_name, unit_name,
    workload_hours, starts_on, ends_on, attendance_pct
  )
  select private.certificate_code(), e.id, class_row.id, s.id, coalesce(s.social_name, s.full_name), co.name, u.name,
    co.workload_hours, class_row.starts_on, class_row.ends_on, e.attendance_pct
  from public.enrollments e
  join public.students s on s.id = e.student_id
  join public.courses co on co.id = class_row.course_id
  join public.units u on u.id = class_row.unit_id
  where e.class_id = class_row.id and e.status = 'completed' and s.anonymized_at is null
    and not exists (
      select 1 from public.certificates c where c.enrollment_id = e.id and c.revoked_at is null
    );
  get diagnostics issued = row_count;
  return issued;
end;
$$;

create function public.revoke_certificate(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.certificates c set revoked_at = now(), revoke_reason = btrim(p_reason)
  where c.id = p_id and c.revoked_at is null
    and c.class_id in (select cl.id from public.classes cl where cl.unit_id in (select private.admin_unit_ids()));
  if not found then
    raise exception 'certificate unavailable' using errcode = '22023';
  end if;
end;
$$;

create function public.verify_certificate(p_code text)
returns table (
  student_name text,
  course_name text,
  unit_name text,
  workload_hours smallint,
  starts_on date,
  ends_on date,
  issued_on date,
  revoked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.student_name, c.course_name, c.unit_name, c.workload_hours, c.starts_on, c.ends_on, c.issued_on,
    c.revoked_at is not null
  from public.certificates c
  where c.code = (
    select substr(clean, 1, 4) || '-' || substr(clean, 5, 4) || '-' || substr(clean, 9, 4)
    from (select regexp_replace(upper(coalesce(p_code, '')), '[^0-9A-Z]', '', 'g') as clean) normalized
    where length(clean) = 12
  )
$$;

create or replace function public.anonymize_student(p_student_id uuid)
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
  update public.certificates set student_name = 'Pessoa anonimizada',
    revoked_at = coalesce(revoked_at, now()),
    revoke_reason = coalesce(revoke_reason, 'Dados excluídos a pedido do titular')
  where student_id = p_student_id;
  update private.audit_log set columns = null where student_id = p_student_id;
  perform private.log_access('anonymize', 'students', p_student_id);
end;
$$;

create type public.announcement_audience as enum ('everyone', 'unit', 'class');

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (private.valid_text(title, 120)),
  body text not null check (private.valid_note(body, 4000)),
  audience public.announcement_audience not null,
  unit_id uuid references public.units,
  class_id uuid references public.classes,
  expires_on date check (expires_on between '2000-01-01' and '2100-12-31'),
  author_id uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  check (
    (audience = 'everyone' and unit_id is null and class_id is null)
    or (audience = 'unit' and unit_id is not null and class_id is null)
    or (audience = 'class' and unit_id is null and class_id is not null)
  )
);

create index announcements_created_idx on public.announcements (created_at desc) where archived_at is null;

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

create function private.visible_announcement_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id from public.announcements a
  where a.archived_at is null
    and (a.expires_on is null or a.expires_on >= private.today())
    and (select private.is_staff())
    and (
      a.audience = 'everyone'
      or a.unit_id in (select private.member_unit_ids())
      or a.class_id in (select private.operable_class_ids())
      or a.author_id = (select private.active_user_id())
    )
$$;

create function private.manages_announcement(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.announcements a
    left join public.classes c on c.id = a.class_id
    where a.id = p_id and (
      a.author_id = (select private.active_user_id())
      or (select private.is_admin_geral())
      or coalesce(a.unit_id, c.unit_id) in (select private.admin_unit_ids())
    )
  )
$$;

create policy "staff see their announcements" on public.announcements
  for select to authenticated
  using (id in (select private.visible_announcement_ids()));

create policy "people see their reads" on public.announcement_reads
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.announcements to authenticated;
grant select on public.announcement_reads to authenticated;

create function public.post_announcement(
  p_title text,
  p_body text,
  p_audience public.announcement_audience,
  p_unit_id uuid default null,
  p_class_id uuid default null,
  p_expires_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not (
    (p_audience = 'everyone' and (select private.is_admin_geral()))
    or (p_audience = 'unit' and p_unit_id in (select private.admin_unit_ids()))
    or (p_audience = 'class' and p_class_id in (
      select c.id from public.classes c
      where c.status = 'open' and c.id in (select private.operable_class_ids())
    ))
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_expires_on is not null and p_expires_on < private.today() then
    raise exception 'expired' using errcode = '23514';
  end if;
  insert into public.announcements (title, body, audience, unit_id, class_id, expires_on, author_id)
  values (
    btrim(p_title), btrim(p_body), p_audience,
    case when p_audience = 'unit' then p_unit_id end,
    case when p_audience = 'class' then p_class_id end,
    p_expires_on, (select private.active_user_id())
  )
  returning id into new_id;
  insert into public.announcement_reads (announcement_id, user_id) values (new_id, (select private.active_user_id()));
  return new_id;
end;
$$;

create function public.archive_announcement(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.manages_announcement(p_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.announcements set archived_at = now() where id = p_id and archived_at is null;
end;
$$;

create function public.mark_announcement_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_id not in (select private.visible_announcement_ids()) then
    raise exception 'announcement unavailable' using errcode = '22023';
  end if;
  insert into public.announcement_reads (announcement_id, user_id)
  values (p_id, (select private.active_user_id()))
  on conflict do nothing;
end;
$$;

create function public.announcement_list()
returns table (
  id uuid,
  title text,
  body text,
  audience public.announcement_audience,
  unit_name text,
  class_id uuid,
  class_name text,
  expires_on date,
  created_at timestamptz,
  author_name text,
  read_at timestamptz,
  read_count integer,
  can_archive boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.title, a.body, a.audience, coalesce(u.name, cu.name), c.id, c.name, a.expires_on, a.created_at,
    p.display_name,
    (select r.read_at from public.announcement_reads r
     where r.announcement_id = a.id and r.user_id = (select private.active_user_id())),
    case when private.manages_announcement(a.id)
      then (select count(*)::integer from public.announcement_reads r where r.announcement_id = a.id and r.user_id <> a.author_id)
    end,
    private.manages_announcement(a.id)
  from public.announcements a
  left join public.units u on u.id = a.unit_id
  left join public.classes c on c.id = a.class_id
  left join public.units cu on cu.id = c.unit_id
  left join public.profiles p on p.id = a.author_id
  where a.id in (select private.visible_announcement_ids())
  order by a.created_at desc
  limit 100
$$;

revoke all on function private.certificate_code() from public, anon, authenticated;
revoke all on function public.issue_certificates(uuid) from public, anon;
revoke all on function public.revoke_certificate(uuid, text) from public, anon;
revoke all on function public.verify_certificate(text) from public;
revoke all on function private.visible_announcement_ids() from public, anon;
revoke all on function private.manages_announcement(uuid) from public, anon;
revoke all on function public.post_announcement(text, text, public.announcement_audience, uuid, uuid, date) from public, anon;
revoke all on function public.archive_announcement(uuid) from public, anon;
revoke all on function public.mark_announcement_read(uuid) from public, anon;
revoke all on function public.announcement_list() from public, anon;

grant execute on function public.issue_certificates(uuid) to authenticated;
grant execute on function public.revoke_certificate(uuid, text) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
grant execute on function private.visible_announcement_ids() to authenticated;
grant execute on function private.manages_announcement(uuid) to authenticated;
grant execute on function public.post_announcement(text, text, public.announcement_audience, uuid, uuid, date) to authenticated;
grant execute on function public.archive_announcement(uuid) to authenticated;
grant execute on function public.mark_announcement_read(uuid) to authenticated;
grant execute on function public.announcement_list() to authenticated;
