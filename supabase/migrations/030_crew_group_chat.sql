-- Crew group chat: one persistent conversation per regular_group with multiple game sessions.

-- 1) Extend conversations for crew_group
alter table public.conversations
  drop constraint if exists conversations_conversation_type_check;

alter table public.conversations
  add constraint conversations_conversation_type_check
  check (conversation_type in ('activity_group', 'friend_direct', 'crew_group'));

alter table public.conversations
  add column if not exists regular_group_id uuid references public.regular_groups(id) on delete cascade;

create unique index if not exists idx_conversations_crew_group_unique
  on public.conversations(regular_group_id)
  where conversation_type = 'crew_group' and regular_group_id is not null;

-- 2) Link activities to crew conversations
create table if not exists public.conversation_activities (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  position integer not null default 1,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (conversation_id, activity_id)
);

create index if not exists idx_conversation_activities_conversation
  on public.conversation_activities(conversation_id, position);

create index if not exists idx_conversation_activities_activity
  on public.conversation_activities(activity_id);

alter table public.conversation_activities enable row level security;

drop policy if exists "Crew members view conversation activities" on public.conversation_activities;
create policy "Crew members view conversation activities"
  on public.conversation_activities for select
  using (
    exists (
      select 1
      from public.conversations c
      join public.regular_group_members rgm
        on rgm.group_id = c.regular_group_id
      where c.id = conversation_activities.conversation_id
        and rgm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.conversations c
      join public.regular_groups rg on rg.id = c.regular_group_id
      where c.id = conversation_activities.conversation_id
        and rg.host_id = auth.uid()
    )
  );

-- 3) Optional activity_id on messages for session dividers
alter table public.messages
  add column if not exists activity_id uuid references public.activities(id) on delete set null;

-- 4) ensure_crew_conversation
create or replace function public.ensure_crew_conversation(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group record;
  v_conversation_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_group from public.regular_groups where id = p_group_id;
  if not found then
    raise exception 'Crew not found';
  end if;

  if not public.is_regular_group_member(p_group_id, v_user) and v_group.host_id <> v_user then
    raise exception 'Only crew members can open this chat';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.conversation_type = 'crew_group'
    and c.regular_group_id = p_group_id
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (
      conversation_type,
      regular_group_id,
      created_by,
      title
    )
    values ('crew_group', p_group_id, v_group.host_id, v_group.name)
    returning id into v_conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (v_conversation_id, v_group.host_id, 'host', true)
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = 'host';

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select v_conversation_id, rgm.user_id, rgm.role, true
  from public.regular_group_members rgm
  where rgm.group_id = p_group_id
    and rgm.user_id <> v_group.host_id
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  return v_conversation_id;
end;
$$;

-- 5) link_activity_to_crew_chat
create or replace function public.link_activity_to_crew_chat(p_activity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_conversation_id uuid;
  v_position integer;
  v_time_label text;
begin
  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.regular_group_id is null then
    raise exception 'Activity is not linked to a crew';
  end if;

  v_conversation_id := public.ensure_crew_conversation(v_activity.regular_group_id);

  update public.conversation_activities
  set is_current = false
  where conversation_id = v_conversation_id;

  select coalesce(max(ca.position), 0) + 1 into v_position
  from public.conversation_activities ca
  where ca.conversation_id = v_conversation_id;

  insert into public.conversation_activities (
    conversation_id,
    activity_id,
    position,
    is_current
  )
  values (v_conversation_id, p_activity_id, v_position, true)
  on conflict (conversation_id, activity_id)
  do update set is_current = true, position = excluded.position;

  v_time_label := to_char(v_activity.start_time at time zone 'America/Los_Angeles', 'Dy Mon DD, HH12:MI AM');

  insert into public.messages (
    conversation_id,
    sender_id,
    message_type,
    content,
    activity_id
  )
  values (
    v_conversation_id,
    v_activity.user_id,
    'system',
    'New game scheduled: ' || coalesce(v_activity.sport_type, 'Game') || ' · ' || v_time_label,
    p_activity_id
  );

  return v_conversation_id;
end;
$$;

-- 6) join_crew_game — direct join for crew members (no pending request)
create or replace function public.join_crew_game(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_open_spots integer;
  v_existing record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.regular_group_id is null then
    raise exception 'This is not a crew game';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'Game is not active';
  end if;

  if v_activity.user_id = v_user then
    return;
  end if;

  if not public.is_regular_group_member(v_activity.regular_group_id, v_user) then
    raise exception 'Join the crew before joining this game';
  end if;

  select * into v_existing
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.user_id = v_user;

  if found and v_existing.status = 'approved' then
    return;
  end if;

  v_open_spots := coalesce(v_activity.missing_players, 0);

  if found and v_existing.status = 'pending' then
    if v_open_spots <= 0 then
      raise exception 'No open spots on this game';
    end if;
    update public.join_requests
    set status = 'approved', updated_at = now()
    where id = v_existing.id;
  elsif not found then
    if v_open_spots <= 0 then
      raise exception 'No open spots on this game';
    end if;
    insert into public.join_requests (activity_id, user_id, status)
    values (p_activity_id, v_user, 'approved');
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
end;
$$;

-- 7) schedule_group_next_game — link to crew chat instead of per-activity chat
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

  perform public.link_activity_to_crew_chat(v_new_id);
  return v_new_id;
end;
$$;

-- 8) create_regular_group_from_activity — also create crew chat + link first activity
create or replace function public.create_regular_group_from_activity(
  p_activity_id uuid,
  p_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_group_id uuid;
  v_name text;
  v_join record;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> v_host then
    raise exception 'Only the host can create a Regulars group from this game';
  end if;

  if v_activity.regular_group_id is not null then
    perform public.link_activity_to_crew_chat(p_activity_id);
    return v_activity.regular_group_id;
  end if;

  v_name := nullif(trim(p_name), '');
  if v_name is null then
    select coalesce(
      al.name || ' Regulars',
      v_activity.sport_type || ' Regulars'
    )
    into v_name
    from public.activity_locations al
    where al.id = v_activity.location_id;

    v_name := coalesce(v_name, v_activity.sport_type || ' Regulars');
  end if;

  insert into public.regular_groups (
    host_id,
    name,
    sport_type,
    default_location_id,
    series_id,
    source_activity_id
  )
  values (
    v_host,
    v_name,
    v_activity.sport_type,
    v_activity.location_id,
    v_activity.series_id,
    p_activity_id
  )
  returning id into v_group_id;

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_group_id, v_host, 'host')
  on conflict do nothing;

  for v_join in
    select jr.user_id
    from public.join_requests jr
    where jr.activity_id = p_activity_id and jr.status = 'approved'
  loop
    insert into public.regular_group_members (group_id, user_id, role)
    values (v_group_id, v_join.user_id, 'member')
    on conflict do nothing;
  end loop;

  update public.activities
  set regular_group_id = v_group_id, updated_at = now()
  where id = p_activity_id;

  if v_activity.series_id is not null then
    update public.game_series
    set regular_group_id = v_group_id
    where id = v_activity.series_id and regular_group_id is null;
  end if;

  perform public.link_activity_to_crew_chat(p_activity_id);
  return v_group_id;
end;
$$;

-- 9) join_group_and_next_game — use join_crew_game
create or replace function public.join_group_and_next_game(p_group_invite_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group record;
  v_activity record;
  v_activity_id uuid := null;
  v_found boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_group from public.regular_groups where invite_token = p_group_invite_token;
  if not found then
    raise exception 'Group invite link is invalid or expired';
  end if;

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_group.id, v_user, 'member')
  on conflict do nothing;

  perform public.ensure_crew_conversation(v_group.id);

  select a.* into v_activity
  from public.activities a
  where (
      a.regular_group_id = v_group.id
      or (
        a.series_id is not null
        and a.series_id in (
          select gs.id from public.game_series gs where gs.regular_group_id = v_group.id
        )
      )
    )
    and a.status = 'active'
    and a.start_time >= now()
  order by a.start_time asc
  limit 1;
  v_found := found;

  if v_found then
    v_activity_id := v_activity.id;
    begin
      if v_activity.user_id <> v_user then
        perform public.join_crew_game(v_activity.id);
      end if;
    exception when others then
      null;
    end;
  end if;

  return jsonb_build_object(
    'group_id', v_group.id,
    'activity_id', v_activity_id,
    'conversation_id', (
      select c.id from public.conversations c
      where c.conversation_type = 'crew_group'
        and c.regular_group_id = v_group.id
      limit 1
    )
  );
end;
$$;

-- 10) ensure_activity_group_conversation — Discover one-offs only (no RSVP, no crew)
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
begin
  viewer_id := auth.uid();
  if viewer_id is null then
    raise exception 'Authentication required';
  end if;

  select a.* into v_activity from public.activities a where a.id = target_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.regular_group_id is not null then
    return public.ensure_crew_conversation(v_activity.regular_group_id);
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

  if not v_is_host and not v_is_approved then
    raise exception 'Only the host or approved players can open this game chat';
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

  if v_is_approved then
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
    );

  return v_conversation_id;
end;
$$;

revoke all on function public.ensure_crew_conversation(uuid) from public;
grant execute on function public.ensure_crew_conversation(uuid) to authenticated;
revoke all on function public.link_activity_to_crew_chat(uuid) from public;
grant execute on function public.link_activity_to_crew_chat(uuid) to authenticated;
revoke all on function public.join_crew_game(uuid) from public;
grant execute on function public.join_crew_game(uuid) to authenticated;
