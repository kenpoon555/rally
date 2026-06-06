-- leave_game called ensure_activity_group_conversation after deleting the join row,
-- so the leaving user failed the access check and got "Leave failed".
create or replace function public.leave_game(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_join record;
  v_was_approved boolean := false;
  v_hours_before numeric;
  v_deleted int;
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

  select * into v_join
  from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status = 'approved';

  if found then
    v_was_approved := true;
    v_hours_before := extract(epoch from (v_activity.start_time - now())) / 3600.0;
    insert into public.activity_game_flakes (
      activity_id,
      user_id,
      was_ready,
      hours_before_start
    )
    values (
      p_activity_id,
      v_user,
      v_join.ready_at is not null,
      v_hours_before
    )
    on conflict (activity_id, user_id) do nothing;
  end if;

  delete from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status in ('pending', 'approved', 'waitlisted');

  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    raise exception 'You are not on this game';
  end if;

  if v_was_approved then
    update public.activities
    set
      player_count = greatest(1, coalesce(player_count, 1) - 1),
      missing_players = coalesce(missing_players, 0) + 1,
      updated_at = now()
    where id = p_activity_id;
  end if;

  update public.conversation_members cm
  set is_active = false
  from public.conversations c
  where c.id = cm.conversation_id
    and c.activity_id = p_activity_id
    and c.conversation_type = 'activity_group'
    and cm.user_id = v_user;
end;
$$;
