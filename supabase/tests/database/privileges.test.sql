begin;
select plan(7);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'ana@test.local', '{"full_name": "  Ana Souza  "}'),
  ('22222222-2222-4222-8222-222222222222', 'bruno@test.local', '{}');

select is(
  (select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Ana Souza',
  'new users get a profile with their trimmed name'
);
select is(
  (select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  null,
  'a missing name stays empty'
);

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}';

select is(
  (select count(*)::int from public.profiles),
  1,
  'a person sees only their own profile'
);
select is_empty(
  $$ update public.profiles set display_name = 'Outra' where id = '22222222-2222-4222-8222-222222222222' returning id $$,
  'a person cannot rename someone else'
);

reset role;

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'every public table has row level security'
);
select is_empty(
  $$ select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private') and not coalesce(p.proconfig @> array['search_path=""'], false) $$,
  'every function pins an empty search_path'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anon has no table access'
);

select * from finish();
rollback;
