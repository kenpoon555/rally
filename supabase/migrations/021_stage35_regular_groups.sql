-- Stage 3.5c: Regulars / Groups foundation (feeds Stage 4 Team Plan).

create table if not exists public.regular_groups (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  sport_type text not null,
  default_location_id uuid references public.activity_locations(id) on delete set null,
  series_id uuid references public.game_series(id) on delete set null,
  source_activity_id uuid references public.activities(id) on delete set null,
  invite_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_regular_groups_invite_token
  on public.regular_groups(invite_token);

create index if not exists idx_regular_groups_host
  on public.regular_groups(host_id);

create table if not exists public.regular_group_members (
  group_id uuid not null references public.regular_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('host', 'member', 'captain')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists idx_regular_group_members_user
  on public.regular_group_members(user_id);

alter table public.activities
  add column if not exists regular_group_id uuid references public.regular_groups(id) on delete set null;

alter table public.game_series
  add column if not exists regular_group_id uuid references public.regular_groups(id) on delete set null;

alter table public.regular_groups enable row level security;
alter table public.regular_group_members enable row level security;

drop policy if exists "Host manages own regular groups" on public.regular_groups;
create policy "Host manages own regular groups"
  on public.regular_groups for all
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "Members view their regular groups" on public.regular_groups;
create policy "Members view their regular groups"
  on public.regular_groups for select
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.regular_group_members rgm
      where rgm.group_id = regular_groups.id and rgm.user_id = auth.uid()
    )
  );

drop policy if exists "Members view regular group roster" on public.regular_group_members;
create policy "Members view regular group roster"
  on public.regular_group_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.regular_groups rg
      where rg.id = regular_group_members.group_id
        and (
          rg.host_id = auth.uid()
          or exists (
            select 1 from public.regular_group_members mine
            where mine.group_id = rg.id and mine.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "Host manages regular group roster" on public.regular_group_members;
create policy "Host manages regular group roster"
  on public.regular_group_members for all
  using (
    exists (
      select 1 from public.regular_groups rg
      where rg.id = regular_group_members.group_id and rg.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.regular_groups rg
      where rg.id = regular_group_members.group_id and rg.host_id = auth.uid()
    )
  );

create or replace function public.create_regular_group_from_activity(
  p_activity_id uuid,
  p_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_group_id uuid;
  v_name text;
  v_join record;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> v_host then
    raise exception 'Only the host can create a Regulars group from this game';
  end if;

  if v_activity.regular_group_id is not null then
    return v_activity.regular_group_id;
  end if;

  v_name := nullif(trim(p_name), '');
  if v_name is null then
    select coalesce(
      al.name || ' Regulars',
      v_activity.sport_type || ' Regulars'
    )
    into v_name
    from public.activity_locations al
    where al.id = v_activity.location_id;

    v_name := coalesce(v_name, v_activity.sport_type || ' Regulars');
  end if;

  insert into public.regular_groups (
    host_id,
    name,
    sport_type,
    default_location_id,
    series_id,
    source_activity_id
  )
  values (
    v_host,
    v_name,
    v_activity.sport_type,
    v_activity.location_id,
    v_activity.series_id,
    p_activity_id
  )
  returning id into v_group_id;

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_group_id, v_host, 'host')
  on conflict do nothing;

  for v_join in
    select jr.user_id
    from public.join_requests jr
    where jr.activity_id = p_activity_id and jr.status = 'approved'
  loop
    insert into public.regular_group_members (group_id, user_id, role)
    values (v_group_id, v_join.user_id, 'member')
    on conflict do nothing;
  end loop;

  update public.activities
  set regular_group_id = v_group_id, updated_at = now()
  where id = p_activity_id;

  if v_activity.series_id is not null then
    update public.game_series
    set regular_group_id = v_group_id
    where id = v_activity.series_id and regular_group_id is null;
  end if;

  return v_group_id;
end;
$$;

create or replace function public.join_regular_group_via_invite(p_invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_group from public.regular_groups where invite_token = p_invite_token;
  if not found then
    raise exception 'Group invite link is invalid or expired';
  end if;

  insert into public.regular_group_members (group_id, user_id, role)
  values (v_group.id, v_user, 'member')
  on conflict do nothing;

  return v_group.id;
end;
$$;

revoke all on function public.create_regular_group_from_activity(uuid, text) from public;
grant execute on function public.create_regular_group_from_activity(uuid, text) to authenticated;
revoke all on function public.join_regular_group_via_invite(uuid) from public;
grant execute on function public.join_regular_group_via_invite(uuid) to authenticated;
