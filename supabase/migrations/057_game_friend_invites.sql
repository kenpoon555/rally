-- In-app friend invites to a specific game (not Rally membership).

create table if not exists public.activity_friend_invites (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (activity_id, invited_user_id)
);

create index if not exists idx_activity_friend_invites_invitee
  on public.activity_friend_invites(invited_user_id, status, created_at desc);

create index if not exists idx_activity_friend_invites_activity
  on public.activity_friend_invites(activity_id, status, created_at desc);

alter table public.activity_friend_invites enable row level security;

drop policy if exists "Parties view game friend invites" on public.activity_friend_invites;
create policy "Parties view game friend invites"
  on public.activity_friend_invites for select
  using (
    invited_user_id = auth.uid()
    or invited_by = auth.uid()
    or exists (
      select 1
      from public.activities a
      where a.id = activity_friend_invites.activity_id
        and a.user_id = auth.uid()
    )
  );

create or replace function public._user_can_invite_to_activity(
  p_activity_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.activities a
    where a.id = p_activity_id
      and a.user_id = p_user_id
  )
  or exists (
    select 1
    from public.join_requests jr
    where jr.activity_id = p_activity_id
      and jr.user_id = p_user_id
      and jr.status = 'approved'
  );
$$;

revoke all on function public._user_can_invite_to_activity(uuid, uuid) from public;
grant execute on function public._user_can_invite_to_activity(uuid, uuid) to authenticated;

create or replace function public._ensure_game_guest_chat_access(
  p_activity_id uuid,
  p_user_id uuid
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
  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    return;
  end if;

  if v_activity.regular_group_id is null then
    perform public.ensure_activity_group_conversation(p_activity_id);
    return;
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.conversation_type = 'crew_group'
    and c.regular_group_id = v_activity.regular_group_id
  limit 1;

  if v_conversation_id is null then
    return;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, is_active)
  values (v_conversation_id, p_user_id, 'member', true)
  on conflict (conversation_id, user_id)
  do update set is_active = true, role = excluded.role;
end;
$$;

revoke all on function public._ensure_game_guest_chat_access(uuid, uuid) from public;
grant execute on function public._ensure_game_guest_chat_access(uuid, uuid) to authenticated;

create or replace function public.invite_friend_to_activity(
  p_activity_id uuid,
  p_friend_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_invite_id uuid;
  v_existing_status text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_friend_user_id is null or p_friend_user_id = v_user then
    raise exception 'Pick a friend to invite';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'This game is no longer open';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
  end if;

  if not public._user_can_invite_to_activity(p_activity_id, v_user) then
    raise exception 'Only players on this game can invite friends';
  end if;

  if not public._users_are_friends(v_user, p_friend_user_id) then
    raise exception 'You can only invite friends on Rally';
  end if;

  if v_activity.user_id = p_friend_user_id then
    raise exception 'They are already hosting this game';
  end if;

  if exists (
    select 1
    from public.join_requests jr
    where jr.activity_id = p_activity_id
      and jr.user_id = p_friend_user_id
      and jr.status = 'approved'
  ) then
    raise exception 'They are already on this game';
  end if;

  select id, status into v_invite_id, v_existing_status
  from public.activity_friend_invites
  where activity_id = p_activity_id and invited_user_id = p_friend_user_id;

  if v_invite_id is not null and v_existing_status = 'accepted' then
    raise exception 'They are already on this game';
  end if;

  if v_invite_id is not null then
    update public.activity_friend_invites
    set
      invited_by = v_user,
      status = 'pending',
      responded_at = null,
      created_at = now()
    where id = v_invite_id;
  else
    insert into public.activity_friend_invites (
      activity_id,
      invited_user_id,
      invited_by,
      status
    )
    values (p_activity_id, p_friend_user_id, v_user, 'pending')
    returning id into v_invite_id;
  end if;

  return v_invite_id;
end;
$$;

create or replace function public.list_activity_outgoing_friend_invites(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not public._user_can_invite_to_activity(p_activity_id, v_user) then
    raise exception 'Only players on this game can view invites';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        afi.id,
        afi.invited_user_id,
        afi.status,
        afi.created_at,
        p.username as invited_username
      from public.activity_friend_invites afi
      join public.profiles p on p.id = afi.invited_user_id
      where afi.activity_id = p_activity_id
        and afi.status = 'pending'
      order by afi.created_at desc
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_my_pending_game_friend_invites()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        afi.id,
        afi.activity_id,
        afi.invited_by,
        afi.created_at,
        ip.username as inviter_username,
        a.sport_type,
        a.start_time,
        a.regular_group_id,
        al.name as location_name,
        coalesce(a.missing_players, 0) as open_spots
      from public.activity_friend_invites afi
      join public.activities a on a.id = afi.activity_id
      join public.profiles ip on ip.id = afi.invited_by
      left join public.activity_locations al on al.id = a.location_id
      where afi.invited_user_id = v_user
        and afi.status = 'pending'
        and a.status = 'active'
      order by afi.created_at desc
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.respond_game_friend_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite record;
  v_activity record;
  v_join_id uuid;
  v_was_approved boolean := false;
  v_open_spots integer;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_invite
  from public.activity_friend_invites
  where id = p_invite_id and invited_user_id = v_user
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite already handled';
  end if;

  if not p_accept then
    update public.activity_friend_invites
    set status = 'declined', responded_at = now()
    where id = p_invite_id;
    return;
  end if;

  select * into v_activity from public.activities where id = v_invite.activity_id for update;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'This game is no longer open';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
  end if;

  perform public.assert_user_can_join_activity(v_invite.activity_id);

  select id, status = 'approved' into v_join_id, v_was_approved
  from public.join_requests
  where activity_id = v_invite.activity_id and user_id = v_user;

  v_open_spots := coalesce(v_activity.missing_players, 0);

  if v_open_spots <= 0 then
    if v_join_id is null then
      insert into public.join_requests (activity_id, user_id, status)
      values (v_invite.activity_id, v_user, 'waitlisted');
    elsif not v_was_approved then
      update public.join_requests
      set status = 'waitlisted', updated_at = now()
      where id = v_join_id;
    end if;
  elsif v_join_id is null then
    insert into public.join_requests (activity_id, user_id, status, responded_at)
    values (v_invite.activity_id, v_user, 'approved', now());
    v_was_approved := false;
  elsif not v_was_approved then
    update public.join_requests
    set status = 'approved', responded_at = now(), updated_at = now()
    where id = v_join_id;
  end if;

  update public.activity_friend_invites
  set status = 'accepted', responded_at = now()
  where id = p_invite_id;

  if v_open_spots > 0 and not v_was_approved then
    update public.activities
    set
      player_count = coalesce(player_count, 1) + 1,
      missing_players = greatest(coalesce(missing_players, 0) - 1, 0),
      updated_at = now()
    where id = v_invite.activity_id;
  end if;

  perform public._ensure_game_guest_chat_access(v_invite.activity_id, v_user);
end;
$$;

grant execute on function public.invite_friend_to_activity(uuid, uuid) to authenticated;
grant execute on function public.list_activity_outgoing_friend_invites(uuid) to authenticated;
grant execute on function public.list_my_pending_game_friend_invites() to authenticated;
grant execute on function public.respond_game_friend_invite(uuid, boolean) to authenticated;
