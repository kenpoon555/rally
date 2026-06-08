-- Designer demo seed for Jade (jadepoonphy@gmail.com / @jphy → @jade)
-- Shows: hosted Rally (full), member Rally, friends, Discover, invites, tournaments, leaderboard.
-- Safe to re-run. Run: supabase db query --linked -f supabase/scripts/seed_jade_designer_demo.sql

do $$
declare
  v_jade uuid := '81343684-6ba8-468f-b61d-9fddd6f06639';
  v_kunyu uuid := 'f6cee5e0-b650-4a85-a2f1-a99d177c27b4';
  v_ken uuid := 'c81ee058-188b-405f-931f-cd07239159cf';
  v_vcb uuid := '2267943b-2036-496a-93ea-a450b2a243f5';

  v_loc_pickleball uuid := '85e2dcb3-d0df-44cc-8268-3654d5165db3';
  v_loc_badminton uuid := '380712a8-1f1b-4e71-8c1e-5a16c5487a1d';

  v_kunyu_rally uuid := '2bb88dd0-007a-4462-8040-75c507f9a55e';
  v_baby_pandas uuid := 'a7c4e2b1-9d3f-4a8e-b6c1-2f0e8d4a6b3c';

  v_pickle_rally uuid := 'c4ade001-1111-4111-8111-111111111101';
  v_pb_past uuid := 'c4ade001-1111-4111-8111-111111111102';
  v_pb_upcoming uuid := 'c4ade001-1111-4111-8111-111111111103';
  v_pb_tourney_done uuid := 'c4ade001-1111-4111-8111-111111111104';
  v_pb_tourney_open uuid := 'c4ade001-1111-4111-8111-111111111105';
  v_pb_discover uuid := 'c4ade001-1111-4111-8111-111111111106';
  v_kunyu_upcoming uuid := 'f3a8c2d1-4e5b-4a6c-9d0e-1f2a3b4c5d6e';
  v_kunyu_discover uuid := 'b8d1f3a2-4c5e-4f6a-9b0d-1e2f3a4b5c6d';

  v_conv_pickle uuid;
  v_conv_kunyu uuid;
begin
  -- Profile (designer-friendly handle)
  update public.profiles set
    username = 'jade',
    nickname = 'Jade',
    preferred_sports = array['Pickleball', 'Badminton'],
    onboarding_completed = true,
    tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = v_jade;

  -- Friends with Ken + Kunyu (accepted)
  insert into public.friends (user_id, friend_id, status)
  values
    (v_kunyu, v_jade, 'accepted'),
    (v_jade, v_ken, 'accepted'),
    (v_ken, v_jade, 'accepted')
  on conflict (user_id, friend_id) do update set status = 'accepted';

  -- ── Jade HOSTS: Silver Lake Pickleball Crew (primary design showcase) ──
  insert into public.regular_groups (id, host_id, name, sport_type, default_location_id, invite_token)
  values (
    v_pickle_rally,
    v_jade,
    'Silver Lake Pickleball Crew',
    'Pickleball',
    v_loc_pickleball,
    gen_random_uuid()
  )
  on conflict (id) do update set
    name = excluded.name,
    sport_type = excluded.sport_type,
    default_location_id = excluded.default_location_id,
    updated_at = now();

  insert into public.regular_group_members (group_id, user_id, role)
  values
    (v_pickle_rally, v_jade, 'host'),
    (v_pickle_rally, v_kunyu, 'member')
  on conflict (group_id, user_id) do update set role = excluded.role;

  -- Past session (Play → Past, leaderboard attendance)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status, session_note, listing_title
  ) values (
    v_pb_past,
    v_jade,
    v_loc_pickleball,
    'Pickleball',
    now() - interval '10 days',
    90,
    'friends',
    4,
    0,
    'completed',
    'fixed',
    v_pickle_rally,
    '~$6/person',
    'finalized',
    'Beginner-friendly doubles — paddles available.',
    'Sunday social doubles'
  )
  on conflict (id) do update set
    status = 'completed',
    match_status = 'finalized',
    regular_group_id = v_pickle_rally,
    updated_at = now();

  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values
    (v_pb_past, v_kunyu, 'approved', now() - interval '11 days', now() - interval '11 days', now() - interval '10 days'),
    (v_pb_past, v_ken, 'approved', now() - interval '11 days', now() - interval '11 days', now() - interval '10 days')
  on conflict (activity_id, user_id) do update set
    status = 'approved',
    ready_at = coalesce(join_requests.ready_at, now());

  insert into public.game_attendance (activity_id, user_id, attended, reported_by)
  select v_pb_past, uid, true, v_jade
  from unnest(array[v_jade, v_kunyu, v_ken]) as uid
  on conflict (activity_id, user_id) do update set attended = true, reported_by = v_jade;

  -- Upcoming session (Play → Upcoming, Chat session card)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status, session_note, listing_title, play_intent
  ) values (
    v_pb_upcoming,
    v_jade,
    v_loc_pickleball,
    'Pickleball',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '3 days 10 hours')
      at time zone 'America/Los_Angeles',
    90,
    'friends',
    3,
    1,
    'active',
    'fixed',
    v_pickle_rally,
    '~$6/person',
    'open',
    'Courts 1–2 reserved. BYO water.',
    'Saturday morning doubles',
    'casual_only'
  )
  on conflict (id) do update set
    regular_group_id = v_pickle_rally,
    start_time = excluded.start_time,
    status = 'active',
    match_status = 'open',
    updated_at = now();

  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values
    (v_pb_upcoming, v_kunyu, 'approved', now() - interval '2 days', now() - interval '2 days', now() - interval '1 day'),
    (v_pb_upcoming, v_ken, 'approved', now() - interval '1 day', now() - interval '1 day', null)
  on conflict (activity_id, user_id) do update set status = 'approved';

  update public.regular_groups set
    source_activity_id = v_pb_past,
    default_location_id = v_loc_pickleball,
    updated_at = now()
  where id = v_pickle_rally;

  -- Tournaments (Play → Tournaments)
  insert into public.regular_group_tournaments (id, group_id, host_id, name, sport_type, status, started_at)
  values
    (v_pb_tourney_done, v_pickle_rally, v_jade, 'Round Robin — May', 'Pickleball', 'completed', now() - interval '10 days'),
    (v_pb_tourney_open, v_pickle_rally, v_jade, 'Summer Social Bracket', 'Pickleball', 'open', null)
  on conflict (id) do update set status = excluded.status;

  insert into public.regular_group_tournament_members (tournament_id, user_id, wins, losses, points)
  values
    (v_pb_tourney_done, v_jade, 2, 1, 6),
    (v_pb_tourney_done, v_kunyu, 2, 1, 6),
    (v_pb_tourney_done, v_ken, 1, 2, 3),
    (v_pb_tourney_open, v_jade, 0, 0, 0),
    (v_pb_tourney_open, v_kunyu, 0, 0, 0)
  on conflict (tournament_id, user_id) do update set
    wins = excluded.wins,
    losses = excluded.losses,
    points = excluded.points;

  if not exists (
    select 1 from public.regular_group_tournament_matches where tournament_id = v_pb_tourney_done
  ) then
    insert into public.regular_group_tournament_matches (
      tournament_id, round_number, home_user_1, away_user_1, home_score, away_score, status
    ) values
      (v_pb_tourney_done, 1, v_jade, v_kunyu, 11, 8, 'done'),
      (v_pb_tourney_done, 2, v_jade, v_ken, 11, 9, 'done');
  end if;

  -- Pending OUTGOING invite (Members → Invited · waiting) — Ken not in pickle Rally yet
  insert into public.regular_group_invites (group_id, invited_user_id, invited_by, status)
  values (v_pickle_rally, v_ken, v_jade, 'pending')
  on conflict (group_id, invited_user_id) do update set
    status = 'pending',
    invited_by = v_jade,
    responded_at = null,
    created_at = now();

  -- Pickleball crew chat
  select c.id into v_conv_pickle
  from public.conversations c
  where c.conversation_type = 'crew_group' and c.regular_group_id = v_pickle_rally
  limit 1;

  if v_conv_pickle is null then
    insert into public.conversations (conversation_type, regular_group_id, created_by, title)
    values ('crew_group', v_pickle_rally, v_jade, 'Silver Lake Pickleball Crew')
    returning id into v_conv_pickle;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (v_conv_pickle, v_jade, 'host', true)
  on conflict (conversation_id, user_id) do update set is_active = true, role = 'host';

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conv_pickle, rgm.user_id, rgm.role, true
  from public.regular_group_members rgm
  where rgm.group_id = v_pickle_rally and rgm.user_id <> v_jade
  on conflict (conversation_id, user_id) do update set is_active = true;

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv_pickle, v_pb_upcoming, 1, true
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv_pickle and ca.activity_id = v_pb_upcoming
  );

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv_pickle, v_pb_past, 2, false
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv_pickle and ca.activity_id = v_pb_past
  );

  perform public.refresh_crew_conversation_current_session(v_conv_pickle);

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_pickle, v_jade, 'text', 'Saturday session is live — tap I''m in on the card when you can make it.'
  where not exists (
    select 1 from public.messages m where m.conversation_id = v_conv_pickle and m.content like 'Saturday session is live%'
  );

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_pickle, v_kunyu, 'text', 'I''m in for Saturday! Can we do courts 1–2 again?'
  where not exists (
    select 1 from public.messages m where m.conversation_id = v_conv_pickle and m.content like 'I''m in for Saturday%'
  );

  update public.conversations set
    pinned_announcement = 'Bring $6 cash for court split. Paddles on court 2 if you need one.',
    pinned_announcement_at = now(),
    pinned_announcement_by = v_jade
  where id = v_conv_pickle;

  -- ── Jade MEMBER: Kunyu's LA Badminton Regulars (secondary view) ──
  insert into public.regular_group_members (group_id, user_id, role)
  values (v_kunyu_rally, v_jade, 'member')
  on conflict (group_id, user_id) do update set role = 'member';

  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values (
    v_kunyu_upcoming,
    v_jade,
    'approved',
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '6 hours'
  )
  on conflict (activity_id, user_id) do update set
    status = 'approved',
    ready_at = coalesce(join_requests.ready_at, now());

  select c.id into v_conv_kunyu
  from public.conversations c
  where c.conversation_type = 'crew_group' and c.regular_group_id = v_kunyu_rally
  limit 1;

  if v_conv_kunyu is not null then
    insert into public.conversation_members (conversation_id, user_id, role, is_active)
    values (v_conv_kunyu, v_jade, 'member', true)
    on conflict (conversation_id, user_id) do update set is_active = true, role = 'member';
  end if;

  -- Pending INCOMING Rally invite (Home / Chats invite UX) — Baby pandas
  insert into public.regular_group_invites (group_id, invited_user_id, invited_by, status)
  values (v_baby_pandas, v_jade, v_kunyu, 'pending')
  on conflict (group_id, invited_user_id) do update set
    status = 'pending',
    invited_by = v_kunyu,
    responded_at = null,
    created_at = now();

  -- ── Discover / Play tab: public games Jade can browse ──
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    urgency_level, cost_note, match_status, listing_title, play_intent
  ) values (
    v_pb_discover,
    v_jade,
    v_loc_pickleball,
    'Pickleball',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '1 day 18 hours')
      at time zone 'America/Los_Angeles',
    90,
    'nearby',
    2,
    2,
    'active',
    'fixed',
    'normal',
    '~$6/person',
    'open',
    'Looking for doubles partners',
    'pickup'
  )
  on conflict (id) do update set
    status = 'active',
    listing_title = excluded.listing_title,
    updated_at = now();

  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    urgency_level, cost_note, match_status, listing_title
  ) values (
    v_kunyu_discover,
    v_kunyu,
    v_loc_badminton,
    'Badminton',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '19 hours 30 minutes')
      at time zone 'America/Los_Angeles',
    120,
    'nearby',
    3,
    1,
    'active',
    'fixed',
    'tonight',
    '~$8/person court fee',
    'open',
    'Need 1 more for doubles'
  )
  on conflict (id) do update set
    start_time = excluded.start_time,
    status = 'active',
    urgency_level = 'tonight',
    listing_title = excluded.listing_title,
    updated_at = now();

  -- Friend request from VCB (optional — shows Friends tab pending)
  insert into public.friends (user_id, friend_id, status)
  values (v_vcb, v_jade, 'pending')
  on conflict (user_id, friend_id) do update set status = 'pending';

  raise notice 'Jade designer demo seed complete. Pickle Rally=%, Kunyu member=%, username=jade',
    v_pickle_rally, v_kunyu_rally;
end $$;
