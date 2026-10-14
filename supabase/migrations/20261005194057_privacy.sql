alter table private.deleted_transactions
  add constraint deleted_transactions_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80)
  );
  return new;
end;
$$;

alter table public.profiles drop column avatar_url;
