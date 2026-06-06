-- Phase 4.4 + 5.3 ops: concierge match linking + admin intro session calendar.

create or replace function public.admin_search_match_games(
  p_sport text,
  p_limit int default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and coalesce(is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.start_time asc)
    from (
      select
        a.id,
        a.sport_type,
        a.start_time,
        coalesce(a.missing_players, 0) as open_spots,
        a.listing_title,
        al.name as location_name,
        p.username as host_username
      from public.activities a
      join public.profiles p on p.id = a.user_id
      left join public.activity_locations al on al.id = a.location_id
      where a.status = 'active'
        and a.visibility = 'nearby'
        and a.regular_group_id is null
        and a.start_time > now() - interval '1 hour'
        and a.start_time < now() + interval '14 days'
        and coalesce(a.missing_players, 0) > 0
        and (p_sport is null or a.sport_type = p_sport)
      order by a.start_time asc
      limit greatest(1, least(p_limit, 25))
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_update_concierge_request(
  p_request_id uuid,
  p_status text,
  p_admin_note text default null,
  p_matched_activity_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and coalesce(is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  if p_status not in ('pending', 'matched', 'closed') then
    raise exception 'Invalid status';
  end if;

  if p_matched_activity_id is not null and not exists (
    select 1 from public.activities where id = p_matched_activity_id
  ) then
    raise exception 'Matched game not found';
  end if;

  update public.concierge_requests
  set
    status = p_status,
    admin_note = coalesce(nullif(trim(p_admin_note), ''), admin_note),
    matched_activity_id = case
      when p_matched_activity_id is not null then p_matched_activity_id
      else matched_activity_id
    end,
    updated_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.admin_list_concierge_requests(p_limit int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and coalesce(is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        cr.id,
        cr.user_id,
        p.username,
        cr.sport,
        cr.skill_level,
        cr.area_note,
        cr.availability_note,
        cr.status,
        cr.admin_note,
        cr.matched_activity_id,
        cr.created_at,
        ma.start_time as matched_start_time,
        ma.sport_type as matched_sport,
        mal.name as matched_location_name,
        mhp.username as matched_host_username
      from public.concierge_requests cr
      join public.profiles p on p.id = cr.user_id
      left join public.activities ma on ma.id = cr.matched_activity_id
      left join public.profiles mhp on mhp.id = ma.user_id
      left join public.activity_locations mal on mal.id = ma.location_id
      where cr.status = 'pending'
      order by cr.created_at desc
      limit greatest(1, least(p_limit, 100))
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_list_public_games_for_intro(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and coalesce(is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.start_time asc)
    from (
      select
        a.id,
        a.sport_type,
        a.start_time,
        coalesce(a.missing_players, 0) as open_spots,
        a.listing_title,
        a.is_intro_session,
        al.name as location_name,
        p.username as host_username
      from public.activities a
      join public.profiles p on p.id = a.user_id
      left join public.activity_locations al on al.id = a.location_id
      where a.status = 'active'
        and a.visibility = 'nearby'
        and a.regular_group_id is null
        and a.start_time > now() - interval '1 hour'
        and a.start_time < now() + interval '14 days'
      order by a.is_intro_session desc, a.start_time asc
      limit greatest(1, least(p_limit, 50))
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_set_intro_session(
  p_activity_id uuid,
  p_is_intro boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and coalesce(is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  if not exists (
    select 1 from public.activities a
    where a.id = p_activity_id
      and a.status = 'active'
      and a.visibility = 'nearby'
      and a.regular_group_id is null
  ) then
    raise exception 'Only active public games can be intro sessions';
  end if;

  update public.activities
  set is_intro_session = p_is_intro, updated_at = now()
  where id = p_activity_id;
end;
$$;

revoke all on function public.admin_search_match_games(text, int) from public;
grant execute on function public.admin_search_match_games(text, int) to authenticated;

revoke all on function public.admin_list_public_games_for_intro(int) from public;
grant execute on function public.admin_list_public_games_for_intro(int) to authenticated;

revoke all on function public.admin_set_intro_session(uuid, boolean) from public;
grant execute on function public.admin_set_intro_session(uuid, boolean) to authenticated;
