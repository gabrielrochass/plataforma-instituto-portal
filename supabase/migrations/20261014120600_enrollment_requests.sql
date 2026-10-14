create extension if not exists pgcrypto with schema extensions;

create type public.request_status as enum ('pending', 'waitlisted', 'converted', 'declined', 'withdrawn');

create table public.enrollment_offers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes,
  unit_id uuid not null references public.units,
  description text check (private.valid_note(description, 1000)),
  closes_on date check (closes_on between '2000-01-01' and '2100-12-31'),
  is_open boolean not null default true,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  foreign key (class_id, unit_id) references public.classes (id, unit_id)
);

create unique index enrollment_offers_open_key on public.enrollment_offers (class_id) where is_open;

create table public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.enrollment_offers,
  protocol text not null unique check (protocol ~ '^[2-9A-HJ-NP-Z]{8}$'),
  full_name text not null check (private.valid_text(full_name, 120)),
  social_name text check (private.valid_text(social_name, 120)),
  birth_date date not null check (birth_date between '1900-01-01' and '2100-12-31'),
  phone text not null check (phone ~ '^[1-9]{2}9?\d{8}$'),
  email text check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  neighborhood text check (private.valid_text(neighborhood, 80)),
  guardian_name text check (private.valid_text(guardian_name, 120)),
  guardian_phone text check (guardian_phone ~ '^[1-9]{2}9?\d{8}$'),
  consented_at timestamptz not null,
  status public.request_status not null default 'pending',
  note text check (private.valid_note(note, 500)),
  student_id uuid references public.students,
  enrollment_id uuid references public.enrollments,
  decided_by uuid references public.profiles on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'converted') = (enrollment_id is not null)),
  check ((guardian_name is null) = (guardian_phone is null))
);

create index enrollment_requests_queue_idx on public.enrollment_requests (offer_id, status, created_at);

create table private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

create function private.hit_rate_limit(p_bucket text, p_limit integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz := date_bin(p_window, now(), timestamptz '2000-01-01');
  total integer;
begin
  delete from private.rate_limits where window_start < now() - interval '2 days';
  insert into private.rate_limits (bucket, window_start, hits)
  values (p_bucket, current_window, 1)
  on conflict (bucket, window_start) do update set hits = private.rate_limits.hits + 1
  returning hits into total;
  if total > p_limit then
    raise exception 'rate limit' using errcode = '54000';
  end if;
end;
$$;

create function private.random_code(p_length integer)
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', (get_byte(b, i) % 32) + 1, 1), '')
  from (select extensions.gen_random_bytes(p_length) as b) bytes, generate_series(0, p_length - 1) i
$$;

create function public.open_offers()
returns table (
  id uuid,
  class_name text,
  workload_hours smallint,
  starts_on date,
  ends_on date,
  weekdays smallint[],
  unit_name text,
  description text,
  closes_on date
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, c.name, c.workload_hours, c.starts_on, c.ends_on, c.weekdays, u.name, o.description, o.closes_on
  from public.enrollment_offers o
  join public.classes c on c.id = o.class_id and c.status = 'open' and c.ends_on >= private.today()
  join public.units u on u.id = o.unit_id and u.archived_at is null
  where o.is_open and (o.closes_on is null or o.closes_on >= private.today())
  order by c.name, u.name
$$;

create function public.submit_enrollment_request(
  p_offer_id uuid,
  p_full_name text,
  p_birth_date date,
  p_phone text,
  p_consent boolean,
  p_social_name text default null,
  p_email text default null,
  p_neighborhood text default null,
  p_guardian_name text default null,
  p_guardian_phone text default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing text;
  code text;
begin
  if not coalesce(p_consent, false) then
    raise exception 'consent required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.open_offers() o where o.id = p_offer_id) then
    raise exception 'offer closed' using errcode = '55000';
  end if;
  if p_birth_date > (private.today() - interval '18 years')::date
    and (nullif(btrim(p_guardian_name), '') is null or p_guardian_phone is null) then
    raise exception 'a minor needs a guardian' using errcode = '23514';
  end if;

  select r.protocol into existing from public.enrollment_requests r
  where r.offer_id = p_offer_id and r.phone = p_phone and r.birth_date = p_birth_date
    and r.status in ('pending', 'waitlisted');
  if existing is not null then
    return existing;
  end if;

  perform private.hit_rate_limit('requests', 300, interval '1 hour');
  perform private.hit_rate_limit('phone:' || p_phone, 3, interval '1 day');

  code := private.random_code(8);
  insert into public.enrollment_requests (
    offer_id, protocol, full_name, social_name, birth_date, phone, email, neighborhood,
    guardian_name, guardian_phone, consented_at
  ) values (
    p_offer_id, code, btrim(p_full_name), nullif(btrim(p_social_name), ''), p_birth_date, p_phone,
    nullif(lower(btrim(p_email)), ''), nullif(btrim(p_neighborhood), ''),
    nullif(btrim(p_guardian_name), ''), case when nullif(btrim(p_guardian_name), '') is null then null else p_guardian_phone end,
    now()
  );
  return code;
end;
$$;

create function public.request_list()
returns table (
  id uuid,
  offer_id uuid,
  class_id uuid,
  class_name text,
  unit_id uuid,
  unit_code text,
  protocol text,
  full_name text,
  social_name text,
  birth_date date,
  phone text,
  status public.request_status,
  queue_position integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, o.id, c.id, c.name, u.id, u.code, r.protocol, r.full_name, r.social_name, r.birth_date, r.phone, r.status,
    case when r.status in ('pending', 'waitlisted') then
      (row_number() over (
        partition by o.id, r.status in ('pending', 'waitlisted')
        order by r.created_at
      ))::integer
    end,
    r.created_at
  from public.enrollment_requests r
  join public.enrollment_offers o on o.id = r.offer_id
  join public.classes c on c.id = o.class_id
  join public.units u on u.id = o.unit_id
  where o.unit_id in (select private.admin_unit_ids())
  order by r.created_at
$$;

create function public.convert_enrollment_request(
  p_request_id uuid,
  p_class_id uuid,
  p_enrollment_id uuid,
  p_student_id uuid default null,
  p_new_student_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request public.enrollment_requests;
  offer public.enrollment_offers;
  class_row public.classes;
  student uuid;
begin
  select * into request from public.enrollment_requests where id = p_request_id for update;
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into offer from public.enrollment_offers where id = request.offer_id;
  select * into class_row from public.classes where id = p_class_id;
  if offer.unit_id not in (select private.admin_unit_ids())
    or class_row.unit_id is distinct from offer.unit_id
    or not private.can_operate_class(p_class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if request.status = 'converted' then
    return request.student_id;
  end if;
  if request.status not in ('pending', 'waitlisted') then
    raise exception 'request closed' using errcode = '55000';
  end if;

  if p_student_id is not null then
    student := p_student_id;
  else
    student := p_new_student_id;
    insert into public.students (id, full_name, social_name, birth_date, phone, email, registered_unit_id, created_by)
    values (student, request.full_name, request.social_name, request.birth_date, request.phone, request.email,
      offer.unit_id, (select auth.uid()));
    if request.guardian_name is not null then
      insert into public.guardians (student_id, full_name, relationship, phone)
      values (student, request.guardian_name, 'other', request.guardian_phone);
    end if;
    insert into public.student_care (student_id) values (student);
    insert into public.consents (student_id, kind, signed_on)
    values (student, 'data_processing', (request.consented_at at time zone 'America/Recife')::date);
  end if;

  insert into public.enrollments (id, student_id, class_id) values (p_enrollment_id, student, p_class_id);

  update public.enrollment_requests
  set status = 'converted', student_id = student, enrollment_id = p_enrollment_id,
      decided_by = (select auth.uid()), decided_at = now()
  where id = p_request_id;
  return student;
end;
$$;

alter table public.enrollment_offers enable row level security;
alter table public.enrollment_requests enable row level security;

create policy "admins see offers" on public.enrollment_offers
  for select to authenticated using (unit_id in (select private.admin_unit_ids()));
create policy "admins open offers" on public.enrollment_offers
  for insert to authenticated with check (unit_id in (select private.admin_unit_ids()));
create policy "admins change offers" on public.enrollment_offers
  for update to authenticated
  using (unit_id in (select private.admin_unit_ids()))
  with check (unit_id in (select private.admin_unit_ids()));

create policy "admins see requests" on public.enrollment_requests
  for select to authenticated
  using (offer_id in (select o.id from public.enrollment_offers o));
create policy "admins decide requests" on public.enrollment_requests
  for update to authenticated
  using (offer_id in (select o.id from public.enrollment_offers o) and status <> 'converted')
  with check (status in ('pending', 'waitlisted', 'declined', 'withdrawn'));

grant select on public.enrollment_offers to authenticated;
grant insert (id, class_id, unit_id, description, closes_on) on public.enrollment_offers to authenticated;
grant update (description, closes_on, is_open) on public.enrollment_offers to authenticated;
grant select on public.enrollment_requests to authenticated;
grant update (status, note, decided_by, decided_at) on public.enrollment_requests to authenticated;

revoke all on function private.hit_rate_limit(text, integer, interval) from public, anon, authenticated;
revoke all on function private.random_code(integer) from public, anon, authenticated;

grant execute on function public.open_offers() to anon, authenticated;
grant execute on function public.submit_enrollment_request(uuid, text, date, text, boolean, text, text, text, text, text) to anon, authenticated;
grant execute on function public.request_list() to authenticated;
grant execute on function public.convert_enrollment_request(uuid, uuid, uuid, uuid, uuid) to authenticated;
