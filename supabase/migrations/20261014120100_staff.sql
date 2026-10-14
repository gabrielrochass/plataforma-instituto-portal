create type public.unit_role as enum ('admin', 'teacher');

create table public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{2,6}$'),
  name text not null check (char_length(name) between 1 and 80 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index units_name_key on public.units (lower(name)) where archived_at is null;

insert into public.units (id, code, name) values
  ('0a000000-0000-4000-8000-000000000001', 'RA', 'Recife Antigo'),
  ('0a000000-0000-4000-8000-000000000002', 'BV', 'Boa Viagem');

alter table public.profiles
  add column is_admin_geral boolean not null default false,
  add column deactivated_at timestamptz;

create table public.staff_memberships (
  user_id uuid not null references public.profiles on delete cascade,
  unit_id uuid not null references public.units,
  role public.unit_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);

create index staff_memberships_unit_idx on public.staff_memberships (unit_id);

create table private.staff_invites (
  id uuid primary key,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  display_name text not null check (char_length(display_name) between 1 and 80 and display_name = btrim(display_name) and display_name !~ '[[:cntrl:]]'),
  unit_id uuid not null references public.units,
  role public.unit_role not null,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles on delete set null,
  revoked_at timestamptz
);

create index staff_invites_unit_idx on private.staff_invites (unit_id) where accepted_at is null and revoked_at is null;

create table private.password_resets (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references public.profiles on delete cascade,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 day',
  used_at timestamptz
);

create function private.is_admin_geral()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.is_admin_geral and p.deactivated_at is null
    from public.profiles p
    where p.id = (select auth.uid())
  ), false)
$$;

create function private.active_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p
  where p.id = (select auth.uid()) and p.deactivated_at is null
$$;

create function private.member_unit_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from public.units u where (select private.is_admin_geral())
  union
  select m.unit_id from public.staff_memberships m
  where m.user_id = (select private.active_user_id())
$$;

create function private.admin_unit_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from public.units u where (select private.is_admin_geral())
  union
  select m.unit_id from public.staff_memberships m
  where m.user_id = (select private.active_user_id()) and m.role = 'admin'
$$;

create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.member_unit_ids())
$$;

create function private.manages_member(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin_geral())
    or (
      not exists (select 1 from public.profiles p where p.id = p_user_id and p.is_admin_geral)
      and exists (
        select 1 from public.staff_memberships m
        where m.user_id = p_user_id and m.unit_id in (select private.admin_unit_ids())
      )
      and not exists (
        select 1 from public.staff_memberships m
        where m.user_id = p_user_id
          and (m.role = 'admin' or m.unit_id not in (select private.admin_unit_ids()))
      )
    )
$$;

alter table public.units enable row level security;
alter table public.staff_memberships enable row level security;

drop policy "own profile" on public.profiles;

create policy "staff see profiles" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_staff()));

create policy "own profile changes" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "staff see units" on public.units
  for select to authenticated
  using ((select private.is_staff()));

create policy "admin geral adds units" on public.units
  for insert to authenticated
  with check ((select private.is_admin_geral()));

create policy "admin geral edits units" on public.units
  for update to authenticated
  using ((select private.is_admin_geral()))
  with check ((select private.is_admin_geral()));

create policy "members see unit staff" on public.staff_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or unit_id in (select private.member_unit_ids()));

grant select on public.units to authenticated;
grant insert (id, code, name) on public.units to authenticated;
grant update (name, archived_at) on public.units to authenticated;
grant select on public.staff_memberships to authenticated;

create function public.create_invite(
  p_id uuid,
  p_token_hash text,
  p_display_name text,
  p_unit_id uuid,
  p_role public.unit_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_unit_id not in (select private.admin_unit_ids())
    or (p_role = 'admin' and not (select private.is_admin_geral())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  insert into private.staff_invites (id, token_hash, display_name, unit_id, role, created_by)
  values (p_id, p_token_hash, btrim(p_display_name), p_unit_id, p_role, (select auth.uid()))
  on conflict (id) do nothing;
end;
$$;

create function public.revoke_invite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.staff_invites
  set revoked_at = now()
  where id = p_id
    and accepted_at is null
    and unit_id in (select private.admin_unit_ids());
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end;
$$;

create function public.pending_invites()
returns table (
  id uuid,
  display_name text,
  unit_id uuid,
  role public.unit_role,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.display_name, i.unit_id, i.role, i.created_at, i.expires_at
  from private.staff_invites i
  where i.accepted_at is null
    and i.revoked_at is null
    and i.expires_at > now()
    and i.unit_id in (select private.admin_unit_ids())
  order by i.created_at desc
$$;

create function public.invite_info(p_token_hash text)
returns table (display_name text, unit_name text, role public.unit_role)
language sql
stable
security definer
set search_path = ''
as $$
  select i.display_name, u.name, i.role
  from private.staff_invites i
  join public.units u on u.id = i.unit_id
  where i.token_hash = p_token_hash
    and i.accepted_at is null
    and i.revoked_at is null
    and i.expires_at > now()
$$;

create function public.accept_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite private.staff_invites;
  me uuid := (select private.active_user_id());
begin
  if me is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into invite from private.staff_invites i
  where i.token_hash = p_token_hash
  for update;

  if not found or invite.revoked_at is not null or invite.expires_at <= now() then
    raise exception 'invite unavailable' using errcode = '22023';
  end if;
  if invite.accepted_at is not null then
    if invite.accepted_by = me then
      return invite.unit_id;
    end if;
    raise exception 'invite used' using errcode = '22023';
  end if;

  insert into public.staff_memberships (user_id, unit_id, role)
  values (me, invite.unit_id, invite.role)
  on conflict (user_id, unit_id) do update
    set role = case when excluded.role = 'admin' then excluded.role else public.staff_memberships.role end;

  update private.staff_invites set accepted_at = now(), accepted_by = me where id = invite.id;
  return invite.unit_id;
end;
$$;

create function public.team_members()
returns table (
  id uuid,
  display_name text,
  email text,
  is_admin_geral boolean,
  deactivated_at timestamptz,
  memberships jsonb,
  manageable boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, u.email::text, p.is_admin_geral, p.deactivated_at,
    coalesce((
      select jsonb_agg(jsonb_build_object('unit_id', m.unit_id, 'role', m.role) order by m.unit_id)
      from public.staff_memberships m where m.user_id = p.id
    ), '[]'::jsonb),
    private.manages_member(p.id) and p.id <> (select auth.uid())
  from public.profiles p
  join auth.users u on u.id = p.id
  where (select private.is_admin_geral())
    or exists (
      select 1 from public.staff_memberships m
      where m.user_id = p.id and m.unit_id in (select private.admin_unit_ids())
    )
  order by p.deactivated_at nulls first, lower(coalesce(p.display_name, u.email))
$$;

create function public.set_membership(p_user_id uuid, p_unit_id uuid, p_role public.unit_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_unit_id not in (select private.admin_unit_ids())
    or (p_role = 'admin' and not (select private.is_admin_geral()))
    or not exists (select 1 from public.profiles p where p.id = p_user_id)
    or (
      not (select private.is_admin_geral())
      and (
        exists (select 1 from public.profiles p where p.id = p_user_id and p.is_admin_geral)
        or exists (
          select 1 from public.staff_memberships m
          where m.user_id = p_user_id and m.unit_id = p_unit_id and m.role = 'admin'
        )
        or not exists (
          select 1 from public.staff_memberships m
          where m.user_id = p_user_id and m.unit_id in (select private.admin_unit_ids())
        )
      )
    ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  insert into public.staff_memberships (user_id, unit_id, role)
  values (p_user_id, p_unit_id, p_role)
  on conflict (user_id, unit_id) do update set role = excluded.role;
end;
$$;

create function public.remove_membership(p_user_id uuid, p_unit_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_unit_id not in (select private.admin_unit_ids())
    or (
      not (select private.is_admin_geral())
      and exists (
        select 1 from public.staff_memberships m
        where m.user_id = p_user_id and m.unit_id = p_unit_id and m.role = 'admin'
      )
    ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  delete from public.staff_memberships where user_id = p_user_id and unit_id = p_unit_id;
end;
$$;

create function public.set_staff_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id = (select auth.uid()) or not private.manages_member(p_user_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if not p_active and exists (select 1 from public.profiles p where p.id = p_user_id and p.is_admin_geral)
    and not exists (
      select 1 from public.profiles p
      where p.is_admin_geral and p.deactivated_at is null and p.id <> p_user_id
    ) then
    raise exception 'last admin geral' using errcode = '23514';
  end if;

  update public.profiles
  set deactivated_at = case when p_active then null else coalesce(deactivated_at, now()) end
  where id = p_user_id;
end;
$$;

create function public.set_admin_geral(p_user_id uuid, p_value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin_geral()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  perform 1 from public.profiles where is_admin_geral for update;

  if not p_value and not exists (
    select 1 from public.profiles p
    where p.is_admin_geral and p.deactivated_at is null and p.id <> p_user_id
  ) then
    raise exception 'last admin geral' using errcode = '23514';
  end if;

  update public.profiles set is_admin_geral = p_value where id = p_user_id;
end;
$$;

create function public.create_password_reset(p_user_id uuid, p_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id <> (select auth.uid()) and not private.manages_member(p_user_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update private.password_resets set used_at = now() where user_id = p_user_id and used_at is null;
  insert into private.password_resets (token_hash, user_id, created_by)
  values (p_token_hash, p_user_id, (select auth.uid()));
end;
$$;

create function public.password_reset_info(p_token_hash text)
returns table (display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name
  from private.password_resets r
  join public.profiles p on p.id = r.user_id
  where r.token_hash = p_token_hash
    and r.used_at is null
    and r.expires_at > now()
    and p.deactivated_at is null
$$;

create function public.consume_password_reset(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  update private.password_resets r
  set used_at = now()
  from public.profiles p
  where r.token_hash = p_token_hash
    and r.used_at is null
    and r.expires_at > now()
    and p.id = r.user_id
    and p.deactivated_at is null
  returning r.user_id into target;

  if target is null then
    raise exception 'reset unavailable' using errcode = '22023';
  end if;
  return target;
end;
$$;

revoke all on function private.is_admin_geral() from public, anon;
revoke all on function private.active_user_id() from public, anon;
revoke all on function private.member_unit_ids() from public, anon;
revoke all on function private.admin_unit_ids() from public, anon;
revoke all on function private.is_staff() from public, anon;
revoke all on function private.manages_member(uuid) from public, anon;
grant execute on function private.is_admin_geral() to authenticated;
grant execute on function private.active_user_id() to authenticated;
grant execute on function private.member_unit_ids() to authenticated;
grant execute on function private.admin_unit_ids() to authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.manages_member(uuid) to authenticated;

grant execute on function public.create_invite(uuid, text, text, uuid, public.unit_role) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
grant execute on function public.pending_invites() to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.team_members() to authenticated;
grant execute on function public.set_membership(uuid, uuid, public.unit_role) to authenticated;
grant execute on function public.remove_membership(uuid, uuid) to authenticated;
grant execute on function public.set_staff_active(uuid, boolean) to authenticated;
grant execute on function public.set_admin_geral(uuid, boolean) to authenticated;
grant execute on function public.create_password_reset(uuid, text) to authenticated;
grant execute on function public.invite_info(text) to service_role;
grant execute on function public.password_reset_info(text) to service_role;
grant execute on function public.consume_password_reset(text) to service_role;
