drop function public.register_student(uuid, text, date, jsonb, public.accessibility_list, public.consent_kind[], text, text, text, text, uuid, text, text, uuid, uuid);
drop function public.enroll_student(uuid, uuid, uuid);

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
  p_enrollment_id uuid default null,
  p_enrolled_on date default null
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
  if p_enrolled_on > private.today() then
    raise exception 'enrollment in the future' using errcode = '22023';
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
    insert into public.enrollments (id, student_id, class_id, enrolled_on)
    values (p_enrollment_id, p_id, p_class_id, coalesce(p_enrolled_on, private.today()));
  end if;
end;
$$;

create function public.enroll_student(
  p_enrollment_id uuid,
  p_student_id uuid,
  p_class_id uuid,
  p_enrolled_on date default null
)
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
  if p_enrolled_on > private.today() then
    raise exception 'enrollment in the future' using errcode = '22023';
  end if;
  insert into public.enrollments (id, student_id, class_id, enrolled_on)
  values (p_enrollment_id, p_student_id, p_class_id, coalesce(p_enrolled_on, private.today()));
end;
$$;

grant execute on function public.register_student(uuid, text, date, jsonb, public.accessibility_list, public.consent_kind[], text, text, text, text, uuid, text, text, uuid, uuid, date) to authenticated;
grant execute on function public.enroll_student(uuid, uuid, uuid, date) to authenticated;
