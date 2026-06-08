-- Host-configurable roster range: lock at roster_min, welcome joiners until roster_max.

alter table public.activities
  add column if not exists roster_min integer,
  add column if not exists roster_max integer;

update public.activities
set
  roster_max = coalesce(roster_max, player_count + greatest(coalesce(missing_players, 0), 0)),
  roster_min = coalesce(roster_min, player_count + greatest(coalesce(missing_players, 0), 0))
where roster_max is null or roster_min is null;

alter table public.activities
  drop constraint if exists activities_roster_bounds_check;

alter table public.activities
  add constraint activities_roster_bounds_check
  check (
    roster_min is null
    or roster_max is null
    or (roster_min >= 2 and roster_max >= roster_min)
  );

create or replace function public.activity_roster_max(p_row public.activities)
returns integer
language sql
immutable
as $$
  select coalesce(
    p_row.roster_max,
    p_row.player_count + greatest(coalesce(p_row.missing_players, 0), 0)
  );
$$;

create or replace function public.activity_roster_min(p_row public.activities)
returns integer
language sql
immutable
as $$
  select coalesce(p_row.roster_min, public.activity_roster_max(p_row));
$$;

create or replace function public.activity_has_open_roster_spots(p_row public.activities)
returns boolean
language sql
immutable
as $$
  select greatest(coalesce(p_row.missing_players, 0), 0) > 0;
$$;

create or replace function public.finalize_game_commitment(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_max_total integer;
  v_lock_min integer;
  v_approved integer;
  v_ready integer;
  v_court text;
  v_message text;
begin
  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> auth.uid() then
    raise exception 'Only host can finalize this game';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Game is already finalized';
  end if;

  v_max_total := public.activity_roster_max(v_activity);
  v_lock_min := public.activity_roster_min(v_activity);

  select count(*)
  into v_approved
  from public.join_requests jr
  where jr.activity_id = p_activity_id
    and jr.status = 'approved';

  v_approved := v_approved + 1;

  select 1 + count(*)
  into v_ready
  from public.join_requests jr
  where jr.activity_id = p_activity_id
    and jr.status = 'approved'
    and jr.ready_at is not null;

  if v_approved >= v_lock_min and v_ready >= v_approved then
    null;
  elsif v_approved >= v_max_total and v_ready >= v_max_total then
    null;
  else
    raise exception 'Not enough ready players. Need at least % with everyone tapped I''m in.', v_lock_min;
  end if;

  if v_activity.scheduling_mode = 'flex' then
    perform public.finalize_activity_best_slot(p_activity_id, v_activity.location_id);
  else
    update public.activities
    set
      match_status = 'finalized',
      finalized_at = now(),
      finalized_by = auth.uid(),
      updated_at = now()
    where id = p_activity_id;
  end if;

  select coalesce(al.name, 'the game') into v_court
  from public.activity_locations al
  where al.id = v_activity.location_id;

  if v_lock_min < v_max_total then
    v_message := format(
      'Committed at %s players for %s — up to %s can still join',
      v_approved,
      v_court,
      v_max_total
    );
  else
    v_message := 'Roster locked for ' || v_court;
  end if;

  perform public.post_activity_system_message(
    p_activity_id,
    auth.uid(),
    v_message
  );

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;

create or replace function public.approve_join_request(
  p_request_id uuid,
  p_activity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_request record;
  v_username text;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity
  from public.activities
  where id = p_activity_id
  for update;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> v_host then
    raise exception 'Only the host can approve join requests';
  end if;

  if v_activity.match_status = 'finalized'
    and not public.activity_has_open_roster_spots(v_activity) then
    raise exception 'Roster is full';
  end if;

  select * into v_request
  from public.join_requests
  where id = p_request_id
    and activity_id = p_activity_id
  for update;

  if not found then
    raise exception 'Join request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Join request is not pending';
  end if;

  if coalesce(v_activity.missing_players, 0) <= 0 then
    raise exception 'No open spots — game is full';
  end if;

  update public.join_requests
  set
    status = 'approved',
    responded_at = now()
  where id = p_request_id;

  update public.activities
  set
    player_count = coalesce(player_count, 1) + 1,
    missing_players = greatest(0, coalesce(missing_players, 0) - 1),
    updated_at = now()
  where id = p_activity_id;

  perform public.ensure_activity_group_conversation(p_activity_id);

  select coalesce(nullif(trim(p.username), ''), 'Someone') into v_username
  from public.profiles p
  where p.id = v_request.user_id;

  perform public.post_activity_system_message(
    p_activity_id,
    v_request.user_id,
    v_username || ' joined the chat'
  );
end;
$$;

create or replace function public.request_join_activity(p_activity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_existing record;
  v_request_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id = v_user then
    raise exception 'You are hosting this game';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'This game is no longer open to join.';
  end if;

  if v_activity.match_status = 'finalized'
    and not public.activity_has_open_roster_spots(v_activity) then
    raise exception 'Roster is full';
  end if;

  perform public.assert_user_can_join_activity(p_activity_id);

  select * into v_existing
  from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user;

  if found then
    if v_existing.status in ('approved', 'pending', 'waitlisted') then
      return v_existing.id;
    end if;

    if v_existing.status = 'rejected' then
      update public.join_requests
      set
        status = 'pending',
        requested_at = now(),
        responded_at = null,
        ready_at = null
      where id = v_existing.id
      returning id into v_request_id;
      return v_request_id;
    end if;
  end if;

  insert into public.join_requests (activity_id, user_id, status)
  values (p_activity_id, v_user, 'pending')
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.set_game_ready(
  p_activity_id uuid,
  p_ready boolean default true
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_ready_at timestamptz;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id = v_user then
    if not p_ready then
      return null;
    end if;
    return now();
  end if;

  v_ready_at := case when p_ready then now() else null end;

  update public.join_requests
  set ready_at = v_ready_at
  where activity_id = p_activity_id
    and user_id = v_user
    and status = 'approved';

  if not found then
    raise exception 'You must be an approved player to mark ready';
  end if;

  return v_ready_at;
end;
$$;

create or replace function public._build_session_card_payload(
  p_activity_id uuid,
  p_viewer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_approved_non_host int := 0;
  v_ready_count int := 1;
  v_roster_count int := 1;
  v_waitlist_count int := 0;
  v_waitlist_position int := null;
  v_max_total int;
  v_lock_min int;
  v_can_finalize boolean := false;
  v_lock_readiness text := 'needs_players';
  v_my_join record;
  v_is_host boolean := false;
  v_is_on_roster boolean := false;
  v_is_ready boolean := false;
  v_is_waitlisted boolean := false;
  v_is_finalized boolean := false;
  v_show_actions boolean := false;
  v_can_nudge boolean := false;
  v_can_lock boolean := false;
  v_is_full boolean := false;
  v_end_ms timestamptz;
  v_roster jsonb;
begin
  select
    a.*,
    hp.username as host_username,
    al.name as location_name
  into v_activity
  from public.activities a
  join public.profiles hp on hp.id = a.user_id
  left join public.activity_locations al on al.id = a.location_id
  where a.id = p_activity_id;

  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.regular_group_id is not null
    and not public.is_regular_group_member(v_activity.regular_group_id, p_viewer_id)
    and v_activity.user_id <> p_viewer_id
    and not exists (
      select 1 from public.join_requests jr
      where jr.activity_id = p_activity_id and jr.user_id = p_viewer_id
    )
  then
    raise exception 'Not allowed to view this session';
  end if;

  select count(*) into v_approved_non_host
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.status = 'approved';

  select count(*) into v_waitlist_count
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.status = 'waitlisted';

  v_roster_count := 1 + v_approved_non_host;
  v_ready_count := 1 + (
    select count(*)
    from public.join_requests jr
    where jr.activity_id = p_activity_id
      and jr.status = 'approved'
      and jr.ready_at is not null
  );

  v_max_total := public.activity_roster_max(v_activity);
  v_lock_min := public.activity_roster_min(v_activity);
  v_can_finalize := v_roster_count >= v_lock_min and v_ready_count >= v_roster_count;

  if v_approved_non_host = 0 then
    v_lock_readiness := 'needs_players';
  elsif v_can_finalize then
    v_lock_readiness := 'ready';
  elsif v_roster_count < v_lock_min then
    v_lock_readiness := 'needs_players';
  else
    v_lock_readiness := 'waiting_im_in';
  end if;

  v_is_host := v_activity.user_id = p_viewer_id;
  v_is_finalized := v_activity.match_status = 'finalized';

  select * into v_my_join
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.user_id = p_viewer_id;

  v_is_waitlisted := coalesce(v_my_join.status = 'waitlisted', false);
  v_is_on_roster := v_is_host or coalesce(v_my_join.status = 'approved', false);
  v_is_ready := v_is_host or coalesce(v_my_join.ready_at is not null and v_my_join.status = 'approved', false);
  v_is_full := coalesce(v_activity.missing_players, 0) <= 0 and not v_is_on_roster and not v_is_host;

  if v_is_waitlisted then
    select rn into v_waitlist_position
    from (
      select jr.user_id, row_number() over (order by jr.created_at asc) as rn
      from public.join_requests jr
      where jr.activity_id = p_activity_id and jr.status = 'waitlisted'
    ) w
    where w.user_id = p_viewer_id;
  end if;

  v_end_ms := v_activity.start_time + make_interval(mins => coalesce(v_activity.duration, 60));
  v_show_actions :=
    v_activity.status = 'active'
    and v_end_ms >= now()
    and (
      not v_is_finalized
      or (public.activity_has_open_roster_spots(v_activity) and not v_is_full)
      or (v_is_on_roster and not v_is_ready and not v_is_host)
    );

  v_can_nudge :=
    v_is_host
    and not v_is_finalized
    and v_activity.status = 'active'
    and v_end_ms >= now()
    and exists (
      select 1 from public.join_requests jr
      where jr.activity_id = p_activity_id
        and jr.status = 'approved'
        and jr.ready_at is null
    );

  v_can_lock := v_is_host and not v_is_finalized and v_can_finalize;

  select coalesce(jsonb_agg(row_to_json(m)::jsonb order by m.sort_key, m.username), '[]'::jsonb)
  into v_roster
  from (
    select
      v_activity.user_id as user_id,
      v_activity.host_username as username,
      hp.profile_photo_url,
      'host'::text as role,
      'approved'::text as status,
      null::timestamptz as ready_at,
      true as is_ready,
      0 as sort_key
    from public.profiles hp
    where hp.id = v_activity.user_id
    union all
    select
      jr.user_id,
      p.username,
      p.profile_photo_url,
      'player'::text,
      jr.status,
      jr.ready_at,
      jr.ready_at is not null as is_ready,
      1 as sort_key
    from public.join_requests jr
    join public.profiles p on p.id = jr.user_id
    where jr.activity_id = p_activity_id
      and jr.status in ('approved', 'waitlisted')
  ) m;

  return jsonb_build_object(
    'activity_id', v_activity.id,
    'host_user_id', v_activity.user_id,
    'host_username', v_activity.host_username,
    'sport_type', v_activity.sport_type,
    'start_time', v_activity.start_time,
    'duration', coalesce(v_activity.duration, 60),
    'status', v_activity.status,
    'match_status', v_activity.match_status,
    'session_note', v_activity.session_note,
    'cost_note', v_activity.cost_note,
    'location_id', v_activity.location_id,
    'location_name', v_activity.location_name,
    'regular_group_id', v_activity.regular_group_id,
    'player_count', coalesce(v_activity.player_count, 1),
    'missing_players', coalesce(v_activity.missing_players, 0),
    'roster_min', public.activity_roster_min(v_activity),
    'roster_max', public.activity_roster_max(v_activity),
    'listing_title', v_activity.listing_title,
    'roster_count', v_roster_count,
    'ready_count', v_ready_count,
    'open_spots', coalesce(v_activity.missing_players, 0),
    'waitlist_count', v_waitlist_count,
    'approved_non_host_count', v_approved_non_host,
    'roster', v_roster,
    'viewer', jsonb_build_object(
      'is_host', v_is_host,
      'is_on_roster', v_is_on_roster,
      'is_ready', v_is_ready,
      'is_waitlisted', v_is_waitlisted,
      'waitlist_position', v_waitlist_position,
      'is_finalized', v_is_finalized,
      'show_actions', v_show_actions,
      'can_nudge', v_can_nudge,
      'can_lock', v_can_lock,
      'lock_readiness', v_lock_readiness,
      'is_full', v_is_full
    )
  );
end;
$$;

grant execute on function public.activity_roster_max(public.activities) to authenticated;
grant execute on function public.activity_roster_min(public.activities) to authenticated;
grant execute on function public.activity_has_open_roster_spots(public.activities) to authenticated;

create or replace function public.join_crew_game(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_open_spots integer;
  v_existing record;
  v_username text;
  v_result jsonb := '{"status":"joined"}'::jsonb;
  v_newly_joined boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.regular_group_id is null then
    raise exception 'This is not a Rally game';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'Game is not active';
  end if;

  if v_activity.match_status = 'finalized'
    and not public.activity_has_open_roster_spots(v_activity) then
    raise exception 'Roster is full';
  end if;

  if v_activity.user_id = v_user then
    return '{"status":"host"}'::jsonb;
  end if;

  if not public.is_regular_group_member(v_activity.regular_group_id, v_user) then
    raise exception 'Join the Rally before joining this game';
  end if;

  select * into v_existing
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.user_id = v_user;

  if found and v_existing.status = 'approved' then
    return '{"status":"already_joined"}'::jsonb;
  end if;

  if found and v_existing.status = 'waitlisted' then
    return '{"status":"waitlisted"}'::jsonb;
  end if;

  v_open_spots := coalesce(v_activity.missing_players, 0);

  if v_open_spots <= 0 then
    if not found then
      insert into public.join_requests (activity_id, user_id, status)
      values (p_activity_id, v_user, 'waitlisted');
    else
      update public.join_requests
      set status = 'waitlisted', updated_at = now()
      where id = v_existing.id;
    end if;
    return '{"status":"waitlisted"}'::jsonb;
  end if;

  if found and v_existing.status = 'pending' then
    update public.join_requests
    set status = 'approved', responded_at = now(), updated_at = now()
    where id = v_existing.id;
    v_newly_joined := true;
  elsif not found then
    insert into public.join_requests (activity_id, user_id, status)
    values (p_activity_id, v_user, 'approved');
    v_newly_joined := true;
  else
    raise exception 'Cannot join this game';
  end if;

  update public.activities
  set
    player_count = coalesce(player_count, 1) + 1,
    missing_players = greatest(0, coalesce(missing_players, 0) - 1),
    updated_at = now()
  where id = p_activity_id;

  perform public.ensure_crew_conversation(v_activity.regular_group_id);

  if v_newly_joined then
    select coalesce(nullif(trim(p.username), ''), 'Someone') into v_username
    from public.profiles p
    where p.id = v_user;

    perform public.post_activity_system_message(
      p_activity_id,
      v_user,
      v_username || ' joined the chat'
    );
  end if;

  return v_result;
end;
$$;
