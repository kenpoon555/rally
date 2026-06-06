-- System messages for roster events (join, I'm in, lock) in crew + game chats.

create or replace function public.post_activity_system_message(
  p_activity_id uuid,
  p_sender_id uuid,
  p_content text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_conversation_id uuid;
begin
  if p_content is null or trim(p_content) = '' then
    return;
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    return;
  end if;

  if v_activity.regular_group_id is not null then
    v_conversation_id := public.ensure_crew_conversation(v_activity.regular_group_id);
  else
    select c.id into v_conversation_id
    from public.conversations c
    where c.activity_id = p_activity_id
      and c.conversation_type = 'activity_group'
    limit 1;
  end if;

  if v_conversation_id is null then
    return;
  end if;

  insert into public.messages (conversation_id, sender_id, message_type, content, activity_id)
  values (v_conversation_id, p_sender_id, 'system', trim(p_content), p_activity_id);

  update public.conversations
  set updated_at = now()
  where id = v_conversation_id;
end;
$$;

-- join_crew_game: post when a member joins the roster
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

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
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
  elsif not found then
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

  select coalesce(nullif(trim(p.username), ''), 'player') into v_username
  from public.profiles p
  where p.id = v_user;

  perform public.post_activity_system_message(
    p_activity_id,
    v_user,
    '@' || v_username || ' joined the roster'
  );

  return v_result;
end;
$$;

-- set_game_ready: post I'm in / undo
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
  v_username text;
  v_updated boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'This game is already finalized';
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

  v_updated := true;

  if v_updated then
    select coalesce(nullif(trim(p.username), ''), 'player') into v_username
    from public.profiles p
    where p.id = v_user;

    if p_ready then
      perform public.post_activity_system_message(
        p_activity_id,
        v_user,
        '@' || v_username || ' tapped I''m in'
      );
    else
      perform public.post_activity_system_message(
        p_activity_id,
        v_user,
        '@' || v_username || ' removed I''m in'
      );
    end if;
  end if;

  return v_ready_at;
end;
$$;

-- finalize_game_commitment: post roster locked
create or replace function public.finalize_game_commitment(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_target_total integer;
  v_approved integer;
  v_ready integer;
  v_court text;
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

  v_target_total := 1 + greatest(coalesce(v_activity.missing_players, 1), 0);

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

  if v_approved >= v_target_total and v_ready >= v_target_total then
    null;
  elsif v_approved < v_target_total and v_ready >= v_approved then
    null;
  else
    raise exception 'Not enough ready players. Everyone in the game must tap Ready, or fill the roster first.';
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

  perform public.post_activity_system_message(
    p_activity_id,
    auth.uid(),
    'Roster locked for ' || v_court || ' — see you on court!'
  );

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;

revoke all on function public.post_activity_system_message(uuid, uuid, text) from public;
grant execute on function public.post_activity_system_message(uuid, uuid, text) to authenticated;

revoke all on function public.join_crew_game(uuid) from public;
grant execute on function public.join_crew_game(uuid) to authenticated;

revoke all on function public.set_game_ready(uuid, boolean) from public;
grant execute on function public.set_game_ready(uuid, boolean) to authenticated;

revoke all on function public.finalize_game_commitment(uuid) from public;
grant execute on function public.finalize_game_commitment(uuid) to authenticated;
