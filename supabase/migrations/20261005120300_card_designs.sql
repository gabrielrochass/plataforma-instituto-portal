alter domain public.card_design drop constraint card_design_check;

update public.cards set design = 'rosa' where design = 'rubi';
update public.cards set design = 'tangerina' where design = 'coral';

alter domain public.card_design add constraint card_design_check
  check (value in (
    'grafite', 'meia-noite', 'oceano', 'floresta', 'por-do-sol',
    'ametista', 'rosa', 'tangerina', 'ouro', 'prata'
  ));
