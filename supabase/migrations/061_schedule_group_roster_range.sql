-- Rally schedule_group_next_game: host sets roster_min (lock) and roster_max (capacity).

create or replace function public.schedule_group_next_game(
  p_group_id uuid,
  p_start_time timestamptz,
  p_player_count integer default 8,
  p_duration integer default null,
  p_roster_min integer default null,
  p_roster_max integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_group record;
  v_series_id uuid;
  v_new_id uuid;
  v_max integer;
  v_min integer;
  v_duration integer;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  if p_start_time <= now() then
    raise exception 'Start time must be in the future';
  end if;

  v_max := greatest(2, least(coalesce(p_roster_max, p_player_count, 8), 32));
  v_min := greatest(2, least(coalesce(p_roster_min, v_max), v_max));

  select * into v_group from public.regular_groups where id = p_group_id;
  if not found then
    raise exception 'Group not found';
  end if;

  if not public.is_regular_group_member(p_group_id, v_host) and v_group.host_id <> v_host then
    raise exception 'Only Rally members can schedule a game';
  end if;

  v_duration := coalesce(p_duration, 60);

  select gs.id into v_series_id
  from public.game_series gs
  where gs.regular_group_id = p_group_id
    and gs.is_active = true
  order by gs.created_at desc
  limit 1;

  if v_series_id is not null then
    v_new_id := public.spawn_series_occurrence(v_series_id, p_start_time);
    update public.activities
    set
      user_id = v_host,
      regular_group_id = p_group_id,
      player_count = 1,
      missing_players = v_max - 1,
      roster_min = v_min,
      roster_max = v_max,
      duration = v_duration,
      updated_at = now()
    where id = v_new_id;
    perform public.link_activity_to_crew_chat(v_new_id);
    return v_new_id;
  end if;

  insert into public.activities (
    user_id,
    location_id,
    sport_type,
    start_time,
    duration,
    visibility,
    player_count,
    missing_players,
    roster_min,
    roster_max,
    status,
    scheduling_mode,
    match_status,
    expires_at,
    regular_group_id,
    urgency_level
  )
  values (
    v_host,
    v_group.default_location_id,
    v_group.sport_type,
    p_start_time,
    v_duration,
    'invite_only',
    1,
    v_max - 1,
    v_min,
    v_max,
    'active',
    'fixed',
    'open',
    p_start_time,
    p_group_id,
    'normal'
  )
  returning id into v_new_id;

  perform public.link_activity_to_crew_chat(v_new_id);
  return v_new_id;
end;
$$;

revoke all on function public.schedule_group_next_game(uuid, timestamptz, integer, integer, integer, integer) from public;
grant execute on function public.schedule_group_next_game(uuid, timestamptz, integer, integer, integer, integer) to authenticated;
