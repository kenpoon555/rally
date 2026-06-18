-- Validator seed: marcus as coach for coach-foundation UI validation.

update public.profiles
set is_coach = true
where username = 'marcus'
   or id = 'd1000001-0001-4001-8001-000000000001';
