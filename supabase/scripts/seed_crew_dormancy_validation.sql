-- Validator seed: make Julian Fisher Park Regulars dormant (no upcoming games, last game >14d ago).
-- Run after seed_monrovia_basketball_rally_demo.sql

do $$
declare
  v_group uuid := 'e1000001-0001-4001-8001-000000000101';
  v_upcoming uuid := 'f2000001-0001-4001-8001-000000000005';
begin
  -- Move upcoming game into the past so dormancy logic passes without dev skip.
  update public.activities
  set start_time = now() - interval '20 days'
  where id = v_upcoming
    and regular_group_id = v_group;

  update public.activities
  set start_time = now() - interval '21 days'
  where regular_group_id = v_group
    and id <> v_upcoming
    and start_time > now() - interval '14 days';

  delete from public.crew_dormancy_nudges
  where group_id = v_group;
end;
$$;
