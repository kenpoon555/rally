-- Phase 1.5: In-group leaderboard (attendance, streaks, tourney W/L).

insert into public.app_feature_flags (key, enabled, config)
values
  ('leaderboard_v1', true, '{"description":"Rally crew leaderboard"}'::jsonb),
  ('mini_tournament_v1', true, '{"description":"Mini tournament in Rally crews"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled;

create or replace function public._rally_week_streak(
  p_group_id uuid,
  p_user_id uuid
)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_week timestamptz;
  v_streak int := 0;
begin
  select max(date_trunc('week', a.start_time))
  into v_week
  from public.game_attendance ga
  join public.activities a on a.id = ga.activity_id
  where a.regular_group_id = p_group_id
    and ga.user_id = p_user_id
    and ga.attended = true;

  if v_week is null then
    return 0;
  end if;

  loop
    if exists (
      select 1
      from public.game_attendance ga
      join public.activities a on a.id = ga.activity_id
      where a.regular_group_id = p_group_id
        and ga.user_id = p_user_id
        and ga.attended = true
        and date_trunc('week', a.start_time) = v_week
    ) then
      v_streak := v_streak + 1;
      v_week := v_week - interval '7 days';
    else
      exit;
    end if;

    if v_streak > 104 then
      exit;
    end if;
  end loop;

  return v_streak;
end;
$$;

create or replace function public.get_rally_leaderboard(
  p_group_id uuid,
  p_window_days int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cutoff timestamptz;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'leaderboard_v1' and enabled = true
  ) then
    raise exception 'Leaderboard is not enabled';
  end if;

  if not public.is_regular_group_member(p_group_id, v_user) then
    raise exception 'Not a member of this crew';
  end if;

  if p_window_days is not null and p_window_days > 0 then
    v_cutoff := now() - (p_window_days || ' days')::interval;
  end if;

  with members as (
    select rgm.user_id, p.username, rgm.role
    from public.regular_group_members rgm
    join public.profiles p on p.id = rgm.user_id
    where rgm.group_id = p_group_id
  ),
  attended as (
    select ga.user_id, count(*)::int as sessions_attended
    from public.game_attendance ga
    join public.activities a on a.id = ga.activity_id
    where a.regular_group_id = p_group_id
      and ga.attended = true
      and (v_cutoff is null or a.start_time >= v_cutoff)
    group by ga.user_id
  ),
  games as (
    select sub.user_id, count(distinct sub.activity_id)::int as games_played
    from (
      select a.id as activity_id, a.user_id
      from public.activities a
      where a.regular_group_id = p_group_id
        and a.match_status = 'finalized'
        and (v_cutoff is null or a.start_time >= v_cutoff)
      union
      select a.id as activity_id, jr.user_id
      from public.join_requests jr
      join public.activities a on a.id = jr.activity_id
      where a.regular_group_id = p_group_id
        and jr.status = 'approved'
        and a.match_status = 'finalized'
        and (v_cutoff is null or a.start_time >= v_cutoff)
    ) sub
    group by sub.user_id
  ),
  tourney as (
    select
      tm.user_id,
      coalesce(sum(tm.wins), 0)::int as tournament_wins,
      coalesce(sum(tm.losses), 0)::int as tournament_losses
    from public.regular_group_tournament_members tm
    join public.regular_group_tournaments t on t.id = tm.tournament_id
    where t.group_id = p_group_id
      and (v_cutoff is null or t.created_at >= v_cutoff)
    group by tm.user_id
  ),
  scored as (
    select
      m.user_id,
      m.username,
      m.role,
      coalesce(att.sessions_attended, 0) as sessions_attended,
      coalesce(g.games_played, 0) as games_played,
      public._rally_week_streak(p_group_id, m.user_id) as week_streak,
      coalesce(tr.tournament_wins, 0) as tournament_wins,
      coalesce(tr.tournament_losses, 0) as tournament_losses
    from members m
    left join attended att on att.user_id = m.user_id
    left join games g on g.user_id = m.user_id
    left join tourney tr on tr.user_id = m.user_id
  ),
  ranked as (
    select
      s.*,
      row_number() over (
        order by
          s.sessions_attended desc,
          s.tournament_wins desc,
          s.games_played desc,
          s.username asc
      )::int as rank
    from scored s
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id', r.user_id,
        'username', r.username,
        'role', r.role,
        'sessions_attended', r.sessions_attended,
        'games_played', r.games_played,
        'week_streak', r.week_streak,
        'tournament_wins', r.tournament_wins,
        'tournament_losses', r.tournament_losses,
        'rank', r.rank
      )
      order by r.rank
    ),
    '[]'::jsonb
  )
  into v_result
  from ranked r;

  return v_result;
end;
$$;

revoke all on function public._rally_week_streak(uuid, uuid) from public;
grant execute on function public._rally_week_streak(uuid, uuid) to authenticated;

revoke all on function public.get_rally_leaderboard(uuid, int) from public;
grant execute on function public.get_rally_leaderboard(uuid, int) to authenticated;
