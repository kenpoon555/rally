-- Phase 2.1 + 2.2: Post-game recap and venue details on activity_locations.

insert into public.app_feature_flags (key, enabled, config)
values ('recap_v1', true, '{"description":"Post-game recap cards in chat"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled;

-- ── Venue fields on existing courts table ─────────────────────────────────────

alter table public.activity_locations
  add column if not exists address text,
  add column if not exists parking_note text,
  add column if not exists booking_url text,
  add column if not exists busy_notes text,
  add column if not exists hours_text text;

update public.activity_locations
set
  address = coalesce(address, 'Los Angeles, CA'),
  parking_note = coalesce(parking_note, 'Street parking — arrive early on weekends.'),
  hours_text = coalesce(hours_text, 'Outdoor courts · daylight hours typical')
where google_place_id like 'seed-%'
  and address is null;

update public.activity_locations
set
  parking_note = 'Paid/indoor lot — check venue desk.',
  booking_url = coalesce(booking_url, 'https://www.google.com/maps'),
  busy_notes = coalesce(busy_notes, 'Peak: weeknights 7–10pm · weekends 9am–1pm')
where sport_type = 'Badminton'
  and google_place_id like 'seed-%';

-- ── Game recaps ───────────────────────────────────────────────────────────────

create table if not exists public.game_recaps (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade unique,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_recaps_activity on public.game_recaps(activity_id);

alter table public.game_recaps enable row level security;

drop policy if exists "Game participants view recaps" on public.game_recaps;
create policy "Game participants view recaps"
  on public.game_recaps for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = game_recaps.activity_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.join_requests jr
            where jr.activity_id = a.id and jr.user_id = auth.uid()
          )
          or (
            a.regular_group_id is not null
            and public.is_regular_group_member(a.regular_group_id, auth.uid())
          )
        )
    )
  );

alter table public.messages
  add column if not exists recap_id uuid references public.game_recaps(id) on delete set null;

alter table public.messages
  drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in ('text', 'system', 'recap'));

create or replace function public.get_location_venue_details(p_location_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_lat double precision;
  v_lng double precision;
begin
  if p_location_id is null then
    return null;
  end if;

  select * into v_row from public.activity_locations where id = p_location_id;
  if not found then
    return null;
  end if;

  v_lng := st_x(v_row.location::geometry);
  v_lat := st_y(v_row.location::geometry);

  return jsonb_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'sport_type', v_row.sport_type,
    'address', v_row.address,
    'parking_note', v_row.parking_note,
    'booking_url', v_row.booking_url,
    'busy_notes', v_row.busy_notes,
    'hours_text', v_row.hours_text,
    'is_active', v_row.is_active,
    'latitude', v_lat,
    'longitude', v_lng
  );
end;
$$;

create or replace function public.set_regular_group_default_location(
  p_group_id uuid,
  p_location_id uuid
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

  if not exists (
    select 1 from public.regular_groups
    where id = p_group_id and host_id = v_user
  ) then
    raise exception 'Only the crew host can set the default court';
  end if;

  if p_location_id is not null and not exists (
    select 1 from public.activity_locations where id = p_location_id
  ) then
    raise exception 'Court not found';
  end if;

  update public.regular_groups
  set default_location_id = p_location_id
  where id = p_group_id;
end;
$$;

create or replace function public._generate_game_recap(p_activity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
  v_group record;
  v_payload jsonb;
  v_recap_id uuid;
  v_conversation_id uuid;
  v_rotation_rounds int := 0;
  v_streak_user record;
begin
  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    return null;
  end if;

  if v_activity.regular_group_id is not null then
    select * into v_group from public.regular_groups where id = v_activity.regular_group_id;
  end if;

  select count(*)::int into v_rotation_rounds
  from public.session_rotations
  where activity_id = p_activity_id;

  select p.id as user_id, p.username, public._rally_week_streak(v_activity.regular_group_id, p.id) as week_streak
  into v_streak_user
  from public.game_attendance ga
  join public.profiles p on p.id = ga.user_id
  where ga.activity_id = p_activity_id
    and ga.attended = true
    and v_activity.regular_group_id is not null
  order by public._rally_week_streak(v_activity.regular_group_id, p.id) desc, p.username
  limit 1;

  v_payload := jsonb_build_object(
    'activity_id', v_activity.id,
    'group_id', v_activity.regular_group_id,
    'group_name', v_group.name,
    'sport_type', v_activity.sport_type,
    'court_name', (select name from public.activity_locations where id = v_activity.location_id),
    'start_time', v_activity.start_time,
    'duration', v_activity.duration,
    'attendees', coalesce((
      select jsonb_agg(
        jsonb_build_object('user_id', p.id, 'username', p.username)
        order by p.username
      )
      from public.game_attendance ga
      join public.profiles p on p.id = ga.user_id
      where ga.activity_id = p_activity_id and ga.attended = true
    ), '[]'::jsonb),
    'attendee_count', (
      select count(*)::int
      from public.game_attendance
      where activity_id = p_activity_id and attended = true
    ),
    'rotation_rounds', v_rotation_rounds,
    'streak_highlight', case
      when v_streak_user.user_id is not null and v_streak_user.week_streak > 0 then
        jsonb_build_object(
          'user_id', v_streak_user.user_id,
          'username', v_streak_user.username,
          'week_streak', v_streak_user.week_streak
        )
      else null
    end
  );

  insert into public.game_recaps (activity_id, payload)
  values (p_activity_id, v_payload)
  on conflict (activity_id) do update
  set payload = excluded.payload, created_at = now()
  returning id into v_recap_id;

  if v_activity.regular_group_id is not null then
    v_conversation_id := public.ensure_crew_conversation(v_activity.regular_group_id);

    insert into public.messages (conversation_id, sender_id, message_type, content, recap_id, activity_id)
    values (
      v_conversation_id,
      v_activity.user_id,
      'recap',
      'Game recap',
      v_recap_id,
      p_activity_id
    );
  else
    select c.id into v_conversation_id
    from public.conversations c
    where c.activity_id = p_activity_id
      and c.conversation_type = 'activity_group'
    limit 1;

    if v_conversation_id is not null then
      insert into public.messages (conversation_id, sender_id, message_type, content, recap_id, activity_id)
      values (
        v_conversation_id,
        v_activity.user_id,
        'recap',
        'Game recap',
        v_recap_id,
        p_activity_id
      );
    end if;
  end if;

  return v_recap_id;
end;
$$;

create or replace function public.get_game_recap(p_recap_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_recap record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select r.*, a.regular_group_id, a.user_id as host_id
  into v_recap
  from public.game_recaps r
  join public.activities a on a.id = r.activity_id
  where r.id = p_recap_id;

  if not found then
    raise exception 'Recap not found';
  end if;

  if not (
    v_recap.host_id = v_user
    or exists (
      select 1 from public.join_requests jr
      where jr.activity_id = v_recap.activity_id and jr.user_id = v_user
    )
    or (
      v_recap.regular_group_id is not null
      and public.is_regular_group_member(v_recap.regular_group_id, v_user)
    )
  ) then
    raise exception 'Not allowed to view this recap';
  end if;

  return v_recap.payload || jsonb_build_object('recap_id', v_recap.id, 'created_at', v_recap.created_at);
end;
$$;

drop function if exists public.submit_game_attendance(uuid, uuid[]);

create or replace function public.submit_game_attendance(
  p_activity_id uuid,
  p_attended_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid := auth.uid();
  v_activity record;
  v_uid uuid;
  v_recap_id uuid;
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

  if exists (
    select 1 from public.app_feature_flags where key = 'recap_v1' and enabled = true
  ) then
    v_recap_id := public._generate_game_recap(p_activity_id);
  end if;

  return v_recap_id;
end;
$$;

revoke all on function public.get_location_venue_details(uuid) from public;
grant execute on function public.get_location_venue_details(uuid) to authenticated;

revoke all on function public.set_regular_group_default_location(uuid, uuid) from public;
grant execute on function public.set_regular_group_default_location(uuid, uuid) to authenticated;

revoke all on function public.get_game_recap(uuid) from public;
grant execute on function public.get_game_recap(uuid) to authenticated;

revoke all on function public.submit_game_attendance(uuid, uuid[]) from public;
grant execute on function public.submit_game_attendance(uuid, uuid[]) to authenticated;
