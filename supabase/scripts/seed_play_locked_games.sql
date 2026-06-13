-- Play tab demo: locked · still welcoming games (finalized + missing_players > 0)
-- Idempotent. Host = kenpoon4real; visible to other users in Discover.
--
-- Apply: supabase db query --linked -f supabase/scripts/seed_play_locked_games.sql
-- Or: node scripts/seed-play-locked-games.mjs

do $$
declare
  v_host uuid := 'c81ee058-188b-405f-931f-cd07239159cf';
  v_loc_bb uuid;
  v_loc_pb uuid;
  v_act_bb uuid := 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c';
  v_act_pb uuid := 'a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d';
begin
  select id into v_loc_bb
  from public.activity_locations
  where google_place_id = 'seed-la-venice-beach-basketball'
  limit 1;

  select id into v_loc_pb
  from public.activity_locations
  where google_place_id = 'seed-la-culver-syd-kronenthal-pickleball'
  limit 1;

  if v_loc_bb is null or v_loc_pb is null then
    raise exception 'Run seed_la_courts.sql first (missing Venice BB or Culver PB courts).';
  end if;

  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    cost_note, match_status, listing_title, play_intent, roster_min, roster_max
  ) values (
    v_act_bb,
    v_host,
    v_loc_bb,
    'Basketball',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '1 day 19 hours')
      at time zone 'America/Los_Angeles',
    120,
    'nearby',
    9,
    1,
    'active',
    'fixed',
    'Free — public courts',
    'finalized',
    '5v5 Basketball',
    'pickup',
    8,
    10
  )
  on conflict (id) do update set
    status = 'active',
    match_status = 'finalized',
    player_count = 9,
    missing_players = 1,
    listing_title = excluded.listing_title,
    start_time = excluded.start_time,
    updated_at = now();

  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    cost_note, match_status, listing_title, play_intent, roster_min, roster_max
  ) values (
    v_act_pb,
    v_host,
    v_loc_pb,
    'Pickleball',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '2 days 18 hours')
      at time zone 'America/Los_Angeles',
    90,
    'nearby',
    3,
    1,
    'active',
    'fixed',
    '~$6/person',
    'finalized',
    'Pickleball Doubles',
    'pickup',
    4,
    4
  )
  on conflict (id) do update set
    status = 'active',
    match_status = 'finalized',
    player_count = 3,
    missing_players = 1,
    listing_title = excluded.listing_title,
    start_time = excluded.start_time,
    updated_at = now();

  raise notice 'Locked welcoming games seeded: bb=%, pb=%', v_act_bb, v_act_pb;
end $$;
