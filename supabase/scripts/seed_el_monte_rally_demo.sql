-- Demo seed for product review: Los Angeles Badminton Club (El Monte) Regulars
-- Targets the host's real Rally by name; safe to re-run (upserts / idempotent checks).
-- Run in Supabase SQL editor (project casljueycxsqexpkdiuq) or via CLI.

do $$
declare
  v_kunyu uuid := 'f6cee5e0-b650-4a85-a2f1-a99d177c27b4';
  v_ken uuid := 'c81ee058-188b-405f-931f-cd07239159cf';
  v_group_id uuid;
  v_host_id uuid;
  v_loc_id uuid;
  v_past_activity uuid;
  v_upcoming_activity uuid := 'f3a8c2d1-4e5b-4a6c-9d0e-1f2a3b4c5d6e';
  v_tournament_done uuid := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  v_tournament_live uuid := 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
  v_conv_id uuid;
begin
  select rg.id, rg.host_id, coalesce(rg.default_location_id, a.location_id)
  into v_group_id, v_host_id, v_loc_id
  from public.regular_groups rg
  left join public.activities a on a.id = rg.source_activity_id
  where rg.name ilike '%El Monte%'
     or rg.name ilike '%Los Angeles Badminton Club%'
  order by rg.created_at desc
  limit 1;

  if v_group_id is null then
    raise exception 'No El Monte / LA Badminton Club Rally found — save as Rally first, then re-run.';
  end if;

  if v_loc_id is null then
    select id into v_loc_id
    from public.activity_locations
    where name ilike '%El Monte%' or name ilike '%Badminton Club%'
    order by created_at desc
    limit 1;
  end if;

  -- Past session: most recent crew game for this Rally
  select a.id into v_past_activity
  from public.activities a
  where a.regular_group_id = v_group_id
  order by a.start_time desc
  limit 1;

  if v_past_activity is not null then
    update public.activities set
      status = 'completed',
      match_status = 'finalized',
      player_count = greatest(player_count, 2),
      missing_players = 0,
      cost_note = coalesce(cost_note, '~$8/person court fee'),
      updated_at = now()
    where id = v_past_activity;

    -- Post-game attendance (powers leaderboard)
    insert into public.game_attendance (activity_id, user_id, attended, reported_by)
    select v_past_activity, rgm.user_id, true, v_host_id
    from public.regular_group_members rgm
    where rgm.group_id = v_group_id
    on conflict (activity_id, user_id) do update set
      attended = true,
      reported_by = excluded.reported_by;
  end if;

  -- Upcoming session (Play tab → Upcoming)
  insert into public.activities (
    id, user_id, location_id, sport_type, start_time, duration,
    visibility, player_count, missing_players, status, scheduling_mode,
    regular_group_id, cost_note, match_status, session_note
  ) values (
    v_upcoming_activity,
    v_host_id,
    v_loc_id,
    'Badminton',
    (date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '4 days 19 hours 30 minutes')
      at time zone 'America/Los_Angeles',
    120,
    'friends',
    2,
    2,
    'active',
    'fixed',
    v_group_id,
    '~$8/person court fee',
    'open',
    'Courts 3–4 reserved. Bring shuttles.'
  )
  on conflict (id) do update set
    regular_group_id = v_group_id,
    start_time = excluded.start_time,
    status = 'active',
    match_status = 'open',
    session_note = excluded.session_note,
    updated_at = now();

  -- Ken on upcoming roster + I'm in
  insert into public.join_requests (activity_id, user_id, status, requested_at, responded_at, ready_at)
  values (
    v_upcoming_activity,
    v_ken,
    'approved',
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '12 hours'
  )
  on conflict (activity_id, user_id) do update set
    status = 'approved',
    ready_at = coalesce(join_requests.ready_at, now());

  update public.activities set
    player_count = 2,
    missing_players = 2
  where id = v_upcoming_activity;

  update public.regular_groups set
    source_activity_id = coalesce(source_activity_id, v_past_activity),
    default_location_id = coalesce(default_location_id, v_loc_id),
    updated_at = now()
  where id = v_group_id;

  -- Mini tournaments (Play tab → Tournaments)
  insert into public.regular_group_tournaments (id, group_id, host_id, name, sport_type, status, started_at)
  values
    (v_tournament_done, v_group_id, v_host_id, 'Doubles Night — Demo', 'Badminton', 'completed', now() - interval '14 days'),
    (v_tournament_live, v_group_id, v_host_id, 'Summer Round Robin', 'Badminton', 'active', now() - interval '2 days')
  on conflict (id) do update set
    status = excluded.status,
    started_at = excluded.started_at;

  insert into public.regular_group_tournament_members (tournament_id, user_id, wins, losses, points)
  values
    (v_tournament_done, v_host_id, 3, 1, 9),
    (v_tournament_done, v_ken, 2, 2, 6),
    (v_tournament_live, v_host_id, 1, 0, 3),
    (v_tournament_live, v_ken, 0, 1, 0)
  on conflict (tournament_id, user_id) do update set
    wins = excluded.wins,
    losses = excluded.losses,
    points = excluded.points;

  if not exists (
    select 1 from public.regular_group_tournament_matches
    where tournament_id = v_tournament_done and round_number = 1
  ) then
    insert into public.regular_group_tournament_matches (
      tournament_id, round_number, home_user_1, home_user_2, away_user_1, away_user_2,
      home_score, away_score, status
    ) values
      (v_tournament_done, 1, v_host_id, null, v_ken, null, 21, 15, 'done'),
      (v_tournament_done, 2, v_host_id, null, v_ken, null, 21, 18, 'done');
  end if;

  if not exists (
    select 1 from public.regular_group_tournament_matches
    where tournament_id = v_tournament_live and round_number = 1
  ) then
    insert into public.regular_group_tournament_matches (
      tournament_id, round_number, home_user_1, home_user_2, away_user_1, away_user_2,
      home_score, away_score, status
    ) values
      (v_tournament_live, 1, v_host_id, null, v_ken, null, 21, 19, 'done');
  end if;

  -- Crew chat + session cards (direct inserts — RPCs require auth.uid())
  select c.id into v_conv_id
  from public.conversations c
  where c.conversation_type = 'crew_group'
    and c.regular_group_id = v_group_id
  limit 1;

  if v_conv_id is null then
    insert into public.conversations (conversation_type, regular_group_id, created_by, title)
    select 'crew_group', v_group_id, v_host_id, rg.name
    from public.regular_groups rg
    where rg.id = v_group_id
    returning id into v_conv_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (v_conv_id, v_host_id, 'host', true)
  on conflict (conversation_id, user_id) do update set is_active = true, role = 'host';

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conv_id, rgm.user_id, rgm.role, true
  from public.regular_group_members rgm
  where rgm.group_id = v_group_id
    and rgm.user_id <> v_host_id
  on conflict (conversation_id, user_id) do update set is_active = true, role = excluded.role;

  insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
  select v_conv_id, v_upcoming_activity, 1, true
  where not exists (
    select 1 from public.conversation_activities ca
    where ca.conversation_id = v_conv_id and ca.activity_id = v_upcoming_activity
  );

  if v_past_activity is not null then
    insert into public.conversation_activities (conversation_id, activity_id, position, is_current)
    select v_conv_id, v_past_activity, 2, false
    where not exists (
      select 1 from public.conversation_activities ca
      where ca.conversation_id = v_conv_id and ca.activity_id = v_past_activity
    );
  end if;

  perform public.refresh_crew_conversation_current_session(v_conv_id);

  insert into public.messages (conversation_id, sender_id, message_type, content)
  select v_conv_id, v_host_id, 'text', 'Next session is up — tap I''m in on the card if you can make Thursday.'
  where not exists (
    select 1 from public.messages m
    where m.conversation_id = v_conv_id and m.content like 'Next session is up%'
  );

  raise notice 'El Monte Rally demo seed complete. group_id=%, upcoming=%, past=%',
    v_group_id, v_upcoming_activity, v_past_activity;
end $$;
