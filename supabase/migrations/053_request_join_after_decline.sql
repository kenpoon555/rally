-- Allow players to request again after a host decline (same account, any device).
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

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
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

grant execute on function public.request_join_activity(uuid) to authenticated;
