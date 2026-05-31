-- Stage 2.5 tweak: 72h post-game chat grace before archive.
-- Stage 3 start: invite-only games + schedule next game from chat roster.

alter table public.activities drop constraint if exists activities_visibility_check;
alter table public.activities
  add constraint activities_visibility_check
  check (visibility in ('friends', 'nearby', 'invite_only'));

alter table public.activities
  add column if not exists source_activity_id uuid references public.activities(id) on delete set null;

create index if not exists idx_activities_source_activity
  on public.activities(source_activity_id)
  where source_activity_id is not null;

create or replace function public.is_game_chat_archived(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    join public.activities a on a.id = c.activity_id
    where c.id = p_conversation_id
      and c.conversation_type = 'activity_group'
      and now() >= a.start_time
        + make_interval(mins => coalesce(a.duration, 60))
        + interval '72 hours'
  );
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
  v_new_id uuid;
  v_start timestamptz;
  v_approved int := 0;
  v_join record;
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

  v_start := coalesce(p_start_time, v_source.start_time + interval '7 days');
  while v_start <= now() loop
    v_start := v_start + interval '7 days';
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
    preference_deadline,
    window_start,
    window_end,
    match_status,
    expires_at,
    source_activity_id
  )
  values (
    v_source.user_id,
    v_source.location_id,
    v_source.sport_type,
    v_start,
    v_source.duration,
    'invite_only',
    1,
    v_source.missing_players,
    'active',
    coalesce(v_source.scheduling_mode, 'fixed'),
    v_source.preference_deadline,
    v_source.window_start,
    v_source.window_end,
    'open',
    v_start,
    p_source_activity_id
  )
  returning id into v_new_id;

  for v_join in
    select jr.user_id
    from public.join_requests jr
    where jr.activity_id = p_source_activity_id
      and jr.status = 'approved'
  loop
    insert into public.join_requests (activity_id, user_id, status)
    values (v_new_id, v_join.user_id, 'approved');
    v_approved := v_approved + 1;
  end loop;

  update public.activities
  set player_count = 1 + v_approved,
      updated_at = now()
  where id = v_new_id;

  perform public.ensure_activity_group_conversation(v_new_id);

  return v_new_id;
end;
$$;

revoke all on function public.schedule_next_game_from_activity(uuid, timestamptz) from public;
grant execute on function public.schedule_next_game_from_activity(uuid, timestamptz) to authenticated;
