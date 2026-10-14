begin;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('77777777-7777-4777-8777-777777777777', 'gil@test.local',
   '{"full_name": "Gil", "avatar_url": "https://lh3.googleusercontent.com/a/foto"}');

select hasnt_column('public', 'profiles', 'avatar_url', 'the Google photo is not kept');

set local role authenticated;
set local request.jwt.claims = '{"sub": "77777777-7777-4777-8777-777777777777", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'expense', 'Mercado', 'shopping-cart', 'chart-3');
insert into public.transactions (id, kind, amount_cents, occurred_on, category_id, payment_kind) values
  ('bbbbbbbb-0000-4000-8000-000000000002', 'expense', 2500, '2026-10-01', 'bbbbbbbb-0000-4000-8000-000000000001', 'pix');
delete from public.transactions where id = 'bbbbbbbb-0000-4000-8000-000000000002';

reset role;

select is(
  (select count(*)::int from private.deleted_transactions where user_id = '77777777-7777-4777-8777-777777777777'),
  1,
  'a deleted entry waits in the trash for undo'
);

delete from auth.users where id = '77777777-7777-4777-8777-777777777777';

select is(
  (select count(*)::int from private.deleted_transactions where user_id = '77777777-7777-4777-8777-777777777777'),
  0,
  'deleting the account empties its trash even without live entries'
);
select is(
  (select count(*)::int from public.categories where user_id = '77777777-7777-4777-8777-777777777777'),
  0,
  'deleting the account removes the data'
);

select * from finish();
rollback;
