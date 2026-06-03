-- Advisor implementation: session_note, host kick, attendance, reliability stats, waitlist, legacy chat hide

-- A4: session announcement on activity
alter table public.activities
  add column if not exists session_note text;

comment on column public.activities.session_note is
  'Per-session announcement (court, cash, etc.). Separate from cost_note and crew pinned announcement.';

create or replace function public.set_session_note(
  p_activity_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_trimmed text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.activities a
    where a.id = p_activity_id and a.user_id = v_host
  ) then
    raise exception 'Only the host can set the session announcement';
  end if;

  update public.activities
  set session_note = v_trimmed, updated_at = now()
  where id = p_activity_id;
end;
$$;

grant execute on function public.set_session_note(uuid, text) to authenticated;

-- A3: host remove player before lock (re-join allowed)
create or replace function public.remove_from_roster(
  p_activity_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_was_approved boolean := false;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id for update;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> v_host then
    raise exception 'Only the host can remove players';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
  end if;

  if p_user_id = v_host then
    raise exception 'Cannot remove the host';
  end if;

  select exists (
    select 1 from public.join_requests
    where activity_id = p_activity_id
      and user_id = p_user_id
      and status = 'approved'
  ) into v_was_approved;

  delete from public.join_requests
  where activity_id = p_activity_id
    and user_id = p_user_id
    and status in ('pending', 'approved', 'waitlisted');

  if not found then
    raise exception 'Player is not on this roster';
  end if;

  update public.activities
  set
    player_count = greatest(1, coalesce(player_count, 1) - 1),
    missing_players = case
      when v_was_approved then coalesce(missing_players, 0) + 1
      else missing_players
    end,
    updated_at = now()
  where id = p_activity_id;

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;

grant execute on function public.remove_from_roster(uuid, uuid) to authenticated;

-- WAIT-01: waitlist status on join_requests
alter table public.join_requests drop constraint if exists join_requests_status_check;
alter table public.join_requests
  add constraint join_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'waitlisted'));

-- join_crew_game: waitlist when full instead of hard error (returns jsonb status)
drop function if exists public.join_crew_game(uuid);
create or replace function public.join_crew_game(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_open_spots integer;
  v_existing record;
  v_result jsonb := '{"status":"joined"}'::jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.regular_group_id is null then
    raise exception 'This is not a Rally game';
  end if;

  if v_activity.status <> 'active' then
    raise exception 'Game is not active';
  end if;

  if v_activity.match_status = 'finalized' then
    raise exception 'Roster is locked';
  end if;

  if v_activity.user_id = v_user then
    return '{"status":"host"}'::jsonb;
  end if;

  if not public.is_regular_group_member(v_activity.regular_group_id, v_user) then
    raise exception 'Join the Rally before joining this game';
  end if;

  select * into v_existing
  from public.join_requests jr
  where jr.activity_id = p_activity_id and jr.user_id = v_user;

  if found and v_existing.status = 'approved' then
    return '{"status":"already_joined"}'::jsonb;
  end if;

  if found and v_existing.status = 'waitlisted' then
    return '{"status":"waitlisted"}'::jsonb;
  end if;

  v_open_spots := coalesce(v_activity.missing_players, 0);

  if v_open_spots <= 0 then
    if not found then
      insert into public.join_requests (activity_id, user_id, status)
      values (p_activity_id, v_user, 'waitlisted');
    else
      update public.join_requests
      set status = 'waitlisted', updated_at = now()
      where id = v_existing.id;
    end if;
    return '{"status":"waitlisted"}'::jsonb;
  end if;

  if found and v_existing.status = 'pending' then
    update public.join_requests
    set status = 'approved', responded_at = now(), updated_at = now()
    where id = v_existing.id;
  elsif not found then
    insert into public.join_requests (activity_id, user_id, status)
    values (p_activity_id, v_user, 'approved');
  else
    raise exception 'Cannot join this game';
  end if;

  update public.activities
  set
    player_count = coalesce(player_count, 1) + 1,
    missing_players = greatest(0, coalesce(missing_players, 0) - 1),
    updated_at = now()
  where id = p_activity_id;

  perform public.ensure_crew_conversation(v_activity.regular_group_id);
  return v_result;
end;
$$;

-- POST-01 / A5: attendance records after game
create table if not exists public.game_attendance (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean not null default true,
  reported_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

alter table public.game_attendance enable row level security;

drop policy if exists "Host and participants view game attendance" on public.game_attendance;
create policy "Host and participants view game attendance"
  on public.game_attendance for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = game_attendance.activity_id
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

drop policy if exists "Host submits game attendance" on public.game_attendance;
create policy "Host submits game attendance"
  on public.game_attendance for insert
  with check (
    exists (
      select 1 from public.activities a
      where a.id = game_attendance.activity_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Host updates game attendance" on public.game_attendance;
create policy "Host updates game attendance"
  on public.game_attendance for update
  using (
    exists (
      select 1 from public.activities a
      where a.id = game_attendance.activity_id and a.user_id = auth.uid()
    )
  );

create or replace function public.submit_game_attendance(
  p_activity_id uuid,
  p_attended_user_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_uid uuid;
begin
  if v_host is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.user_id <> v_host then
    raise exception 'Only the host can submit attendance';
  end if;

  delete from public.game_attendance where activity_id = p_activity_id;

  if p_attended_user_ids is not null then
    foreach v_uid in array p_attended_user_ids
    loop
      insert into public.game_attendance (activity_id, user_id, attended, reported_by)
      values (p_activity_id, v_uid, true, v_host)
      on conflict (activity_id, user_id) do update
      set attended = true, reported_by = v_host, created_at = now();
    end loop;
  end if;
end;
$$;

grant execute on function public.submit_game_attendance(uuid, uuid[]) to authenticated;

-- A5: reliability stats (committed = I'm in before lock on finalized games)
create or replace function public.get_user_attendance_stats(p_user_id uuid default auth.uid())
returns table (
  committed_sessions bigint,
  confirmed_attended bigint,
  reliability_pct numeric,
  confidence_band text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_committed bigint;
  v_attended bigint;
  v_pct numeric;
begin
  if p_user_id is null then
    return;
  end if;

  select count(*)::bigint into v_committed
  from public.join_requests jr
  join public.activities a on a.id = jr.activity_id
  where jr.user_id = p_user_id
    and jr.status = 'approved'
    and jr.ready_at is not null
    and a.match_status = 'finalized'
    and a.status <> 'cancelled';

  select count(*)::bigint into v_attended
  from public.game_attendance ga
  join public.activities a on a.id = ga.activity_id
  join public.join_requests jr on jr.activity_id = a.id and jr.user_id = p_user_id
  where ga.user_id = p_user_id
    and ga.attended = true
    and jr.ready_at is not null
    and a.match_status = 'finalized';

  v_pct := case when v_committed > 0 then round((v_attended::numeric / v_committed::numeric) * 100, 1) else null end;

  return query
  select
    v_committed,
    v_attended,
    v_pct,
    case
      when v_committed < 3 then 'new_player'
      when v_committed < 10 then 'building'
      else 'established'
    end::text;
end;
$$;

grant execute on function public.get_user_attendance_stats(uuid) to authenticated;

-- A6-1: deactivate legacy per-activity chats for Rally-linked games
update public.conversation_members cm
set is_active = false
from public.conversations c
join public.activities a on a.id = c.activity_id
where cm.conversation_id = c.id
  and c.conversation_type = 'activity_group'
  and a.regular_group_id is not null
  and cm.is_active = true;

revoke all on function public.join_crew_game(uuid) from public;
grant execute on function public.join_crew_game(uuid) to authenticated;
