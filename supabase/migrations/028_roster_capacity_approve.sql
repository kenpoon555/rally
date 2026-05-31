-- 028: Atomic join approval with roster capacity + leave restores open spot

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

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
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
end;
$$;

grant execute on function public.approve_join_request(uuid, uuid) to authenticated;

-- Restore an open spot when an approved player leaves before finalize.
create or replace function public.leave_game(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_was_approved boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id for update;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id = v_user then
    raise exception 'Host cannot leave — cancel the game instead';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Cannot leave after the game is finalized';
  end if;

  select exists (
    select 1 from public.join_requests
    where activity_id = p_activity_id
      and user_id = v_user
      and status = 'approved'
  ) into v_was_approved;

  delete from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status in ('pending', 'approved');

  if not found then
    raise exception 'You are not on this game';
  end if;

  update public.activities
  set
    player_count = greatest(1, coalesce(player_count, 1) - 1),
    missing_players = case
      when v_was_approved then coalesce(missing_players, 0) + 1
      else missing_players
    end,
    updated_at = now()
  where id = p_activity_id;

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;
