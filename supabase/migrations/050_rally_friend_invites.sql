-- In-app Rally friend invites (accepted friends only).

create table if not exists public.regular_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.regular_groups(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (group_id, invited_user_id)
);

create index if not exists idx_regular_group_invites_invitee
  on public.regular_group_invites(invited_user_id, status, created_at desc);

create index if not exists idx_regular_group_invites_group
  on public.regular_group_invites(group_id, status, created_at desc);

alter table public.regular_group_invites enable row level security;

drop policy if exists "Members view rally invites for their group" on public.regular_group_invites;
create policy "Members view rally invites for their group"
  on public.regular_group_invites for select
  using (
    invited_user_id = auth.uid()
    or invited_by = auth.uid()
    or public.is_regular_group_member(group_id, auth.uid())
  );

create or replace function public._users_are_friends(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friends f
    where f.status = 'accepted'
      and (
        (f.user_id = p_user_a and f.friend_id = p_user_b)
        or (f.friend_id = p_user_a and f.user_id = p_user_b)
      )
  );
$$;

revoke all on function public._users_are_friends(uuid, uuid) from public;
grant execute on function public._users_are_friends(uuid, uuid) to authenticated;

create or replace function public.invite_friend_to_regular_group(
  p_group_id uuid,
  p_friend_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite_id uuid;
  v_existing_status text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_friend_user_id is null or p_friend_user_id = v_user then
    raise exception 'Pick a friend to invite';
  end if;

  if not public.is_regular_group_member(p_group_id, v_user) then
    raise exception 'Only Rally members can invite friends';
  end if;

  if not public._users_are_friends(v_user, p_friend_user_id) then
    raise exception 'You can only invite friends on Rally';
  end if;

  if public.is_regular_group_member(p_group_id, p_friend_user_id) then
    raise exception 'They are already in this Rally';
  end if;

  select id, status into v_invite_id, v_existing_status
  from public.regular_group_invites
  where group_id = p_group_id and invited_user_id = p_friend_user_id;

  if v_invite_id is not null and v_existing_status = 'accepted' then
    raise exception 'They are already in this Rally';
  end if;

  if v_invite_id is not null then
    update public.regular_group_invites
    set
      invited_by = v_user,
      status = 'pending',
      responded_at = null,
      created_at = now()
    where id = v_invite_id;
  else
    insert into public.regular_group_invites (
      group_id,
      invited_user_id,
      invited_by,
      status
    )
    values (p_group_id, p_friend_user_id, v_user, 'pending')
    returning id into v_invite_id;
  end if;

  return v_invite_id;
end;
$$;

create or replace function public.accept_regular_group_friend_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite record;
  v_conversation_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_invite
  from public.regular_group_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.invited_user_id <> v_user then
    raise exception 'This invite is not for you';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is no longer active';
  end if;

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_invite.group_id, v_user, 'member')
  on conflict do nothing;

  update public.regular_group_invites
  set status = 'accepted', responded_at = now()
  where id = p_invite_id;

  v_conversation_id := public.ensure_crew_conversation(v_invite.group_id);

  return jsonb_build_object(
    'group_id', v_invite.group_id,
    'conversation_id', v_conversation_id
  );
end;
$$;

create or replace function public.decline_regular_group_friend_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_invite
  from public.regular_group_invites
  where id = p_invite_id;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.invited_user_id <> v_user then
    raise exception 'This invite is not for you';
  end if;

  update public.regular_group_invites
  set status = 'declined', responded_at = now()
  where id = p_invite_id;
end;
$$;

create or replace function public.list_my_pending_regular_group_invites()
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
    select jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'group_id', i.group_id,
        'group_name', rg.name,
        'sport_type', rg.sport_type,
        'invited_by', i.invited_by,
        'inviter_username', p.username,
        'created_at', i.created_at
      )
      order by i.created_at desc
    )
    from public.regular_group_invites i
    join public.regular_groups rg on rg.id = i.group_id
    join public.profiles p on p.id = i.invited_by
    where i.invited_user_id = v_user
      and i.status = 'pending'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_regular_group_outgoing_invites(p_group_id uuid)
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

  if not public.is_regular_group_member(p_group_id, v_user) then
    raise exception 'Not a Rally member';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'invited_user_id', i.invited_user_id,
        'invited_username', p.username,
        'status', i.status,
        'created_at', i.created_at
      )
      order by i.created_at desc
    )
    from public.regular_group_invites i
    join public.profiles p on p.id = i.invited_user_id
    where i.group_id = p_group_id
      and i.status = 'pending'
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.invite_friend_to_regular_group(uuid, uuid) to authenticated;
grant execute on function public.accept_regular_group_friend_invite(uuid) to authenticated;
grant execute on function public.decline_regular_group_friend_invite(uuid) to authenticated;
grant execute on function public.list_my_pending_regular_group_invites() to authenticated;
grant execute on function public.list_regular_group_outgoing_invites(uuid) to authenticated;
