-- Beta QA seed: kunyupoon495@gmail.com + kenpoon4real@gmail.com (preview Supabase)
-- Run via Supabase SQL editor or: supabase/scripts applied with service role.
-- Covers: Regulars crews, Discover games, friends, crew chats, mini tournament.

do $$
declare
  v_kunyu uuid := 'f6cee5e0-b650-4a85-a2f1-a99d177c27b4';
  v_ken uuid := 'c81ee058-188b-405f-931f-cd07239159cf';
  v_loc_badminton uuid := '380712a8-1f1b-4e71-8c1e-5a16c5487a1d';
  v_loc_pickleball uuid := 'b0f74912-f161-4bca-8422-3ce8e9e2f81e';
  v_group_la uuid := 'a7c4e2b1-9d3f-4a8e-b6c1-2f0e8d4a6b3c';
  v_group_sf uuid := 'e6a3bb82-9f06-41fe-95da-244e928a51f6';
  v_act_discover uuid := 'b8d1f3a2-4c5e-4f6a-9b0d-1e2f3a4b5c6d';
  v_act_ken_discover uuid := 'c9e2f4b3-5d6f-4a7b-8c1e-2f3a4b5c6d7e';
  v_act_crew_next uuid := 'd0f3a5c4-6e7f-4b8c-9d2e-3a4b5c6d7e8f';
  v_act_crew_sf uuid := 'dbcebfbc-cf9f-4020-b7bc-d2c6c6efce5f';
  v_tournament_done uuid := 'e1a4b6d5-7f8a-4c9d-8e3f-4b5c6d7e8f9a';
  v_tournament_open uuid := 'f2b5c7e6-8a9b-4d0e-9f4a-5c6d7e8f9a0b';
  v_conv_discover uuid;
  v_conv_crew uuid;
begin
  -- Profiles
  update public.profiles set
    username = case id when v_kunyu then 'kunyu' when v_ken then 'kenpoon4real' end,
    nickname = case id when v_kunyu then 'Ken (host)' when v_ken then 'Ken P' end,
    preferred_sports = array['Badminton','Pickleball'],
    onboarding_completed = true,
    tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id in (v_kunyu, v_ken);

  -- Friends (accepted — one row per friendship)
  insert into public.friends (user_id, friend_id, status)
  values (v_kunyu, v_ken, 'accepted')
  on conflict (user_id, friend_id) do update set status = 'accepted';

  -- LA Badminton Regulars crew
  insert into public.regular_groups (id, host_id, name, sport_type, default_location_id, invite_token)
  values (v_group_la, v_kunyu, 'LA Badminton Regulars', 'Badminton', v_loc_badminton, gen_random_uuid())
  on conflict (id) do update set
    name = excluded.name,
    sport_type = excluded.sport_type,
    default_location_id = excluded.default_location_id,
    updated_at = now();

  insert into public.regular_group_members (group_id, user_id, role)
  values
    (v_group_la, v_kunyu, 'host'),
    (v_group_la, v_ken, 'member'),
    (v_group_sf, v_ken, 'member')
  on conflict (group_id, user_id) do nothing;

  -- Discover: Kunyu hosts badminton tonight (open join)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    urgency_level, cost_note, match_status
  ) values (
    v_act_discover, v_kunyu, v_loc_badminton, 'Badminton',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '19 hours 30 minutes')
      at time zone 'America/Los_Angeles',
    120, 'nearby', 5, 3, 'active', 'fixed', 'tonight', '~$8/person court fee', 'open'
  )
  on conflict (id) do update set
    start_time = excluded.start_time,
    status = 'active',
    missing_players = 3,
    urgency_level = 'tonight',
    cost_note = excluded.cost_note;

  -- Discover: Ken hosts pickleball (for join flow)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    cost_note, match_status
  ) values (
    v_act_ken_discover, v_ken, v_loc_pickleball, 'Pickleball',
    now() + interval '2 days', 90, 'nearby', 4, 2, 'active', 'fixed',
    '~$6/person', 'open'
  )
  on conflict (id) do update set status = 'active', missing_players = 2;

  -- Crew next game (LA Regulars) — RSVP test
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status
  ) values (
    v_act_crew_next, v_kunyu, v_loc_badminton, 'Badminton',
    now() + interval '1 day 2 hours', 120, 'friends', 8, 2, 'active', 'fixed',
    v_group_la, '~$8/person', 'open'
  )
  on conflict (id) do update set
    regular_group_id = v_group_la,
    start_time = excluded.start_time,
    status = 'active';

  update public.regular_groups set source_activity_id = v_act_crew_next where id = v_group_la;

  -- SF crew upcoming (refresh existing)
  update public.activities set
    start_time = now() + interval '3 days',
    status = 'active',
    regular_group_id = v_group_sf,
    cost_note = '~$5/person',
    missing_players = 1,
    player_count = 4
  where id = v_act_crew_sf;

  -- Ken on LA crew roster (ready flow test)
  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at)
  values (v_act_crew_next, v_ken, 'approved', now() - interval '2 hours', now())
  on conflict (activity_id, user_id) do update set status = 'approved', responded_at = now();

  -- Ken approved on Kunyu discover game (Game Room access)
  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at)
  values (v_act_discover, v_ken, 'approved', now() - interval '1 hour', now())
  on conflict (activity_id, user_id) do update set status = 'approved', responded_at = now();

  -- Mini tournaments
  insert into public.regular_group_tournaments (id, group_id, host_id, name, sport_type, status, started_at)
  values
    (v_tournament_done, v_group_la, v_kunyu, 'Doubles Night — May', 'Badminton', 'completed', now() - interval '7 days'),
    (v_tournament_open, v_group_la, v_kunyu, 'Summer Round Robin', 'Badminton', 'open', null)
  on conflict (id) do nothing;

  insert into public.regular_group_tournament_members (tournament_id, user_id, wins, losses, points)
  values
    (v_tournament_done, v_kunyu, 3, 1, 9),
    (v_tournament_done, v_ken, 2, 2, 6),
    (v_tournament_open, v_kunyu, 0, 0, 0),
    (v_tournament_open, v_ken, 0, 0, 0)
  on conflict (tournament_id, user_id) do nothing;

  if not exists (
    select 1 from public.regular_group_tournament_matches
    where tournament_id = v_tournament_done and round_number = 1
  ) then
    insert into public.regular_group_tournament_matches (
      tournament_id, round_number, home_user_1, home_user_2, away_user_1, away_user_2,
      home_score, away_score, status
    ) values (
      v_tournament_done, 1, v_kunyu, null, v_ken, null, 21, 15, 'done'
    );
  end if;

  -- Crew chats (one thread per group) + Discover game chat
  v_conv_discover := public.ensure_activity_group_conversation(v_act_discover);
  v_conv_crew := public.ensure_crew_conversation(v_group_la);
  perform public.link_activity_to_crew_chat(v_act_crew_next);
  perform public.ensure_crew_conversation(v_group_sf);
  perform public.link_activity_to_crew_chat(v_act_crew_sf);

  update public.conversations set
    pinned_announcement = 'Court 3 booked 7:30–9:30. Bring cash for court split.',
    pinned_announcement_at = now(),
    pinned_announcement_by = v_kunyu
  where id = v_conv_discover;

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_discover, v_kunyu, 'text', 'I booked court 3 — see you tonight!'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_discover and m.content like 'I booked court 3%'
  );

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_discover, v_ken, 'text', 'I can bring shuttles.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_discover and m.content like 'I can bring shuttles%'
  );

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_crew, v_kunyu, 'text', 'Crew game Thursday — tap Join on the card, then I''m in when you can make it.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_crew and m.content like 'Crew game Thursday%'
  );

  raise notice 'Beta seed complete. LA crew: %, discover tonight: %', v_group_la, v_act_discover;
end $$;
