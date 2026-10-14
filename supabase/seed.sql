create function public.dev_set_persona(p_user_id uuid, p_persona text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ra constant uuid := '0a000000-0000-4000-8000-000000000001';
  bv constant uuid := '0a000000-0000-4000-8000-000000000002';
begin
  delete from public.staff_memberships where user_id = p_user_id;
  update public.profiles
  set is_admin_geral = p_persona = 'admin-geral',
      deactivated_at = case when p_persona = 'inativo' then now() end,
      onboarding_done_at = coalesce(onboarding_done_at, now())
  where id = p_user_id;

  insert into public.staff_memberships (user_id, unit_id, role)
  select p_user_id, unit_id, role::public.unit_role
  from (values
    ('admin-ra', ra, 'admin'),
    ('admin-bv', bv, 'admin'),
    ('prof-ra', ra, 'teacher'),
    ('prof-bv', bv, 'teacher'),
    ('prof-ambas', ra, 'teacher'),
    ('prof-ambas', bv, 'teacher'),
    ('inativo', ra, 'teacher')
  ) as personas (persona, unit_id, role)
  where persona = p_persona;
end;
$$;

revoke all on function public.dev_set_persona(uuid, text) from public, anon, authenticated;
grant execute on function public.dev_set_persona(uuid, text) to service_role;
