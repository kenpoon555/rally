-- Phase 1.1: Single-round-trip session card payload for crew chat + Regulars.

create index if not exists idx_activities_regular_group_start
  on public.activities(regular_group_id, start_time desc)
  where regular_group_id is not null;

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
  v_target_total int;
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

  v_target_total := 1 + greatest(coalesce(v_activity.missing_players, 1), 0);
  v_can_finalize :=
    (v_roster_count >= v_target_total and v_ready_count >= v_target_total)
    or (v_roster_count < v_target_total and v_ready_count >= v_roster_count);

  if v_approved_non_host = 0 then
    v_lock_readiness := 'needs_players';
  elsif v_can_finalize then
    v_lock_readiness := 'ready';
  elsif v_roster_count < v_target_total then
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
    and not v_is_finalized;

  v_can_nudge :=
    v_is_host
    and v_show_actions
    and exists (
      select 1 from public.join_requests jr
      where jr.activity_id = p_activity_id
        and jr.status = 'approved'
        and jr.ready_at is null
    );

  v_can_lock := v_is_host and v_show_actions and v_approved_non_host >= 1;

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

create or replace function public.get_session_card_payload(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  return public._build_session_card_payload(p_activity_id, v_user);
end;
$$;

create or replace function public.list_crew_session_cards(
  p_regular_group_id uuid,
  p_limit int default 12
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_regular_group_member(p_regular_group_id, v_user) then
    raise exception 'Not a crew member';
  end if;

  return coalesce((
    select jsonb_agg(
      public._build_session_card_payload(a.id, v_user)
      order by a.start_time desc
    )
    from (
      select id
      from public.activities
      where regular_group_id = p_regular_group_id
      order by start_time desc
      limit greatest(1, least(p_limit, 30))
    ) a
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_conversation_session_cards(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = v_user
      and cm.is_active = true
  ) then
    raise exception 'Not a conversation member';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'conversation_activity_id', ca.id,
        'activity_id', ca.activity_id,
        'position', ca.position,
        'is_current', ca.is_current,
        'card', public._build_session_card_payload(ca.activity_id, v_user)
      )
      order by ca.position asc
    )
    from public.conversation_activities ca
    where ca.conversation_id = p_conversation_id
  ), '[]'::jsonb);
end;
$$;

revoke all on function public._build_session_card_payload(uuid, uuid) from public;

revoke all on function public.get_session_card_payload(uuid) from public;
grant execute on function public.get_session_card_payload(uuid) to authenticated;

revoke all on function public.list_crew_session_cards(uuid, int) from public;
grant execute on function public.list_crew_session_cards(uuid, int) to authenticated;

revoke all on function public.list_conversation_session_cards(uuid) from public;
grant execute on function public.list_conversation_session_cards(uuid) to authenticated;
