-- Public preview payload for game-invite edge landing pages.

create or replace function public.get_game_invite_preview(
  p_activity_id uuid default null,
  p_invite_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
begin
  if p_activity_id is not null then
    select * into v_activity from public.activities where id = p_activity_id;
  elsif p_invite_token is not null then
    select * into v_activity from public.activities where invite_token = p_invite_token;
  else
    return jsonb_build_object('found', false);
  end if;

  if not found or v_activity.status <> 'active' then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'activity_id', v_activity.id,
    'invite_token', v_activity.invite_token,
    'sport_type', v_activity.sport_type,
    'start_time', v_activity.start_time,
    'listing_title', v_activity.listing_title,
    'missing_players', coalesce(v_activity.missing_players, 0),
    'location_name', (
      select al.name
      from public.activity_locations al
      where al.id = v_activity.location_id
    ),
    'host_username', (
      select p.username
      from public.profiles p
      where p.id = v_activity.user_id
    )
  );
end;
$$;

revoke all on function public.get_game_invite_preview(uuid, uuid) from public;
grant execute on function public.get_game_invite_preview(uuid, uuid) to anon;
grant execute on function public.get_game_invite_preview(uuid, uuid) to authenticated;
