begin;
select plan(17);

create temporary table cases (
  label text,
  best smallint,
  due smallint,
  purchased date,
  cycle integer,
  expected_close date,
  expected_due date
) on commit drop;

insert into cases values
  ('before best day stays in the current bill', 10, 17, '2026-10-05', 0, '2026-10-09', '2026-10-17'),
  ('on the best day goes to the next bill', 10, 17, '2026-10-10', 0, '2026-11-09', '2026-11-17'),
  ('nubank style, day before best day', 3, 10, '2026-10-02', 0, '2026-10-02', '2026-10-10'),
  ('nubank style, on best day', 3, 10, '2026-10-03', 0, '2026-11-02', '2026-11-10'),
  ('due day before closing day rolls to next month', 28, 5, '2026-10-27', 0, '2026-10-27', '2026-11-05'),
  ('due day before closing, next cycle', 28, 5, '2026-10-28', 0, '2026-11-27', '2026-12-05'),
  ('best day 1 closes on the last day of the month', 1, 8, '2026-03-15', 0, '2026-03-31', '2026-04-08'),
  ('best day 31 closes on the last day of february', 31, 7, '2026-02-27', 0, '2026-02-28', '2026-03-07'),
  ('best day 31 keeps the last day of february in its bill', 31, 7, '2026-02-28', 0, '2026-02-28', '2026-03-07'),
  ('installment 1 with clamped best day', 31, 7, '2026-03-30', 0, '2026-03-30', '2026-04-07'),
  ('installment 2 closes on the last day of april', 31, 7, '2026-03-30', 1, '2026-04-30', '2026-05-07'),
  ('installment 3 lands in may', 31, 7, '2026-03-30', 2, '2026-05-30', '2026-06-07'),
  ('purchase in december rolls into january', 15, 22, '2026-12-20', 0, '2027-01-14', '2027-01-22'),
  ('installment offset crosses the year', 15, 22, '2026-11-10', 2, '2027-01-14', '2027-01-22'),
  ('due on closing day moves to the next month', 11, 10, '2026-10-05', 0, '2026-10-10', '2026-11-10'),
  ('best day 29 keeps feb 28 in the february bill', 29, 7, '2026-02-28', 0, '2026-02-28', '2026-03-07'),
  ('best day 30 in a leap february closes on the 29th', 30, 10, '2028-02-29', 0, '2028-02-29', '2028-03-10');

select is(
  (select b.closes_on || ' / ' || b.due_on from private.bill_dates(c.best, c.due, c.purchased, c.cycle) b),
  c.expected_close || ' / ' || c.expected_due,
  c.label
)
from cases c;

select * from finish();
rollback;
