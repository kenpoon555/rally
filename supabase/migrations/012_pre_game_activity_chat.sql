-- Pre-game activity chat: lobby opens at create/join; roster syncs until host finalizes.

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
  conversation_id uuid;
  v_is_host boolean;
  v_is_approved boolean;
begin
  viewer_id := auth.uid();
  if viewer_id is null then
    raise exception 'Authentication required';
  end if;

  select a.*
  into v_activity
  from public.activities a
  where a.id = target_activity_id;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'Activity is not active';
  end if;

  v_is_host := v_activity.user_id = viewer_id;
  v_is_approved := exists (
    select 1
    from public.join_requests jr
    where jr.activity_id = target_activity_id
      and jr.user_id = viewer_id
      and jr.status = 'approved'
  );

  if not v_is_host and not v_is_approved then
    raise exception 'Only the host or approved players can open this game chat';
  end if;

  select c.id
  into conversation_id
  from public.conversations c
  where c.activity_id = target_activity_id
    and c.conversation_type = 'activity_group'
  limit 1;

  if conversation_id is null then
    insert into public.conversations (conversation_type, activity_id, created_by, title)
    values ('activity_group', target_activity_id, v_activity.user_id, 'Game Chat')
    returning id into conversation_id;
  end if;

  -- Host is always in the lobby.
  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (conversation_id, v_activity.user_id, 'host', true)
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  -- Approved joiners stay in sync; withdrawn/rejected players leave the chat.
  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  select conversation_id, jr.user_id, 'member', true
  from public.join_requests jr
  where jr.activity_id = target_activity_id
    and jr.status = 'approved'
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;

  update public.conversation_members cm
  set is_active = false
  where cm.conversation_id = conversation_id
    and cm.user_id <> v_activity.user_id
    and not exists (
      select 1
      from public.join_requests jr
      where jr.activity_id = target_activity_id
        and jr.user_id = cm.user_id
        and jr.status = 'approved'
    );

  return conversation_id;
end;
$$;

revoke all on function public.ensure_activity_group_conversation(uuid) from public;
grant execute on function public.ensure_activity_group_conversation(uuid) to authenticated;

-- Backwards-compatible alias; no longer requires finalized match.
create or replace function public.create_activity_group_conversation(
  target_activity_id uuid
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.ensure_activity_group_conversation(target_activity_id);
$$;

revoke all on function public.create_activity_group_conversation(uuid) from public;
grant execute on function public.create_activity_group_conversation(uuid) to authenticated;
