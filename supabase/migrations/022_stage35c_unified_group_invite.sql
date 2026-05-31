-- Stage 3.5c: one link to join a Regulars crew and its next game (Phase 3C).
-- Joins the group, then best-effort joins/approves the soonest upcoming game so
-- the invitee lands directly in the Game Room.

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
  v_open_spots integer;
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
    -- Best-effort: never let a join rule block the group membership above.
    begin
      if v_activity.user_id <> v_user
        and not exists (
          select 1 from public.join_requests
          where activity_id = v_activity.id and user_id = v_user
        )
      then
        v_open_spots := coalesce(v_activity.missing_players, 0);
        if v_open_spots <= 0 then
          insert into public.join_requests (activity_id, user_id, status)
          values (v_activity.id, v_user, 'pending');
        else
          insert into public.join_requests (activity_id, user_id, status)
          values (v_activity.id, v_user, 'approved');
          update public.activities
          set
            player_count = coalesce(player_count, 1) + 1,
            missing_players = greatest(0, coalesce(missing_players, 0) - 1),
            updated_at = now()
          where id = v_activity.id;
          perform public.ensure_activity_group_conversation(v_activity.id);
        end if;
      end if;
    exception when others then
      null;
    end;
  end if;

  return jsonb_build_object('group_id', v_group.id, 'activity_id', v_activity_id);
end;
$$;

revoke all on function public.join_group_and_next_game(uuid) from public;
grant execute on function public.join_group_and_next_game(uuid) to authenticated;
