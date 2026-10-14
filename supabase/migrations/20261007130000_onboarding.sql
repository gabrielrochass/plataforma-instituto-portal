alter table public.profiles
  add column onboarding_done_at timestamptz;

grant update (onboarding_done_at) on public.profiles to authenticated;
