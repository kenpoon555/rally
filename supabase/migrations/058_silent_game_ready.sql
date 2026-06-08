-- I'm in / undo is roster state on the Play tab — not worth cluttering Rally chat.

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

  return v_ready_at;
end;
$$;

revoke all on function public.set_game_ready(uuid, boolean) from public;
grant execute on function public.set_game_ready(uuid, boolean) to authenticated;
