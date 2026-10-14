create function public.create_jar(
  p_id uuid,
  p_name text,
  p_icon text,
  p_color text,
  p_opening_on date,
  p_target_cents bigint default null,
  p_target_date date default null,
  p_planned_monthly_cents bigint default null,
  p_opening_cents bigint default null
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.jars (id, name, icon, color, target_cents, target_date, planned_monthly_cents)
  values (p_id, p_name, p_icon, p_color, p_target_cents, p_target_date, p_planned_monthly_cents)
  on conflict (id) do nothing;

  if p_opening_cents is not null then
    insert into public.jar_entries (id, jar_id, kind, amount_cents, occurred_on, is_opening)
    values (p_id, p_id, 'deposit', p_opening_cents, p_opening_on, true)
    on conflict (id) do nothing;
  end if;
end;
$$;

grant execute on function public.create_jar(uuid, text, text, text, date, bigint, date, bigint, bigint)
  to authenticated;
