-- Public preview payload for rally-invite edge landing pages.

create or replace function public.get_rally_invite_preview(
  p_invite_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
begin
  if p_invite_token is null then
    return jsonb_build_object('found', false);
  end if;

  select * into v_group from public.regular_groups where invite_token = p_invite_token;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'group_id', v_group.id,
    'invite_token', v_group.invite_token,
    'name', v_group.name,
    'sport_type', v_group.sport_type,
    'member_count', (
      select count(*)::int
      from public.regular_group_members rgm
      where rgm.group_id = v_group.id
    ),
    'location_name', (
      select al.name
      from public.activity_locations al
      where al.id = v_group.default_location_id
    ),
    'host_username', (
      select p.username
      from public.profiles p
      where p.id = v_group.host_id
    )
  );
end;
$$;

revoke all on function public.get_rally_invite_preview(uuid) from public;
grant execute on function public.get_rally_invite_preview(uuid) to anon;
grant execute on function public.get_rally_invite_preview(uuid) to authenticated;
