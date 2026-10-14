drop trigger grades_before_write on public.grades;
create trigger grades_before_write before insert or update of score, concept, missed on public.grades
  for each row execute function private.grades_before_write();
