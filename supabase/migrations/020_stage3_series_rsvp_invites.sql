-- Stage 3: recurring series, RSVP, invite links, urgency games.

create table if not exists public.game_series (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid references public.activity_locations(id) on delete set null,
  sport_type text not null,
  duration integer not null default 60,
  missing_players integer not null default 1,
  visibility text not null default 'invite_only'
    check (visibility in ('friends', 'nearby', 'invite_only')),
  interval_days integer not null default 7 check (interval_days between 1 and 30),
  is_active boolean not null default true,
  source_activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_series_host on public.game_series(host_id);

create table if not exists public.game_series_members (
  series_id uuid not null references public.game_series(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (series_id, user_id)
);

alter table public.activities
  add column if not exists series_id uuid references public.game_series(id) on delete set null;

alter table public.activities
  add column if not exists urgency_level text not null default 'normal';

alter table public.activities
  drop constraint if exists activities_urgency_level_check;

alter table public.activities
  add constraint activities_urgency_level_check
  check (urgency_level in ('normal', 'tonight'));

alter table public.activities
  add column if not exists invite_token uuid default gen_random_uuid();

update public.activities
set invite_token = gen_random_uuid()
where invite_token is null;

alter table public.activities
  alter column invite_token set not null;

create unique index if not exists idx_activities_invite_token
  on public.activities(invite_token);

create index if not exists idx_activities_urgency_tonight
  on public.activities(urgency_level, start_time)
  where urgency_level = 'tonight' and status = 'active';

create table if not exists public.activity_rsvps (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'not_going')),
  updated_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create index if not exists idx_activity_rsvps_activity
  on public.activity_rsvps(activity_id);

alter table public.game_series enable row level security;
alter table public.game_series_members enable row level security;
alter table public.activity_rsvps enable row level security;

drop policy if exists "Host manages own series" on public.game_series;
create policy "Host manages own series"
  on public.game_series for all
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "Series members viewable by host and members" on public.game_series_members;
create policy "Series members viewable by host and members"
  on public.game_series_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.game_series gs
      where gs.id = game_series_members.series_id and gs.host_id = auth.uid()
    )
  );

drop policy if exists "Host manages series members" on public.game_series_members;
create policy "Host manages series members"
  on public.game_series_members for all
  using (
    exists (
      select 1 from public.game_series gs
      where gs.id = game_series_members.series_id and gs.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.game_series gs
      where gs.id = game_series_members.series_id and gs.host_id = auth.uid()
    )
  );

drop policy if exists "Game participants view RSVPs" on public.activity_rsvps;
create policy "Game participants view RSVPs"
  on public.activity_rsvps for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_rsvps.activity_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.join_requests jr
            where jr.activity_id = a.id
              and jr.user_id = auth.uid()
              and jr.status = 'approved'
          )
        )
    )
  );

drop policy if exists "Participants set own RSVP" on public.activity_rsvps;
create policy "Participants set own RSVP"
  on public.activity_rsvps for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_rsvps.activity_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.join_requests jr
            where jr.activity_id = a.id
              and jr.user_id = auth.uid()
              and jr.status = 'approved'
          )
        )
    )
  );

drop policy if exists "Participants update own RSVP" on public.activity_rsvps;
create policy "Participants update own RSVP"
  on public.activity_rsvps for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.make_activity_recurring(
  p_activity_id uuid,
  p_interval_days integer default 7
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_series_id uuid;
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
    raise exception 'Only the host can make this game recurring';
  end if;

  if v_activity.series_id is not null then
    return v_activity.series_id;
  end if;

  insert into public.game_series (
    host_id,
    location_id,
    sport_type,
    duration,
    missing_players,
    visibility,
    interval_days,
    source_activity_id
  )
  values (
    v_activity.user_id,
    v_activity.location_id,
    v_activity.sport_type,
    v_activity.duration,
    coalesce(v_activity.missing_players, 1),
    coalesce(v_activity.visibility, 'invite_only'),
    greatest(1, least(coalesce(p_interval_days, 7), 30)),
    p_activity_id
  )
  returning id into v_series_id;

  for v_join in
    select jr.user_id
    from public.join_requests jr
    where jr.activity_id = p_activity_id and jr.status = 'approved'
  loop
    insert into public.game_series_members (series_id, user_id)
    values (v_series_id, v_join.user_id)
    on conflict do nothing;
  end loop;

  update public.activities
  set series_id = v_series_id, updated_at = now()
  where id = p_activity_id;

  return v_series_id;
end;
$$;

create or replace function public.spawn_series_occurrence(
  p_series_id uuid,
  p_start_time timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_series record;
  v_last record;
  v_new_id uuid;
  v_start timestamptz;
  v_approved int := 0;
  v_member record;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_series from public.game_series where id = p_series_id;
  if not found then
    raise exception 'Series not found';
  end if;

  if v_series.host_id <> v_host then
    raise exception 'Only the host can spawn the next game';
  end if;

  if not v_series.is_active then
    raise exception 'This recurring series is paused';
  end if;

  select * into v_last
  from public.activities
  where series_id = p_series_id
  order by start_time desc
  limit 1;

  if not found and v_series.source_activity_id is not null then
    select * into v_last from public.activities where id = v_series.source_activity_id;
  end if;

  if v_last.id is null then
    raise exception 'No template activity for this series';
  end if;

  v_start := coalesce(p_start_time, v_last.start_time + make_interval(days => v_series.interval_days));
  while v_start <= now() loop
    v_start := v_start + make_interval(days => v_series.interval_days);
  end loop;

  insert into public.activities (
    user_id,
    location_id,
    sport_type,
    start_time,
    duration,
    visibility,
    player_count,
    missing_players,
    status,
    scheduling_mode,
    match_status,
    expires_at,
    series_id,
    source_activity_id,
    urgency_level
  )
  values (
    v_series.host_id,
    v_series.location_id,
    v_series.sport_type,
    v_start,
    v_series.duration,
    v_series.visibility,
    1,
    v_series.missing_players,
    'active',
    coalesce(v_last.scheduling_mode, 'fixed'),
    'open',
    v_start,
    p_series_id,
    v_last.id,
    'normal'
  )
  returning id into v_new_id;

  for v_member in
    select user_id from public.game_series_members where series_id = p_series_id
  loop
    insert into public.join_requests (activity_id, user_id, status)
    values (v_new_id, v_member.user_id, 'approved');
    v_approved := v_approved + 1;
  end loop;

  update public.activities
  set player_count = 1 + v_approved, updated_at = now()
  where id = v_new_id;

  perform public.ensure_activity_group_conversation(v_new_id);
  return v_new_id;
end;
$$;

create or replace function public.set_game_rsvp(
  p_activity_id uuid,
  p_status text
)
returns void
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

  if p_status not in ('going', 'maybe', 'not_going') then
    raise exception 'Invalid RSVP status';
  end if;

  if not exists (
    select 1 from public.activities a
    where a.id = p_activity_id
      and (
        a.user_id = v_user
        or exists (
          select 1 from public.join_requests jr
          where jr.activity_id = a.id
            and jr.user_id = v_user
            and jr.status = 'approved'
        )
      )
  ) then
    raise exception 'You are not on this game';
  end if;

  insert into public.activity_rsvps (activity_id, user_id, status, updated_at)
  values (p_activity_id, v_user, p_status, now())
  on conflict (activity_id, user_id)
  do update set status = excluded.status, updated_at = now();
end;
$$;

create or replace function public.join_game_via_invite(p_invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_open_spots integer;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where invite_token = p_invite_token;
  if not found then
    raise exception 'Invite link is invalid or expired';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'This game is no longer open';
  end if;

  if v_activity.user_id = v_user then
    return v_activity.id;
  end if;

  perform public.assert_user_can_join_activity(v_activity.id);

  if exists (
    select 1 from public.join_requests
    where activity_id = v_activity.id and user_id = v_user
  ) then
    return v_activity.id;
  end if;

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

  return v_activity.id;
end;
$$;

create or replace function public.schedule_next_game_from_activity(
  p_source_activity_id uuid,
  p_start_time timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_source record;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_source from public.activities where id = p_source_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_source.user_id <> v_host then
    raise exception 'Only the host can schedule the next game';
  end if;

  if v_source.status = 'cancelled' then
    raise exception 'Cannot schedule from a cancelled game';
  end if;

  if v_source.series_id is not null then
    return public.spawn_series_occurrence(v_source.series_id, p_start_time);
  end if;

  return public._schedule_one_off_next_game(p_source_activity_id, p_start_time);
end;
$$;

create or replace function public._schedule_one_off_next_game(
  p_source_activity_id uuid,
  p_start_time timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source record;
  v_new_id uuid;
  v_start timestamptz;
  v_approved int := 0;
  v_join record;
begin
  select * into v_source from public.activities where id = p_source_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  v_start := coalesce(p_start_time, v_source.start_time + interval '7 days');
  while v_start <= now() loop
    v_start := v_start + interval '7 days';
  end loop;

  insert into public.activities (
    user_id, location_id, sport_type, start_time, duration, visibility,
    player_count, missing_players, status, scheduling_mode,
    preference_deadline, window_start, window_end, match_status,
    expires_at, source_activity_id, urgency_level
  )
  values (
    v_source.user_id, v_source.location_id, v_source.sport_type, v_start,
    v_source.duration, 'invite_only', 1, v_source.missing_players, 'active',
    coalesce(v_source.scheduling_mode, 'fixed'), v_source.preference_deadline,
    v_source.window_start, v_source.window_end, 'open', v_start,
    p_source_activity_id, 'normal'
  )
  returning id into v_new_id;

  for v_join in
    select jr.user_id from public.join_requests jr
    where jr.activity_id = p_source_activity_id and jr.status = 'approved'
  loop
    insert into public.join_requests (activity_id, user_id, status)
    values (v_new_id, v_join.user_id, 'approved');
    v_approved := v_approved + 1;
  end loop;

  update public.activities
  set player_count = 1 + v_approved, updated_at = now()
  where id = v_new_id;

  perform public.ensure_activity_group_conversation(v_new_id);
  return v_new_id;
end;
$$;

revoke all on function public.make_activity_recurring(uuid, integer) from public;
grant execute on function public.make_activity_recurring(uuid, integer) to authenticated;
revoke all on function public.spawn_series_occurrence(uuid, timestamptz) from public;
grant execute on function public.spawn_series_occurrence(uuid, timestamptz) to authenticated;
revoke all on function public.set_game_rsvp(uuid, text) from public;
grant execute on function public.set_game_rsvp(uuid, text) to authenticated;
revoke all on function public.join_game_via_invite(uuid) from public;
grant execute on function public.join_game_via_invite(uuid) to authenticated;
