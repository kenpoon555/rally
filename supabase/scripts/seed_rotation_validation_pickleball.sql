-- Locked pickleball Rally session for flow-rotation-pairing validation.
-- Prerequisite: seed-monrovia-basketball-rally-demo.mjs + seed_monrovia_basketball_rally_demo.sql
-- Safe to re-run.

do $$
declare
  v_host uuid := 'd1000001-0001-4001-8001-000000000001'; -- @marcus
  v_loc uuid;
  v_group uuid := 'e1000001-0001-4001-8001-000000000102';
  v_locked uuid := 'f2000001-0001-4001-8001-000000000006';
  v_members uuid[] := array[
    'd1000001-0001-4001-8001-000000000002'::uuid,
    'd1000001-0001-4001-8001-000000000003'::uuid,
    'd1000001-0001-4001-8001-000000000004'::uuid,
    'd1000001-0001-4001-8001-000000000006'::uuid
  ];
  v_uid uuid;
  v_conv uuid;
begin
  select id into v_loc
  from public.activity_locations
  where google_place_id = 'seed-la-culver-syd-kronenthal-pickleball'
  limit 1;

  if v_loc is null then
    raise exception 'Pickleball court missing — run seed_la_courts.sql first.';
  end if;

  insert into public.regular_groups (id, host_id, name, sport_type, default_location_id, invite_token)
  values (
    v_group,
    v_host,
    'Monrovia Pickleball Doubles',
    'Pickleball',
    v_loc,
    'a1000001-0001-4001-8001-000000000302'::uuid
  )
  on conflict (id) do update set
    name = excluded.name,
    sport_type = excluded.sport_type,
    default_location_id = excluded.default_location_id,
    updated_at = now();

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_group, v_host, 'host')
  on conflict (group_id, user_id) do update set role = 'host';

  foreach v_uid in array v_members loop
    insert into public.regular_group_members (group_id, user_id, role)
    values (v_group, v_uid, 'member')
    on conflict (group_id, user_id) do update set role = 'member';
  end loop;

  -- Clear prior rotation data for idempotent re-runs
  delete from public.session_rotation_courts
  where rotation_id in (
    select id from public.session_rotations where activity_id = v_locked
  );
  delete from public.session_rotations where activity_id = v_locked;

  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status, session_note, listing_title,
    roster_min, roster_max, play_intent, finalized_at, finalized_by
  ) values (
    v_locked,
    v_host,
    v_loc,
    'Pickleball',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '2 days 10 hours')
      at time zone 'America/Los_Angeles',
    90,
    'friends',
    5,
    0,
    'active',
    'fixed',
    v_group,
    '~$6/person',
    'finalized',
    'Doubles rotation validation — courts 1–2.',
    'Saturday doubles (locked)',
    4,
    8,
    'casual_only',
    now() - interval '1 hour',
    v_host
  )
  on conflict (id) do update set
    sport_type = 'Pickleball',
    regular_group_id = v_group,
    match_status = 'finalized',
    status = 'active',
    finalized_at = coalesce(activities.finalized_at, now() - interval '1 hour'),
    finalized_by = v_host,
    player_count = 5,
    missing_players = 0,
    updated_at = now();

  foreach v_uid in array v_members loop
    insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
    values (
      v_locked,
      v_uid,
      'approved',
      now() - interval '3 days',
      now() - interval '3 days',
      now() - interval '2 days'
    )
    on conflict (activity_id, user_id) do update set
      status = 'approved',
      ready_at = coalesce(join_requests.ready_at, now() - interval '2 days');
  end loop;

  update public.regular_groups set
    source_activity_id = v_locked,
    default_location_id = v_loc,
    updated_at = now()
  where id = v_group;

  select c.id into v_conv
  from public.conversations c
  where c.conversation_type = 'crew_group' and c.regular_group_id = v_group
  limit 1;

  if v_conv is null then
    insert into public.conversations (conversation_type, regular_group_id, created_by, title)
    values ('crew_group', v_group, v_host, 'Monrovia Pickleball Doubles')
    returning id into v_conv;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conv, rgm.user_id, rgm.role, true
  from public.regular_group_members rgm
  where rgm.group_id = v_group
  on conflict (conversation_id, user_id) do update set is_active = true, role = excluded.role;

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv, v_locked, 1, true
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv and ca.activity_id = v_locked
  );
end $$;
