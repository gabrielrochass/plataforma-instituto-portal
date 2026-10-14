alter table public.students
  add column photo_path text check (photo_path ~ '^[0-9a-f-]{36}/[0-9a-z]{6,40}\.(jpg|webp)$'),
  add column badge_token text unique check (badge_token ~ '^[2-9A-HJ-NP-Z]{10}$');

create function private.students_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.badge_token is null then
    new.badge_token := private.random_code(10);
  end if;
  return new;
end;
$$;

create trigger students_badge before insert on public.students
  for each row execute function private.students_badge();

grant select (photo_path, badge_token, anonymized_at) on public.students to authenticated;
grant update (photo_path) on public.students to authenticated;

create function public.renew_badge(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  if not private.can_see_student(p_student_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  token := private.random_code(10);
  update public.students set badge_token = token where id = p_student_id and anonymized_at is null;
  if not found then
    raise exception 'student unavailable' using errcode = '22023';
  end if;
  return token;
end;
$$;

drop function public.attendance_roster(uuid, date);

create function public.attendance_roster(p_class_id uuid, p_held_on date)
returns table (
  enrollment_id uuid,
  student_id uuid,
  full_name text,
  social_name text,
  photo_path text,
  badge_token text,
  needs_accessibility boolean,
  status public.attendance_status,
  streak integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, s.id, s.full_name, s.social_name, s.photo_path, s.badge_token,
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

create or replace function public.student_list(
  p_query text default null,
  p_unit_id uuid default null,
  p_situation text default 'active'
)
returns table (
  id uuid,
  full_name text,
  social_name text,
  birth_date date,
  photo_path text,
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
  select s.id, s.full_name, s.social_name, s.birth_date, s.photo_path, u.code,
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

create function private.photo_student_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when p_name ~ '^[0-9a-f-]{36}/' then substr(p_name, 1, 36)::uuid end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', false, 2097152, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "staff see photos of their students" on storage.objects
  for select to authenticated
  using (bucket_id = 'student-photos' and private.can_see_student(private.photo_student_id(name)));
create policy "staff add photos of their students" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-photos' and private.can_see_student(private.photo_student_id(name)));
create policy "staff remove photos of their students" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-photos' and private.can_see_student(private.photo_student_id(name)));

revoke all on function private.students_badge() from public, anon, authenticated;
revoke all on function private.photo_student_id(text) from public, anon;
grant execute on function private.photo_student_id(text) to authenticated;
grant execute on function public.renew_badge(uuid) to authenticated;
grant execute on function public.attendance_roster(uuid, date) to authenticated;
