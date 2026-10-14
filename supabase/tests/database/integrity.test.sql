begin;
select plan(16);

insert into auth.users (id, email) values
  ('33333333-3333-4333-8333-333333333333', 'carla@test.local'),
  ('44444444-4444-4444-8444-444444444444', 'davi@test.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';

insert into public.categories (id, kind, name, icon, color) values
  ('cccccccc-0000-4000-8000-000000000001', 'expense', 'Compras', 'shopping-bag', 'chart-4'),
  ('cccccccc-0000-4000-8000-000000000002', 'expense', 'Saúde', 'heart-pulse', 'chart-3');

insert into public.cards (id, name, design, best_purchase_day, due_day)
values ('cccccccc-0000-4000-8000-000000000010', 'Itaú', 'rosa', 10, 17);

select throws_ok(
  $$ insert into public.categories (kind, name, icon, color) values ('expense', ' Mercado', 'ellipsis', 'chart-1') $$,
  '23514', null, 'names with surrounding spaces are rejected'
);
select throws_ok(
  $$ insert into public.categories (kind, name, icon, color) values ('expense', E'Mer\tcado', 'ellipsis', 'chart-1') $$,
  '23514', null, 'names with control characters are rejected'
);
select throws_ok(
  $$ insert into public.cards (name, design) select 'c' || g, 'grafite' from generate_series(1, 40) g $$,
  '54000', null, 'cards are capped per user'
);
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind)
     values ('expense', 100, 'infinity', 'cccccccc-0000-4000-8000-000000000001', 'pix') $$,
  '23514', null, 'dates outside 2000-2100 are rejected'
);
select throws_ok(
  $$ select public.create_installment_purchase(gen_random_uuid(), 1000, 0, '2026-10-05', null,
    'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000010') $$,
  '22023', null, 'an installment count of zero is rejected'
);

select public.create_installment_purchase('cccccccc-0000-4000-8000-000000000020', 30000, 3, '2026-10-05', 'Tênis',
  'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000010');
select throws_ok(
  $$ select public.create_installment_purchase('cccccccc-0000-4000-8000-000000000020', 40000, 4, '2026-10-05', 'Tênis',
    'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000010') $$,
  '23505', null, 'retrying an installment purchase with different terms is rejected'
);
select throws_ok(
  $$ insert into public.transactions (kind, amount_cents, occurred_on, category_id, payment_kind, card_id,
       installment_group_id, installment_number, installment_count, installment_purchased_on)
     values ('expense', 100, '2031-01-01', 'cccccccc-0000-4000-8000-000000000001', 'card',
       'cccccccc-0000-4000-8000-000000000010', gen_random_uuid(), 2, 3, '2026-10-05') $$,
  '23514', null, 'an installment date must follow its purchase date'
);

insert into public.transactions (id, kind, amount_cents, occurred_on, category_id, payment_kind, card_id)
values ('cccccccc-0000-4000-8000-000000000030', 'expense', 5000, '2026-09-01',
  'cccccccc-0000-4000-8000-000000000002', 'card', 'cccccccc-0000-4000-8000-000000000010');

update public.cards set best_purchase_day = 20 where id = 'cccccccc-0000-4000-8000-000000000010';
select is(
  (select bill_closes_on || ' / ' || bill_due_on from public.transactions where id = 'cccccccc-0000-4000-8000-000000000030'),
  (select b.closes_on || ' / ' || b.due_on from private.bill_dates(20::smallint, 17::smallint, '2026-09-01', 0) b),
  'changing a card''s days moves its purchases to the new bills'
);

create temporary table before_delete on commit drop as
  select created_at from public.transactions where id = 'cccccccc-0000-4000-8000-000000000030';
delete from public.transactions where id = 'cccccccc-0000-4000-8000-000000000030';

set local request.jwt.claims = '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}';
select is(
  public.restore_transactions(array['cccccccc-0000-4000-8000-000000000030']::uuid[]),
  0, 'another user cannot restore someone else''s transaction'
);

set local request.jwt.claims = '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}';
update public.cards set best_purchase_day = 25 where id = 'cccccccc-0000-4000-8000-000000000010';
select is(
  public.restore_transactions(array['cccccccc-0000-4000-8000-000000000030']::uuid[]),
  1, 'the owner restores a deleted transaction'
);
select is(
  (select bill_closes_on || ' / ' || bill_due_on from public.transactions where id = 'cccccccc-0000-4000-8000-000000000030'),
  (select b.closes_on || ' / ' || b.due_on from private.bill_dates(25::smallint, 17::smallint, '2026-09-01', 0) b),
  'a restored purchase follows the card''s current bill days'
);
select is(
  (select created_at from public.transactions where id = 'cccccccc-0000-4000-8000-000000000030'),
  (select created_at from before_delete),
  'restoring keeps the original creation time'
);
select is(
  public.restore_transactions(array['cccccccc-0000-4000-8000-000000000030']::uuid[]),
  0, 'a transaction can only be restored once'
);

update public.cards set best_purchase_day = null, due_day = null where id = 'cccccccc-0000-4000-8000-000000000010';
select is(
  (select count(*)::int from public.transactions where card_id = 'cccccccc-0000-4000-8000-000000000010' and bill_due_on is not null),
  0, 'removing a card''s bill days removes its bills'
);
select is(
  (select transaction_count from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  (select count(*)::int from public.transactions),
  'the per-user counter matches the real number of transactions'
);

update public.categories set archived_at = now() where id = 'cccccccc-0000-4000-8000-000000000002';
select lives_ok(
  $$ update public.transactions set description = 'Farmácia' where id = 'cccccccc-0000-4000-8000-000000000030' $$,
  'transactions in archived categories can still be edited'
);

select * from finish();
rollback;
