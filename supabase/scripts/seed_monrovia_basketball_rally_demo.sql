-- Monrovia basketball Rally demo: Julian Fisher Park, 10 demo players, game history.
-- Prerequisite: run scripts/seed-monrovia-basketball-rally-demo.mjs first (creates auth users).
-- Safe to re-run. SQL-only fallback after users exist:
--   supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql

do $$
declare
  v_host uuid := 'd1000001-0001-4001-8001-000000000001'; -- @marcus
  v_kunyu uuid := 'f6cee5e0-b650-4a85-a2f1-a99d177c27b4';
  v_loc uuid := 'f1000001-0001-4001-8001-000000000201';
  v_group uuid := 'e1000001-0001-4001-8001-000000000101';

  v_past1 uuid := 'f2000001-0001-4001-8001-000000000001';
  v_past2 uuid := 'f2000001-0001-4001-8001-000000000002';
  v_past3 uuid := 'f2000001-0001-4001-8001-000000000003';
  v_past4 uuid := 'f2000001-0001-4001-8001-000000000004';
  v_upcoming uuid := 'f2000001-0001-4001-8001-000000000005';

  v_members uuid[] := array[
    'd1000001-0001-4001-8001-000000000001'::uuid,
    'd1000001-0001-4001-8001-000000000002'::uuid,
    'd1000001-0001-4001-8001-000000000003'::uuid,
    'd1000001-0001-4001-8001-000000000004'::uuid,
    'd1000001-0001-4001-8001-000000000005'::uuid,
    'd1000001-0001-4001-8001-000000000006'::uuid,
    'd1000001-0001-4001-8001-000000000007'::uuid,
    'd1000001-0001-4001-8001-000000000008'::uuid,
    'd1000001-0001-4001-8001-000000000009'::uuid,
    'd1000001-0001-4001-8001-000000000010'::uuid
  ];

  v_conv uuid;
  v_member uuid;
  v_act uuid;
  v_uid uuid;
begin
  select id into v_loc
  from public.activity_locations
  where google_place_id = 'seed-julian-fisher-park-basketball'
  limit 1;

  if v_loc is null then
    raise exception 'Julian Fisher Park court missing — run seed_julian_fisher_park_court.sql first.';
  end if;

  if not exists (select 1 from public.profiles where id = v_host) then
    raise exception 'Demo host @marcus missing — run scripts/seed-monrovia-basketball-rally-demo.mjs first.';
  end if;

  -- Demo player profiles (handles match kunyu/jade pattern: short username + display nickname)
  update public.profiles set
    username = 'marcus',
    nickname = 'Marcus',
    preferred_sports = array['Basketball'],
    onboarding_completed = true,
    tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000001';

  update public.profiles set
    username = 'derek', nickname = 'Derek', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000002';

  update public.profiles set
    username = 'jordan', nickname = 'Jordan', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000003';

  update public.profiles set
    username = 'alex', nickname = 'Alex', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000004';

  update public.profiles set
    username = 'casey', nickname = 'Casey', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000005';

  update public.profiles set
    username = 'riley', nickname = 'Riley', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000006';

  update public.profiles set
    username = 'devin', nickname = 'Devin', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000007';

  update public.profiles set
    username = 'taylor', nickname = 'Taylor', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000008';

  update public.profiles set
    username = 'morgan', nickname = 'Morgan', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000009';

  update public.profiles set
    username = 'chris', nickname = 'Chris', preferred_sports = array['Basketball'],
    onboarding_completed = true, tos_accepted_at = coalesce(tos_accepted_at, now()),
    location_privacy_ack_at = coalesce(location_privacy_ack_at, now())
  where id = 'd1000001-0001-4001-8001-000000000010';

  -- Real tester can browse the crew while logged in as kunyu
  update public.profiles set
    preferred_sports = array['Basketball', 'Badminton', 'Pickleball'],
    onboarding_completed = true
  where id = v_kunyu;

  insert into public.regular_groups (id, host_id, name, sport_type, default_location_id, invite_token)
  values (
    v_group,
    v_host,
    'Julian Fisher Park Regulars',
    'Basketball',
    v_loc,
    'a1000001-0001-4001-8001-000000000301'::uuid
  )
  on conflict (id) do update set
    name = excluded.name,
    sport_type = excluded.sport_type,
    default_location_id = excluded.default_location_id,
    updated_at = now();

  foreach v_member in array v_members loop
    insert into public.regular_group_members (group_id, user_id, role)
    values (
      v_group,
      v_member,
      case when v_member = v_host then 'host' else 'member' end
    )
    on conflict (group_id, user_id) do update set role = excluded.role;
  end loop;

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_group, v_kunyu, 'member')
  on conflict (group_id, user_id) do update set role = 'member';

  -- Past sessions (Play → Past, leaderboard attendance)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status, session_note, listing_title,
    roster_min, roster_max
  ) values
    (v_past1, v_host, v_loc, 'Basketball', now() - interval '28 days', 120, 'friends', 10, 0, 'completed', 'fixed', v_group, 'Free — public courts', 'finalized', 'Full court 5v5. Bring your own ball.', 'Full court Sunday run', 8, 10),
    (v_past2, v_host, v_loc, 'Basketball', now() - interval '21 days', 120, 'friends', 9, 1, 'completed', 'fixed', v_group, 'Free — public courts', 'finalized', 'Full court 5v5. Bring your own ball.', 'Thursday night run', 8, 10),
    (v_past3, v_host, v_loc, 'Basketball', now() - interval '14 days', 120, 'friends', 10, 0, 'completed', 'fixed', v_group, 'Free — public courts', 'finalized', 'Full court 5v5. Bring your own ball.', 'Weeknight pickup', 8, 10),
    (v_past4, v_host, v_loc, 'Basketball', now() - interval '7 days', 120, 'friends', 8, 2, 'completed', 'fixed', v_group, 'Free — public courts', 'finalized', 'Full court 5v5. Bring your own ball.', 'Saturday morning run', 8, 10)
  on conflict (id) do update set
    status = 'completed',
    match_status = 'finalized',
    regular_group_id = v_group,
    updated_at = now();

  foreach v_act in array array[v_past1, v_past2, v_past3, v_past4] loop
    foreach v_uid in array v_members loop
      if v_uid = v_host then
        continue;
      end if;

      insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
      values (
        v_act,
        v_uid,
        'approved',
        now() - interval '30 days',
        now() - interval '30 days',
        now() - interval '29 days'
      )
      on conflict (activity_id, user_id) do update set
        status = 'approved',
        ready_at = coalesce(join_requests.ready_at, now());
    end loop;
  end loop;

  insert into public.game_attendance (activity_id, user_id, attended, reported_by)
  select v_past1, uid, true, v_host from unnest(v_members) as uid
  on conflict (activity_id, user_id) do update set attended = true, reported_by = v_host;

  insert into public.game_attendance (activity_id, user_id, attended, reported_by)
  select v_past2, uid, true, v_host from unnest(v_members[1:9]) as uid
  on conflict (activity_id, user_id) do update set attended = true, reported_by = v_host;

  insert into public.game_attendance (activity_id, user_id, attended, reported_by)
  select v_past3, uid, true, v_host from unnest(v_members) as uid
  on conflict (activity_id, user_id) do update set attended = true, reported_by = v_host;

  insert into public.game_attendance (activity_id, user_id, attended, reported_by)
  select v_past4, uid, true, v_host from unnest(v_members[1:8]) as uid
  on conflict (activity_id, user_id) do update set attended = true, reported_by = v_host;

  -- Upcoming session (tomorrow 9am PT — good for first test group)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status, session_note, listing_title,
    roster_min, roster_max, play_intent
  ) values (
    v_upcoming,
    v_host,
    v_loc,
    'Basketball',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '1 day 9 hours')
      at time zone 'America/Los_Angeles',
    120,
    'friends',
    7,
    3,
    'active',
    'fixed',
    v_group,
    'Free — public courts',
    'open',
    'Full court 5v5. Meet at the south courts.',
    'Morning pickup run',
    'casual_only',
    8,
    10
  )
  on conflict (id) do update set
    regular_group_id = v_group,
    start_time = excluded.start_time,
    status = 'active',
    match_status = 'open',
    player_count = 7,
    missing_players = 3,
    updated_at = now();

  foreach v_uid in array v_members[2:5] loop
    insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
    values (
      v_upcoming,
      v_uid,
      'approved',
      now() - interval '3 days',
      now() - interval '3 days',
      now() - interval '1 day'
    )
    on conflict (activity_id, user_id) do update set
      status = 'approved',
      ready_at = coalesce(join_requests.ready_at, now());
  end loop;

  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values (
    v_upcoming,
    v_members[6],
    'approved',
    now() - interval '2 days',
    now() - interval '2 days',
    null
  )
  on conflict (activity_id, user_id) do update set status = 'approved';

  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values (
    v_upcoming,
    v_kunyu,
    'approved',
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '6 hours'
  )
  on conflict (activity_id, user_id) do update set
    status = 'approved',
    ready_at = coalesce(join_requests.ready_at, now());

  update public.regular_groups set
    source_activity_id = v_past4,
    default_location_id = v_loc,
    updated_at = now()
  where id = v_group;

  -- Crew chat + session cards
  select c.id into v_conv
  from public.conversations c
  where c.conversation_type = 'crew_group' and c.regular_group_id = v_group
  limit 1;

  if v_conv is null then
    insert into public.conversations (conversation_type, regular_group_id, created_by, title)
    values ('crew_group', v_group, v_host, 'Julian Fisher Park Regulars')
    returning id into v_conv;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conv, rgm.user_id, rgm.role, true
  from public.regular_group_members rgm
  where rgm.group_id = v_group
  on conflict (conversation_id, user_id) do update set is_active = true, role = excluded.role;

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv, v_upcoming, 1, true
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv and ca.activity_id = v_upcoming
  );

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv, v_past4, 2, false
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv and ca.activity_id = v_past4
  );

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv, v_past3, 3, false
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv and ca.activity_id = v_past3
  );

  perform public.refresh_crew_conversation_current_session(v_conv);

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv, v_host, 'text', 'Sunday run is posted — tap I''m in on the card if you can make it.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv and m.content like 'Sunday run is posted%'
  );

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv, 'd1000001-0001-4001-8001-000000000003'::uuid, 'text', 'I''m in — can we run full court?'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv and m.content like 'I''m in — can we run full court%'
  );

  update public.conversations set
    pinned_announcement = 'Meet at the south courts by 9:00. Bring water — it gets hot by noon.',
    pinned_announcement_at = now(),
    pinned_announcement_by = v_host
  where id = v_conv;

  raise notice 'Monrovia basketball demo seed complete. group=%, upcoming=%, court=%',
    v_group, v_upcoming, v_loc;
end $$;
