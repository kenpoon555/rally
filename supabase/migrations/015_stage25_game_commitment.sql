-- Stage 2.5: ready signals, host finalize (fixed + flex), leave before finalize.

alter table public.join_requests
  add column if not exists ready_at timestamptz;

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

create or replace function public.leave_game(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id = v_user then
    raise exception 'Host cannot leave — cancel the game instead';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Cannot leave after the game is finalized';
  end if;

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
    updated_at = now()
  where id = p_activity_id;

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;

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

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;

revoke all on function public.set_game_ready(uuid, boolean) from public;
grant execute on function public.set_game_ready(uuid, boolean) to authenticated;

revoke all on function public.leave_game(uuid) from public;
grant execute on function public.leave_game(uuid) to authenticated;

revoke all on function public.finalize_game_commitment(uuid) from public;
grant execute on function public.finalize_game_commitment(uuid) to authenticated;
