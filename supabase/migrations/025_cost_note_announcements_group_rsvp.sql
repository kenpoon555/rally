-- Cost note on games, pinned Game Room announcements, group-member RSVP + chat access,
-- host-scheduled next game for Regulars crews.

alter table public.activities
  add column if not exists cost_note text;

comment on column public.activities.cost_note is
  'Optional host note (e.g. ~$8/person court, BYO drinks). Shown in Details and Game Room.';

alter table public.conversations
  add column if not exists pinned_announcement text,
  add column if not exists pinned_announcement_at timestamptz,
  add column if not exists pinned_announcement_by uuid references public.profiles(id) on delete set null;

-- Host sets or clears a sticky banner in the activity group chat.
create or replace function public.set_game_room_announcement(
  p_activity_id uuid,
  p_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_conversation_id uuid;
  v_trimmed text;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.activities a
    where a.id = p_activity_id and a.user_id = v_host
  ) then
    raise exception 'Only the host can set announcements';
  end if;

  v_trimmed := nullif(trim(coalesce(p_text, '')), '');

  select c.id into v_conversation_id
  from public.conversations c
  where c.activity_id = p_activity_id
    and c.conversation_type = 'activity_group'
  limit 1;

  if v_conversation_id is null then
    v_conversation_id := public.ensure_activity_group_conversation(p_activity_id);
  end if;

  update public.conversations
  set
    pinned_announcement = v_trimmed,
    pinned_announcement_at = case when v_trimmed is not null then now() else null end,
    pinned_announcement_by = case when v_trimmed is not null then v_host else null end,
    updated_at = now()
  where id = v_conversation_id;
end;
$$;

-- Group host schedules the next invite-only game with a chosen time and court capacity.
create or replace function public.schedule_group_next_game(
  p_group_id uuid,
  p_start_time timestamptz,
  p_player_count integer default 8,
  p_duration integer default null
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
  v_capacity integer;
  v_duration integer;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  if p_start_time <= now() then
    raise exception 'Start time must be in the future';
  end if;

  v_capacity := greatest(2, least(coalesce(p_player_count, 8), 32));

  select * into v_group from public.regular_groups where id = p_group_id;
  if not found then
    raise exception 'Group not found';
  end if;

  if v_group.host_id <> v_host then
    raise exception 'Only the group host can schedule the next game';
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
      regular_group_id = p_group_id,
      player_count = 1,
      missing_players = v_capacity - 1,
      duration = v_duration,
      updated_at = now()
    where id = v_new_id;
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
    status,
    scheduling_mode,
    match_status,
    expires_at,
    regular_group_id,
    urgency_level
  )
  values (
    v_group.host_id,
    v_group.default_location_id,
    v_group.sport_type,
    p_start_time,
    v_duration,
    'invite_only',
    1,
    v_capacity - 1,
    'active',
    'fixed',
    'open',
    p_start_time,
    p_group_id,
    'normal'
  )
  returning id into v_new_id;

  perform public.ensure_activity_group_conversation(v_new_id);
  return v_new_id;
end;
$$;

-- RSVP: group/series members can respond before join approval; cap "going" by court size.
create or replace function public.set_game_rsvp(
  p_activity_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_eligible boolean := false;
  v_going integer;
  v_capacity integer;
  v_conversation_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in ('going', 'maybe', 'not_going') then
    raise exception 'Invalid RSVP status';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
  end if;

  v_eligible := (
    v_activity.user_id = v_user
    or exists (
      select 1 from public.join_requests jr
      where jr.activity_id = p_activity_id
        and jr.user_id = v_user
        and jr.status = 'approved'
    )
    or (
      v_activity.regular_group_id is not null
      and public.is_regular_group_member(v_activity.regular_group_id, v_user)
    )
    or (
      v_activity.series_id is not null
      and exists (
        select 1 from public.game_series_members gsm
        where gsm.series_id = v_activity.series_id and gsm.user_id = v_user
      )
    )
  );

  if not v_eligible then
    raise exception 'You are not on this game';
  end if;

  v_capacity := greatest(1, coalesce(v_activity.player_count, 1) + coalesce(v_activity.missing_players, 0));

  if p_status = 'going' and v_activity.user_id <> v_user then
    select count(*)::integer into v_going
    from public.activity_rsvps ar
    where ar.activity_id = p_activity_id
      and ar.status = 'going'
      and ar.user_id <> v_activity.user_id;

    if v_going >= v_capacity - 1
      and not exists (
        select 1 from public.activity_rsvps ar2
        where ar2.activity_id = p_activity_id
          and ar2.user_id = v_user
          and ar2.status = 'going'
      )
    then
      raise exception 'Court is full for RSVP — try Maybe or Can''t go';
    end if;
  end if;

  insert into public.activity_rsvps (activity_id, user_id, status, updated_at)
  values (p_activity_id, v_user, p_status, now())
  on conflict (activity_id, user_id)
  do update set status = excluded.status, updated_at = now();

  if p_status in ('going', 'maybe') then
    select c.id into v_conversation_id
    from public.conversations c
    where c.activity_id = p_activity_id
      and c.conversation_type = 'activity_group'
    limit 1;

    if v_conversation_id is not null then
      insert into public.conversation_members (conversation_id, user_id, role, is_active)
      values (
        v_conversation_id,
        v_user,
        case when v_user = v_activity.user_id then 'host' else 'member' end,
        true
      )
      on conflict (conversation_id, user_id)
      do update set is_active = true;
    end if;
  end if;
end;
$$;

-- Regulars members can open Game Room chat to RSVP/coordinate before host approval.
create or replace function public.ensure_activity_group_conversation(
  target_activity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid;
  v_activity record;
  v_conversation_id uuid;
  v_is_host boolean;
  v_is_approved boolean;
  v_is_group_member boolean := false;
  v_has_rsvp boolean := false;
begin
  viewer_id := auth.uid();
  if viewer_id is null then
    raise exception 'Authentication required';
  end if;

  select a.* into v_activity from public.activities a where a.id = target_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'Activity is not active';
  end if;

  v_is_host := v_activity.user_id = viewer_id;
  v_is_approved := exists (
    select 1 from public.join_requests jr
    where jr.activity_id = target_activity_id
      and jr.user_id = viewer_id
      and jr.status = 'approved'
  );

  if v_activity.regular_group_id is not null then
    v_is_group_member := public.is_regular_group_member(v_activity.regular_group_id, viewer_id);
  end if;

  v_has_rsvp := exists (
    select 1 from public.activity_rsvps ar
    where ar.activity_id = target_activity_id
      and ar.user_id = viewer_id
      and ar.status in ('going', 'maybe')
  );

  if not v_is_host
    and not v_is_approved
    and not v_is_group_member
    and not v_has_rsvp
  then
    raise exception 'Only the host, approved players, or group members can open this game chat';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.activity_id = target_activity_id
    and c.conversation_type = 'activity_group'
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (conversation_type, activity_id, created_by, title)
    values ('activity_group', target_activity_id, v_activity.user_id, 'Game Chat')
    returning id into v_conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (v_conversation_id, v_activity.user_id, 'host', true)
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conversation_id, jr.user_id, 'member', true
  from public.join_requests jr
  where jr.activity_id = target_activity_id and jr.status = 'approved'
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conversation_id, ar.user_id, 'member', true
  from public.activity_rsvps ar
  where ar.activity_id = target_activity_id
    and ar.status in ('going', 'maybe')
    and ar.user_id <> v_activity.user_id
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  if v_is_group_member or v_has_rsvp or v_is_approved then
    insert into public.conversation_members (conversation_id, user_id, role, is_active)
    values (v_conversation_id, viewer_id, 'member', true)
    on conflict (conversation_id, user_id)
    do update set is_active = true;
  end if;

  update public.conversation_members cm
  set is_active = false
  where cm.conversation_id = v_conversation_id
    and cm.user_id <> v_activity.user_id
    and not exists (
      select 1 from public.join_requests jr
      where jr.activity_id = target_activity_id
        and jr.user_id = cm.user_id
        and jr.status = 'approved'
    )
    and not exists (
      select 1 from public.activity_rsvps ar
      where ar.activity_id = target_activity_id
        and ar.user_id = cm.user_id
        and ar.status in ('going', 'maybe')
    )
    and not (
      v_activity.regular_group_id is not null
      and public.is_regular_group_member(v_activity.regular_group_id, cm.user_id)
    );

  return v_conversation_id;
end;
$$;

revoke all on function public.set_game_room_announcement(uuid, text) from public;
grant execute on function public.set_game_room_announcement(uuid, text) to authenticated;
revoke all on function public.schedule_group_next_game(uuid, timestamptz, integer, integer) from public;
grant execute on function public.schedule_group_next_game(uuid, timestamptz, integer, integer) to authenticated;
