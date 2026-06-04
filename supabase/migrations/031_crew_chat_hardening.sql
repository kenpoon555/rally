-- P0–P2: crew chat hardening (announcements, is_current, backfill, RSVP deprecate, invite join result, TZ, roster sync, inbox RPC)

-- Optional host timezone for session labels (defaults LA beta)
alter table public.profiles
  add column if not exists timezone text;

-- Format activity start for system messages
create or replace function public.format_activity_session_label(p_start_time timestamptz, p_host_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select to_char(
    p_start_time at time zone coalesce(
      nullif(trim((select pr.timezone from public.profiles pr where pr.id = p_host_id)), ''),
      'America/Los_Angeles'
    ),
    'Dy Mon DD, HH12:MI AM'
  );
$$;

-- Mark is_current on the soonest upcoming active linked game (else latest active)
create or replace function public.refresh_crew_conversation_current_session(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_activity_id uuid;
begin
  update public.conversation_activities
  set is_current = false
  where conversation_id = p_conversation_id;

  select ca.activity_id into v_target_activity_id
  from public.conversation_activities ca
  join public.activities a on a.id = ca.activity_id
  where ca.conversation_id = p_conversation_id
    and a.status = 'active'
    and a.start_time >= now()
  order by a.start_time asc
  limit 1;

  if v_target_activity_id is null then
    select ca.activity_id into v_target_activity_id
    from public.conversation_activities ca
    join public.activities a on a.id = ca.activity_id
    where ca.conversation_id = p_conversation_id
      and a.status = 'active'
    order by a.start_time desc
    limit 1;
  end if;

  if v_target_activity_id is not null then
    update public.conversation_activities
    set is_current = true
    where conversation_id = p_conversation_id
      and activity_id = v_target_activity_id;
  end if;
end;
$$;

-- Link activity + refresh is_current (next upcoming, not last scheduled)
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
  v_posted_system boolean := false;
begin
  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.regular_group_id is null then
    raise exception 'Activity is not linked to a crew';
  end if;

  v_conversation_id := public.ensure_crew_conversation(v_activity.regular_group_id);

  select coalesce(max(ca.position), 0) + 1 into v_position
  from public.conversation_activities ca
  where ca.conversation_id = v_conversation_id;

  insert into public.conversation_activities (
    conversation_id,
    activity_id,
    position,
    is_current
  )
  values (v_conversation_id, p_activity_id, v_position, false)
  on conflict (conversation_id, activity_id)
  do update set position = excluded.position;

  perform public.refresh_crew_conversation_current_session(v_conversation_id);

  v_time_label := public.format_activity_session_label(v_activity.start_time, v_activity.user_id);

  select exists (
    select 1
    from public.messages m
    where m.conversation_id = v_conversation_id
      and m.activity_id = p_activity_id
      and m.message_type = 'system'
      and m.content like 'New game scheduled:%'
  ) into v_posted_system;

  if not v_posted_system then
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
  end if;

  return v_conversation_id;
end;
$$;

-- Backfill junction rows (no system-message spam for historical games)
do $$
declare
  v_row record;
  v_conversation_id uuid;
  v_position integer;
begin
  for v_row in
    select a.id as activity_id, a.regular_group_id as group_id, a.start_time
    from public.activities a
    where a.regular_group_id is not null
      and not exists (
        select 1
        from public.conversation_activities ca
        where ca.activity_id = a.id
      )
    order by a.start_time asc
  loop
    begin
      select c.id into v_conversation_id
      from public.conversations c
      where c.conversation_type = 'crew_group'
        and c.regular_group_id = v_row.group_id
      limit 1;

      if v_conversation_id is null then
        insert into public.conversations (
          conversation_type, regular_group_id, created_by, title
        )
        select 'crew_group', rg.id, rg.host_id, rg.name
        from public.regular_groups rg
        where rg.id = v_row.group_id
        returning id into v_conversation_id;
      end if;

      select coalesce(max(ca.position), 0) + 1 into v_position
      from public.conversation_activities ca
      where ca.conversation_id = v_conversation_id;
      insert into public.conversation_activities (
        conversation_id, activity_id, position, is_current
      )
      values (v_conversation_id, v_row.activity_id, v_position, false)
      on conflict (conversation_id, activity_id) do nothing;
    exception when others then
      raise notice 'backfill skip activity %: %', v_row.activity_id, sqlerrm;
    end;
  end loop;

  for v_conversation_id in
    select distinct c.id
    from public.conversations c
    where c.conversation_type = 'crew_group'
  loop
    perform public.refresh_crew_conversation_current_session(v_conversation_id);
  end loop;
end $$;

-- Announcements: crew_group + activity_group
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
  v_group_id uuid;
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

  select a.regular_group_id into v_group_id
  from public.activities a
  where a.id = p_activity_id;

  if v_group_id is not null then
    select c.id into v_conversation_id
    from public.conversations c
    where c.conversation_type = 'crew_group'
      and c.regular_group_id = v_group_id
    limit 1;

    if v_conversation_id is null then
      v_conversation_id := public.ensure_crew_conversation(v_group_id);
    end if;
  else
    select c.id into v_conversation_id
    from public.conversations c
    where c.activity_id = p_activity_id
      and c.conversation_type = 'activity_group'
    limit 1;

    if v_conversation_id is null then
      v_conversation_id := public.ensure_activity_group_conversation(p_activity_id);
    end if;
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

create or replace function public.set_conversation_announcement(
  p_conversation_id uuid,
  p_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_convo record;
  v_trimmed text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_convo from public.conversations where id = p_conversation_id;
  if not found then
    raise exception 'Conversation not found';
  end if;

  if v_convo.conversation_type = 'crew_group' then
    if not exists (
      select 1 from public.regular_groups rg
      where rg.id = v_convo.regular_group_id and rg.host_id = v_user
    ) then
      raise exception 'Only the crew host can set announcements';
    end if;
  elsif v_convo.conversation_type = 'activity_group' then
    if not exists (
      select 1 from public.activities a
      where a.id = v_convo.activity_id and a.user_id = v_user
    ) then
      raise exception 'Only the game host can set announcements';
    end if;
  else
    raise exception 'Announcements are not supported for this chat type';
  end if;

  v_trimmed := nullif(trim(coalesce(p_text, '')), '');

  update public.conversations
  set
    pinned_announcement = v_trimmed,
    pinned_announcement_at = case when v_trimmed is not null then now() else null end,
    pinned_announcement_by = case when v_trimmed is not null then v_user else null end,
    updated_at = now()
  where id = p_conversation_id;
end;
$$;

-- Deprecate RSVP (product uses Join + I'm in)
create or replace function public.set_game_rsvp(
  p_activity_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'RSVP is no longer supported. Join the game and tap I''m in when you can play.';
end;
$$;

-- Structured invite join result
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
  v_joined_game boolean := false;
  v_join_error text := null;
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
    if v_activity.user_id = v_user then
      v_joined_game := true;
    else
      begin
        perform public.join_crew_game(v_activity.id);
        v_joined_game := true;
      exception
        when others then
          v_join_error := sqlerrm;
          if v_join_error ilike '%open spots%' or v_join_error ilike '%full%' then
            v_join_error := 'full';
          elsif v_join_error ilike '%not active%' then
            v_join_error := 'inactive';
          else
            v_join_error := 'failed';
          end if;
      end;
    end if;
  end if;

  return jsonb_build_object(
    'group_id', v_group.id,
    'activity_id', v_activity_id,
    'conversation_id', (
      select c.id from public.conversations c
      where c.conversation_type = 'crew_group'
        and c.regular_group_id = v_group.id
      limit 1
    ),
    'joined_game', v_joined_game,
    'join_game_error', v_join_error
  );
end;
$$;

-- Keep roster counters aligned with approved join_requests (+ host)
create or replace function public.sync_activity_roster_counts(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_approved integer;
  v_capacity integer;
begin
  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    return;
  end if;

  select count(*)::integer into v_approved
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.status = 'approved';

  v_capacity := greatest(v_approved + 1, coalesce(v_activity.player_count, 1));
  if coalesce(v_activity.missing_players, 0) + coalesce(v_activity.player_count, 1) > v_capacity then
    v_capacity := coalesce(v_activity.player_count, 1) + coalesce(v_activity.missing_players, 0);
  end if;

  update public.activities
  set
    player_count = v_approved + 1,
    missing_players = greatest(0, v_capacity - (v_approved + 1)),
    updated_at = now()
  where id = p_activity_id;
end;
$$;

create or replace function public.trg_sync_activity_roster_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_activity_roster_counts(coalesce(new.activity_id, old.activity_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_roster_counts_on_join_requests on public.join_requests;
create trigger sync_roster_counts_on_join_requests
  after insert or update of status or delete on public.join_requests
  for each row
  execute function public.trg_sync_activity_roster_counts();

-- Inbox: last message per conversation (one round trip)
create or replace function public.get_inbox_message_previews(p_conversation_ids uuid[])
returns table (
  conversation_id uuid,
  content text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (m.conversation_id)
    m.conversation_id,
    m.content,
    m.created_at
  from public.messages m
  where m.conversation_id = any(p_conversation_ids)
    and m.deleted_at is null
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = m.conversation_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  order by m.conversation_id, m.created_at desc;
$$;

revoke all on function public.refresh_crew_conversation_current_session(uuid) from public;
grant execute on function public.refresh_crew_conversation_current_session(uuid) to authenticated;
revoke all on function public.set_conversation_announcement(uuid, text) from public;
grant execute on function public.set_conversation_announcement(uuid, text) to authenticated;
revoke all on function public.get_inbox_message_previews(uuid[]) from public;
grant execute on function public.get_inbox_message_previews(uuid[]) to authenticated;
revoke all on function public.sync_activity_roster_counts(uuid) from public;
grant execute on function public.sync_activity_roster_counts(uuid) to authenticated;
