-- Phase 1.3: Auto rotation / pairing for locked sessions (doubles v1).

insert into public.app_feature_flags (key, enabled, config)
values ('rotation_v1', true, '{"description":"Session court rotation generator"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled;

create table if not exists public.session_rotations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  regular_group_id uuid references public.regular_groups(id) on delete set null,
  round_number int not null default 1,
  algorithm text not null default 'greedy_doubles_v1',
  config jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (activity_id, round_number)
);

create index if not exists idx_session_rotations_activity
  on public.session_rotations(activity_id, round_number desc);

create table if not exists public.session_rotation_courts (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid not null references public.session_rotations(id) on delete cascade,
  court_number int not null,
  player_ids uuid[] not null,
  unique (rotation_id, court_number)
);

create index if not exists idx_session_rotation_courts_rotation
  on public.session_rotation_courts(rotation_id, court_number);

create table if not exists public.session_rotation_partner_history (
  id uuid primary key default gen_random_uuid(),
  regular_group_id uuid not null references public.regular_groups(id) on delete cascade,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  rotation_id uuid references public.session_rotations(id) on delete set null,
  created_at timestamptz not null default now(),
  check (user_a < user_b)
);

create index if not exists idx_rotation_partner_history_group_pair
  on public.session_rotation_partner_history(regular_group_id, user_a, user_b);

alter table public.session_rotations enable row level security;
alter table public.session_rotation_courts enable row level security;
alter table public.session_rotation_partner_history enable row level security;

drop policy if exists "Activity participants view rotations" on public.session_rotations;
create policy "Activity participants view rotations"
  on public.session_rotations for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.join_requests jr
            where jr.activity_id = a.id
              and jr.user_id = auth.uid()
              and jr.status in ('approved', 'pending', 'waitlisted')
          )
          or (
            a.regular_group_id is not null
            and public.is_regular_group_member(a.regular_group_id, auth.uid())
          )
        )
    )
  );

drop policy if exists "Activity participants view rotation courts" on public.session_rotation_courts;
create policy "Activity participants view rotation courts"
  on public.session_rotation_courts for select
  using (
    exists (
      select 1 from public.session_rotations r
      join public.activities a on a.id = r.activity_id
      where r.id = rotation_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.join_requests jr
            where jr.activity_id = a.id
              and jr.user_id = auth.uid()
              and jr.status in ('approved', 'pending', 'waitlisted')
          )
          or (
            a.regular_group_id is not null
            and public.is_regular_group_member(a.regular_group_id, auth.uid())
          )
        )
    )
  );

drop policy if exists "Crew members view partner history" on public.session_rotation_partner_history;
create policy "Crew members view partner history"
  on public.session_rotation_partner_history for select
  using (public.is_regular_group_member(regular_group_id, auth.uid()));

create or replace function public._rotation_partner_penalty(
  p_group_id uuid,
  p_user_a uuid,
  p_user_b uuid
)
returns int
language sql
stable
as $$
  select count(*)::int
  from public.session_rotation_partner_history h
  where h.regular_group_id = p_group_id
    and h.user_a = least(p_user_a, p_user_b)
    and h.user_b = greatest(p_user_a, p_user_b);
$$;

create or replace function public._rotation_record_partner_pair(
  p_group_id uuid,
  p_user_a uuid,
  p_user_b uuid,
  p_activity_id uuid,
  p_rotation_id uuid
)
returns void
language plpgsql
as $$
begin
  if p_user_a = p_user_b then
    return;
  end if;
  insert into public.session_rotation_partner_history (
    regular_group_id, user_a, user_b, activity_id, rotation_id
  )
  values (
    p_group_id,
    least(p_user_a, p_user_b),
    greatest(p_user_a, p_user_b),
    p_activity_id,
    p_rotation_id
  );
end;
$$;

create or replace function public.generate_session_rotation(
  p_activity_id uuid,
  p_court_count int default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_players uuid[] := '{}';
  v_player uuid;
  v_n int;
  v_courts int;
  v_round int;
  v_rotation_id uuid;
  v_remaining uuid[];
  v_i int;
  v_j int;
  v_best_i int;
  v_best_j int;
  v_best_penalty int;
  v_penalty int;
  v_court_num int := 0;
  v_sitting_out uuid[] := '{}';
  v_config jsonb := '{}'::jsonb;
  v_p1 uuid;
  v_p2 uuid;
  v_t1p1 uuid;
  v_t1p2 uuid;
  v_t2p1 uuid;
  v_t2p2 uuid;
  v_team_count int;
begin
  create temp table if not exists _gen_rotation_teams (
    id serial primary key,
    p1 uuid not null,
    p2 uuid not null
  ) on commit drop;
  truncate _gen_rotation_teams;
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'rotation_v1' and enabled = true
  ) then
    raise exception 'Rotations are not enabled';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can generate rotations';
  end if;

  if v_activity.match_status <> 'finalized' then
    raise exception 'Lock the roster before generating rotations';
  end if;

  if v_activity.regular_group_id is null then
    raise exception 'Rotations require a Rally crew game';
  end if;

  v_players := array_append(v_players, v_activity.user_id);

  for v_player in
    select jr.user_id
    from public.join_requests jr
    where jr.activity_id = p_activity_id
      and jr.status = 'approved'
    order by jr.requested_at asc
  loop
    if not v_player = any (v_players) then
      v_players := array_append(v_players, v_player);
    end if;
  end loop;

  v_n := coalesce(array_length(v_players, 1), 0);
  if v_n < 4 then
    raise exception 'Need at least 4 players for doubles rotation';
  end if;

  v_courts := coalesce(
    nullif(p_court_count, 0),
    greatest(1, v_n / 4)
  );
  v_courts := least(v_courts, v_n / 4);
  if v_courts < 1 then
    raise exception 'Not enough players for a full court';
  end if;

  v_remaining := v_players[1 : v_courts * 4];
  if array_length(v_remaining, 1) < 4 then
    raise exception 'Not enough players for a full court';
  end if;

  if v_n > v_courts * 4 then
    v_sitting_out := v_players[(v_courts * 4 + 1) : v_n];
  end if;

  -- Greedy pair into teams of 2 (minimize repeat partners).
  while coalesce(array_length(v_remaining, 1), 0) >= 2 loop
    v_best_penalty := null;
    v_best_i := null;
    v_best_j := null;

    for v_i in 1..array_length(v_remaining, 1) loop
      for v_j in (v_i + 1)..array_length(v_remaining, 1) loop
        v_penalty := public._rotation_partner_penalty(
          v_activity.regular_group_id,
          v_remaining[v_i],
          v_remaining[v_j]
        );
        if v_best_penalty is null or v_penalty < v_best_penalty then
          v_best_penalty := v_penalty;
          v_best_i := v_i;
          v_best_j := v_j;
        elsif v_penalty = v_best_penalty and random() < 0.5 then
          v_best_i := v_i;
          v_best_j := v_j;
        end if;
      end loop;
    end loop;

    v_p1 := v_remaining[v_best_i];
    v_p2 := v_remaining[v_best_j];
    insert into _gen_rotation_teams (p1, p2) values (v_p1, v_p2);
    v_remaining := array_remove(array_remove(v_remaining, v_p1), v_p2);
  end loop;

  if coalesce(array_length(v_remaining, 1), 0) = 1 then
    v_sitting_out := array_append(v_sitting_out, v_remaining[1]);
  end if;

  select coalesce(max(round_number), 0) + 1
  into v_round
  from public.session_rotations
  where activity_id = p_activity_id;

  v_config := jsonb_build_object(
    'court_count', v_courts,
    'sitting_out', to_jsonb(coalesce(v_sitting_out, '{}'::uuid[]))
  );

  insert into public.session_rotations (
    activity_id,
    regular_group_id,
    round_number,
    config,
    created_by
  )
  values (
    p_activity_id,
    v_activity.regular_group_id,
    v_round,
    v_config,
    v_user
  )
  returning id into v_rotation_id;

  select count(*)::int into v_team_count from _gen_rotation_teams;
  if v_team_count < 2 then
    delete from public.session_rotations where id = v_rotation_id;
    raise exception 'Could not form any courts';
  end if;

  v_court_num := 0;
  for v_i in 1..v_courts loop
  exit when (v_i * 2) > v_team_count;
    v_court_num := v_court_num + 1;

    select p1, p2 into v_t1p1, v_t1p2
    from _gen_rotation_teams where id = (v_i - 1) * 2 + 1;

    select p1, p2 into v_t2p1, v_t2p2
    from _gen_rotation_teams where id = (v_i - 1) * 2 + 2;

    if v_t2p1 is null then
      exit;
    end if;

    insert into public.session_rotation_courts (rotation_id, court_number, player_ids)
    values (
      v_rotation_id,
      v_court_num,
      array[v_t1p1, v_t1p2, v_t2p1, v_t2p2]
    );

    perform public._rotation_record_partner_pair(
      v_activity.regular_group_id, v_t1p1, v_t1p2, p_activity_id, v_rotation_id
    );
    perform public._rotation_record_partner_pair(
      v_activity.regular_group_id, v_t2p1, v_t2p2, p_activity_id, v_rotation_id
    );
  end loop;

  if v_court_num = 0 then
    delete from public.session_rotations where id = v_rotation_id;
    raise exception 'Could not form any courts';
  end if;

  return v_rotation_id;
end;
$$;

create or replace function public.get_session_rotation_state(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_rotation record;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if not (
    v_activity.user_id = v_user
    or exists (
      select 1 from public.join_requests jr
      where jr.activity_id = p_activity_id
        and jr.user_id = v_user
        and jr.status in ('approved', 'pending', 'waitlisted')
    )
    or (
      v_activity.regular_group_id is not null
      and public.is_regular_group_member(v_activity.regular_group_id, v_user)
    )
  ) then
    raise exception 'Not allowed to view this game';
  end if;

  select * into v_rotation
  from public.session_rotations
  where activity_id = p_activity_id
  order by round_number desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'rotation', null,
      'total_rounds', 0,
      'player_count', (
        select 1 + count(*)::int
        from public.join_requests jr
        where jr.activity_id = p_activity_id and jr.status = 'approved'
      )
    );
  end if;

  select jsonb_build_object(
    'rotation', jsonb_build_object(
      'id', v_rotation.id,
      'round_number', v_rotation.round_number,
      'config', v_rotation.config || jsonb_build_object(
        'sitting_out_players', (
          select coalesce(jsonb_agg(
            jsonb_build_object('user_id', p.id, 'username', p.username)
          ), '[]'::jsonb)
          from unnest(
            coalesce(
              array(
                select jsonb_array_elements_text(v_rotation.config->'sitting_out')::uuid
              ),
              '{}'::uuid[]
            )
          ) as sid
          join public.profiles p on p.id = sid
        )
      ),
      'created_at', v_rotation.created_at,
      'courts', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'court_number', c.court_number,
            'players', (
              select coalesce(jsonb_agg(
                jsonb_build_object(
                  'user_id', p.id,
                  'username', p.username
                ) order by ordinality
              ), '[]'::jsonb)
              from unnest(c.player_ids) with ordinality as u(uid, ordinality)
              join public.profiles p on p.id = u.uid
            )
          ) order by c.court_number
        ), '[]'::jsonb)
        from public.session_rotation_courts c
        where c.rotation_id = v_rotation.id
      )
    ),
    'total_rounds', (
      select count(*)::int from public.session_rotations where activity_id = p_activity_id
    ),
    'player_count', (
      select 1 + count(*)::int
      from public.join_requests jr
      where jr.activity_id = p_activity_id and jr.status = 'approved'
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.generate_session_rotation(uuid, int) from public;
grant execute on function public.generate_session_rotation(uuid, int) to authenticated;

revoke all on function public.get_session_rotation_state(uuid) from public;
grant execute on function public.get_session_rotation_state(uuid) to authenticated;
