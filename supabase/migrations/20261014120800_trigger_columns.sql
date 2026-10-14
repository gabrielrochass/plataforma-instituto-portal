drop trigger attendance_before_write on public.attendance_records;
create trigger attendance_before_write before insert or update of status, note on public.attendance_records
  for each row execute function private.attendance_before_write();

drop trigger grades_before_write on public.grades;
create trigger grades_before_write before insert or update of score, concept, missed on public.grades
  for each row execute function private.grades_before_write();
