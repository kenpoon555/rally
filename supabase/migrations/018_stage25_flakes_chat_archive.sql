-- Stage 2.5 exit: reliability flakes on leave-before-finalize + read-only archived game chat.

create table if not exists public.activity_game_flakes (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  was_ready boolean not null default false,
  hours_before_start numeric,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists idx_activity_game_flakes_user
  on public.activity_game_flakes(user_id);

alter table public.activity_game_flakes enable row level security;

drop policy if exists "Users view flakes on self or own hosted games" on public.activity_game_flakes;
create policy "Users view flakes on self or own hosted games"
  on public.activity_game_flakes
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.activities a
      where a.id = activity_game_flakes.activity_id
        and a.user_id = auth.uid()
    )
  );

-- True when conversation is a game lobby whose activity play window has ended.
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
      and (
        a.status in ('completed', 'cancelled')
        or now() >= a.start_time + make_interval(mins => coalesce(a.duration, 60))
      )
  );
$$;

create or replace function public.get_profile_trust_stats(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_no_shows int;
  v_flakes int;
  v_reports int;
begin
  if p_user_id is null then
    return '{}'::jsonb;
  end if;

  select count(*)::int into v_no_shows
  from public.activity_no_shows
  where reported_user_id = p_user_id;

  select count(*)::int into v_flakes
  from public.activity_game_flakes
  where user_id = p_user_id;

  select count(*)::int into v_reports
  from public.user_reports
  where reported_id = p_user_id and status = 'pending';

  return jsonb_build_object(
    'no_show_count', coalesce(v_no_shows, 0),
    'flake_count', coalesce(v_flakes, 0),
    'pending_reports', coalesce(v_reports, 0)
  );
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
  v_join record;
  v_hours_before numeric;
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

  select * into v_join
  from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status = 'approved';

  if found then
    v_hours_before := extract(epoch from (v_activity.start_time - now())) / 3600.0;
    insert into public.activity_game_flakes (
      activity_id,
      user_id,
      was_ready,
      hours_before_start
    )
    values (
      p_activity_id,
      v_user,
      v_join.ready_at is not null,
      v_hours_before
    )
    on conflict (activity_id, user_id) do nothing;

    update public.activities
    set
      player_count = greatest(1, coalesce(player_count, 1) - 1),
      updated_at = now()
    where id = p_activity_id;
  end if;

  delete from public.join_requests
  where activity_id = p_activity_id
    and user_id = v_user
    and status in ('pending', 'approved');

  if not found then
    raise exception 'You are not on this game';
  end if;

  perform public.ensure_activity_group_conversation(p_activity_id);
end;
$$;

drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and not public.is_game_chat_archived(messages.conversation_id)
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

grant execute on function public.is_game_chat_archived(uuid) to authenticated;
