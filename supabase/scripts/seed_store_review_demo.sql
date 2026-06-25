-- App Store review demo overlay — populated Discover + Inbox for marcus@rally-mvrhoops.demo
-- Run AFTER seed_monrovia_basketball_rally_demo.sql (auth users + Julian Fisher court exist).
--
--   supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
--   supabase db query --linked -f supabase/scripts/seed_store_review_demo.sql

do $$
declare
  v_host uuid := 'd1000001-0001-4001-8001-000000000001'; -- @marcus
  v_derek uuid := 'd1000001-0001-4001-8001-000000000002';
  v_jordan uuid := 'd1000001-0001-4001-8001-000000000003';
  v_alex uuid := 'd1000001-0001-4001-8001-000000000004';
  v_casey uuid := 'd1000001-0001-4001-8001-000000000005';
  v_loc uuid;
  v_group uuid := 'e1000001-0001-4001-8001-000000000101';
  v_upcoming uuid := 'f2000001-0001-4001-8001-000000000005';

  v_disc_bb uuid := 'f2000001-0001-4001-8001-000000000006';
  v_disc_pb uuid := 'f2000001-0001-4001-8001-000000000007';
  v_disc_bd uuid := 'f2000001-0001-4001-8001-000000000008';
  v_disc_bb2 uuid := 'f2000001-0001-4001-8001-000000000009';

  v_conv_game uuid;
  v_conv_dm uuid;
  v_act uuid;
begin
  select id into v_loc
  from public.activity_locations
  where google_place_id = 'seed-julian-fisher-park-basketball'
  limit 1;

  if v_loc is null then
    raise exception 'Julian Fisher Park court missing — run Monrovia seed first.';
  end if;

  if not exists (select 1 from public.profiles where id = v_host) then
    raise exception 'Demo host @marcus missing — run scripts/seed-monrovia-basketball-rally-demo.mjs first.';
  end if;

  -- Human display names (never show .demo email in Profile UI)
  update public.profiles set
    username = 'marcus',
    nickname = 'Marcus',
    preferred_sports = array['Basketball', 'Pickleball', 'Badminton'],
    onboarding_completed = true
  where id = v_host;

  update public.profiles set username = 'derek', nickname = 'Derek', preferred_sports = array['Basketball', 'Pickleball'] where id = v_derek;
  update public.profiles set username = 'jordan', nickname = 'Jordan', preferred_sports = array['Pickleball', 'Tennis'] where id = v_jordan;
  update public.profiles set username = 'alex', nickname = 'Alex', preferred_sports = array['Badminton', 'Basketball'] where id = v_alex;
  update public.profiles set username = 'casey', nickname = 'Casey', preferred_sports = array['Basketball'] where id = v_casey;

  -- Clear any email-shaped nicknames across demo cohort
  update public.profiles set nickname = initcap(username)
  where id in (v_host, v_derek, v_jordan, v_alex, v_casey)
    and (nickname is null or nickname like '%@%');

  -- Rally upcoming game: visible on Discover (nearby) as well as crew
  update public.activities set
    visibility = 'nearby',
    status = 'active',
    match_status = 'open',
    start_time = (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '1 day 9 hours')
      at time zone 'America/Los_Angeles',
    updated_at = now()
  where id = v_upcoming;

  -- Public Discover games — different hosts, sports, future-dated (Play tab must not be empty)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    cost_note, match_status, listing_title, session_note,
    roster_min, roster_max, urgency_level
  ) values
    (
      v_disc_bb, v_derek, v_loc, 'Basketball',
      (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '18 hours 30 minutes')
        at time zone 'America/Los_Angeles',
      120, 'nearby', 6, 4, 'active', 'fixed',
      'Free — public courts', 'open',
      'Wednesday evening run', 'Full court 5v5 at Julian Fisher Park.',
      8, 10, 'tonight'
    ),
    (
      v_disc_pb, v_jordan, v_loc, 'Pickleball',
      (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '2 days 10 hours')
        at time zone 'America/Los_Angeles',
      90, 'nearby', 4, 2, 'active', 'fixed',
      'Free — bring paddle', 'open',
      'Saturday morning doubles', 'Open play — all levels welcome.',
      4, 6, 'normal'
    ),
    (
      v_disc_bd, v_alex, v_loc, 'Badminton',
      (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '1 day 19 hours')
        at time zone 'America/Los_Angeles',
      120, 'nearby', 5, 3, 'active', 'fixed',
      '~$8/person court fee', 'open',
      'Friday night shuttles', 'Courts 1–2 — split fee at front desk.',
      4, 8, 'normal'
    ),
    (
      v_disc_bb2, v_casey, v_loc, 'Basketball',
      (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '3 days 8 hours')
        at time zone 'America/Los_Angeles',
      120, 'nearby', 3, 5, 'active', 'fixed',
      'Free — public courts', 'open',
      'Sunday morning pickup', 'Half-court until 10, then run full.',
      6, 10, 'normal'
    )
  on conflict (id) do update set
    user_id = excluded.user_id,
    sport_type = excluded.sport_type,
    visibility = 'nearby',
    start_time = excluded.start_time,
    status = 'active',
    match_status = 'open',
    player_count = excluded.player_count,
    missing_players = excluded.missing_players,
    listing_title = excluded.listing_title,
    session_note = excluded.session_note,
    updated_at = now();

  -- Roster on discover games (other demo players)
  foreach v_act in array array[v_disc_bb, v_disc_pb, v_disc_bd, v_disc_bb2] loop
    insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
    select v_act, p.id, 'approved', now() - interval '1 day', now() - interval '1 day', now() - interval '12 hours'
    from public.profiles p
    where p.id in (v_jordan, v_alex, v_casey)
      and p.id <> (select user_id from public.activities where id = v_act)
    on conflict (activity_id, user_id) do update set status = 'approved', ready_at = coalesce(join_requests.ready_at, now());
  end loop;

  -- Marcus joined Derek's game → Games inbox thread
  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values (v_disc_bb, v_host, 'approved', now() - interval '6 hours', now() - interval '6 hours', now() - interval '2 hours')
  on conflict (activity_id, user_id) do update set
    status = 'approved',
    ready_at = coalesce(join_requests.ready_at, now());

  -- Game room chats (manual insert — ensure_activity_group_conversation requires auth.uid())
  foreach v_act in array array[v_disc_bb, v_disc_pb, v_disc_bd, v_disc_bb2] loop
    select c.id into v_conv_game
    from public.conversations c
    where c.activity_id = v_act and c.conversation_type = 'activity_group'
    limit 1;

    if v_conv_game is null then
      insert into public.conversations (conversation_type, activity_id, created_by, title)
      select 'activity_group', v_act, a.user_id, 'Game Chat'
      from public.activities a
      where a.id = v_act
      returning id into v_conv_game;
    end if;

    insert into public.conversation_members (conversation_id, user_id, role, is_active)
    select v_conv_game, jr.user_id, 'member', true
    from public.join_requests jr
    where jr.activity_id = v_act and jr.status = 'approved'
    on conflict (conversation_id, user_id) do update set is_active = true;

    insert into public.conversation_members (conversation_id, user_id, role, is_active)
    select v_conv_game, a.user_id, 'host', true
    from public.activities a
    where a.id = v_act
    on conflict (conversation_id, user_id) do update set is_active = true, role = 'host';
  end loop;

  select c.id into v_conv_game
  from public.conversations c
  where c.activity_id = v_disc_bb and c.conversation_type = 'activity_group'
  limit 1;

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_game, v_derek, 'text', 'Running 5v5 tonight — bring a dark and light shirt.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_game and m.content like 'Running 5v5 tonight%'
  );

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_game, v_host, 'text', 'I can make it — see you at the south courts.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_game and m.content like 'I can make it — see you%'
  );

  -- Friends + direct DM (Inbox → Friends)
  insert into public.friends (user_id, friend_id, status)
  values (v_host, v_derek, 'accepted')
  on conflict (user_id, friend_id) do update set status = 'accepted';

  select c.id into v_conv_dm
  from public.conversations c
  join public.conversation_members cm1 on cm1.conversation_id = c.id and cm1.user_id = v_host
  join public.conversation_members cm2 on cm2.conversation_id = c.id and cm2.user_id = v_derek
  where c.conversation_type = 'friend_direct'
  limit 1;

  if v_conv_dm is null then
    insert into public.conversations (conversation_type, created_by, title)
    values ('friend_direct', v_host, null)
    returning id into v_conv_dm;

    insert into public.conversation_members (conversation_id, user_id, role, is_active)
    values
      (v_conv_dm, v_host, 'member', true),
      (v_conv_dm, v_derek, 'member', true)
    on conflict (conversation_id, user_id) do update set is_active = true;
  end if;

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_dm, v_derek, 'text', 'You joining the evening run? Need one more for full court.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_dm and m.content like 'You joining the evening run%'
  );

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_dm, v_host, 'text', 'Yep — just marked ready on the game card.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_dm and m.content like 'Yep — just marked ready%'
  );

  -- Refresh crew rally chat (Inbox → Rallies) — upcoming game uses crew conversation
  select c.id into v_conv_game
  from public.conversations c
  where c.conversation_type = 'crew_group' and c.regular_group_id = v_group
  limit 1;

  if v_conv_game is not null then
    perform public.refresh_crew_conversation_current_session(v_conv_game);
  end if;

  raise notice 'Store review demo overlay complete. Discover games: %, %, %, %. Friend DM + game chats seeded.',
    v_disc_bb, v_disc_pb, v_disc_bd, v_disc_bb2;
end $$;
