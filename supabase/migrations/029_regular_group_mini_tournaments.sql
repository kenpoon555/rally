-- Phase 2.5: Mini tournaments inside Regulars groups (doubles round-robin MVP).

create table if not exists public.regular_group_tournaments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.regular_groups(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  sport_type text not null,
  status text not null default 'open'
    check (status in ('open', 'active', 'completed')),
  created_at timestamptz not null default now(),
  started_at timestamptz
);

create index if not exists idx_rg_tournaments_group
  on public.regular_group_tournaments(group_id, created_at desc);

create table if not exists public.regular_group_tournament_members (
  tournament_id uuid not null references public.regular_group_tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  wins int not null default 0,
  losses int not null default 0,
  points int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create table if not exists public.regular_group_tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.regular_group_tournaments(id) on delete cascade,
  round_number int not null default 1,
  home_user_1 uuid not null references public.profiles(id) on delete cascade,
  home_user_2 uuid references public.profiles(id) on delete set null,
  away_user_1 uuid not null references public.profiles(id) on delete cascade,
  away_user_2 uuid references public.profiles(id) on delete set null,
  home_score int,
  away_score int,
  status text not null default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists idx_rg_tournament_matches_tournament
  on public.regular_group_tournament_matches(tournament_id, round_number);

alter table public.regular_group_tournaments enable row level security;
alter table public.regular_group_tournament_members enable row level security;
alter table public.regular_group_tournament_matches enable row level security;

drop policy if exists "Group members view tournaments" on public.regular_group_tournaments;
create policy "Group members view tournaments"
  on public.regular_group_tournaments for select
  using (public.is_regular_group_member(group_id, auth.uid()));

drop policy if exists "Group members view tournament roster" on public.regular_group_tournament_members;
create policy "Group members view tournament roster"
  on public.regular_group_tournament_members for select
  using (
    exists (
      select 1 from public.regular_group_tournaments t
      where t.id = tournament_id
        and public.is_regular_group_member(t.group_id, auth.uid())
    )
  );

drop policy if exists "Group members view tournament matches" on public.regular_group_tournament_matches;
create policy "Group members view tournament matches"
  on public.regular_group_tournament_matches for select
  using (
    exists (
      select 1 from public.regular_group_tournaments t
      where t.id = tournament_id
        and public.is_regular_group_member(t.group_id, auth.uid())
    )
  );

create or replace function public.create_regular_group_tournament(
  p_group_id uuid,
  p_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group record;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_group from public.regular_groups where id = p_group_id;
  if not found then
    raise exception 'Regulars group not found';
  end if;

  if not public.is_regular_group_member(p_group_id, v_user) then
    raise exception 'Not a member of this crew';
  end if;

  if v_group.host_id <> v_user then
    raise exception 'Only the crew host can create a tournament';
  end if;

  insert into public.regular_group_tournaments (group_id, host_id, name, sport_type)
  values (
    p_group_id,
    v_user,
    coalesce(nullif(trim(p_name), ''), v_group.name || ' mini tournament'),
    v_group.sport_type
  )
  returning id into v_id;

  insert into public.regular_group_tournament_members (tournament_id, user_id)
  values (v_id, v_user)
  on conflict do nothing;

  return v_id;
end;
$$;

create or replace function public.join_regular_group_tournament(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tournament record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_tournament from public.regular_group_tournaments where id = p_tournament_id;
  if not found then
    raise exception 'Tournament not found';
  end if;

  if v_tournament.status <> 'open' then
    raise exception 'Tournament is no longer open for new players';
  end if;

  if not public.is_regular_group_member(v_tournament.group_id, v_user) then
    raise exception 'Join the Regulars crew before joining this tournament';
  end if;

  insert into public.regular_group_tournament_members (tournament_id, user_id)
  values (p_tournament_id, v_user)
  on conflict do nothing;
end;
$$;

create or replace function public.start_regular_group_tournament(p_tournament_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tournament record;
  v_members uuid[];
  v_count int;
  v_team_count int;
  v_i int;
  v_j int;
  v_matches int := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_tournament from public.regular_group_tournaments where id = p_tournament_id;
  if not found then
    raise exception 'Tournament not found';
  end if;

  if v_tournament.host_id <> v_user then
    raise exception 'Only the host can start the tournament';
  end if;

  if v_tournament.status <> 'open' then
    raise exception 'Tournament already started';
  end if;

  select array_agg(m.user_id order by m.joined_at)
  into v_members
  from public.regular_group_tournament_members m
  where m.tournament_id = p_tournament_id;

  v_count := coalesce(array_length(v_members, 1), 0);
  if v_count < 4 then
    raise exception 'Need at least 4 players to start doubles round-robin';
  end if;
  if v_count % 2 <> 0 then
    raise exception 'Need an even number of players for doubles';
  end if;

  v_team_count := v_count / 2;

  for v_i in 1..v_team_count loop
    for v_j in v_i + 1..v_team_count loop
      insert into public.regular_group_tournament_matches (
        tournament_id,
        round_number,
        home_user_1,
        home_user_2,
        away_user_1,
        away_user_2
      )
      values (
        p_tournament_id,
        1,
        v_members[(v_i - 1) * 2 + 1],
        v_members[(v_i - 1) * 2 + 2],
        v_members[(v_j - 1) * 2 + 1],
        v_members[(v_j - 1) * 2 + 2]
      );
      v_matches := v_matches + 1;
    end loop;
  end loop;

  update public.regular_group_tournaments
  set status = 'active', started_at = now()
  where id = p_tournament_id;

  return v_matches;
end;
$$;

create or replace function public.record_regular_group_tournament_match(
  p_match_id uuid,
  p_home_score int,
  p_away_score int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match record;
  v_tournament record;
  v_home_won boolean;
  v_winner_ids uuid[];
  v_loser_ids uuid[];
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_match from public.regular_group_tournament_matches where id = p_match_id;
  if not found then
    raise exception 'Match not found';
  end if;

  select * into v_tournament from public.regular_group_tournaments where id = v_match.tournament_id;
  if v_tournament.status <> 'active' then
    raise exception 'Tournament is not active';
  end if;

  if v_tournament.host_id <> v_user then
    raise exception 'Only the host can record scores';
  end if;

  if p_home_score is null or p_away_score is null or p_home_score < 0 or p_away_score < 0 then
    raise exception 'Scores must be non-negative';
  end if;
  if p_home_score = p_away_score then
    raise exception 'Ties are not supported in this MVP';
  end if;

  v_home_won := p_home_score > p_away_score;

  update public.regular_group_tournament_matches
  set home_score = p_home_score, away_score = p_away_score, status = 'done'
  where id = p_match_id;

  v_winner_ids := case
    when v_home_won then array[v_match.home_user_1, v_match.home_user_2]
    else array[v_match.away_user_1, v_match.away_user_2]
  end;
  v_loser_ids := case
    when v_home_won then array[v_match.away_user_1, v_match.away_user_2]
    else array[v_match.home_user_1, v_match.home_user_2]
  end;

  update public.regular_group_tournament_members m
  set
    wins = wins + 1,
    points = points + 3
  where m.tournament_id = v_match.tournament_id
    and m.user_id = any(v_winner_ids);

  update public.regular_group_tournament_members m
  set losses = losses + 1
  where m.tournament_id = v_match.tournament_id
    and m.user_id = any(v_loser_ids);

  if not exists (
    select 1 from public.regular_group_tournament_matches
    where tournament_id = v_match.tournament_id and status = 'pending'
  ) then
    update public.regular_group_tournaments
    set status = 'completed'
    where id = v_match.tournament_id;
  end if;
end;
$$;

grant execute on function public.create_regular_group_tournament(uuid, text) to authenticated;
grant execute on function public.join_regular_group_tournament(uuid) to authenticated;
grant execute on function public.start_regular_group_tournament(uuid) to authenticated;
grant execute on function public.record_regular_group_tournament_match(uuid, int, int) to authenticated;
