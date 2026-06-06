-- Phase 3.4 + 4.4 (minimal) + 6.2: Auto-fill suggestions, concierge intake, captain feedback.

insert into public.app_feature_flags (key, enabled, config)
values ('fill_ins_v1', true, '{"description":"Host suggest fill-ins from liquidity pool"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled;

-- ── 3.4 Fill-in invites (seekers + unified accept) ────────────────────────────

create table if not exists public.activity_fill_invites (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('free_agent', 'seeker')),
  source_post_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (activity_id, target_user_id)
);

create index if not exists idx_activity_fill_invites_target
  on public.activity_fill_invites(target_user_id, status);

alter table public.activity_fill_invites enable row level security;

drop policy if exists "Parties view fill invites" on public.activity_fill_invites;
create policy "Parties view fill invites"
  on public.activity_fill_invites for select
  using (
    host_user_id = auth.uid()
    or target_user_id = auth.uid()
  );

create or replace function public.suggest_fill_ins(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_agents jsonb;
  v_seekers jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'fill_ins_v1' and enabled = true
  ) then
    return '[]'::jsonb;
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can view fill-in suggestions';
  end if;

  if v_activity.regular_group_id is not null then
    return '[]'::jsonb;
  end if;

  if coalesce(v_activity.missing_players, 0) < 1 then
    return '[]'::jsonb;
  end if;

  v_agents := public.list_suggested_free_agents_for_activity(p_activity_id);

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.requested_at desc), '[]'::jsonb)
  into v_seekers
  from (
    select distinct on (npr.user_id)
      npr.user_id,
      p.username,
      p.profile_photo_url,
      'seeker'::text as source,
      npr.created_at as requested_at,
      1 as match_score,
      exists (
        select 1 from public.activity_fill_invites afi
        where afi.activity_id = p_activity_id
          and afi.target_user_id = npr.user_id
          and afi.status = 'pending'
      ) as invite_pending
    from public.need_player_requests npr
    join public.need_player_posts npp on npp.id = npr.post_id
    join public.profiles p on p.id = npr.user_id
    where npr.status = 'pending'
      and npp.status = 'open'
      and npp.sport = v_activity.sport_type
      and npp.host_user_id <> v_user
      and npr.user_id <> v_user
      and npr.created_at > now() - interval '14 days'
      and not exists (
        select 1 from public.join_requests jr
        where jr.activity_id = p_activity_id and jr.user_id = npr.user_id
      )
    order by npr.user_id, npr.created_at desc
    limit 10
  ) t;

  return coalesce((
    select jsonb_agg(item order by (item->>'match_score')::int desc nulls last)
    from (
      select jsonb_build_object(
        'source', 'free_agent',
        'post_id', fa.id,
        'user_id', fa.user_id,
        'username', fa.username,
        'profile_photo_url', fa.profile_photo_url,
        'skill_level', fa.skill_level,
        'availability', fa.availability,
        'note', fa.note,
        'match_score', fa.match_score,
        'invite_pending', fa.invite_pending
      ) as item
      from jsonb_to_recordset(v_agents) as fa(
        id uuid, user_id uuid, username text, profile_photo_url text,
        skill_level text, availability jsonb, note text,
        match_score int, invite_pending boolean
      )
      union all
      select jsonb_build_object(
        'source', 'seeker',
        'post_id', null,
        'user_id', s.user_id,
        'username', s.username,
        'profile_photo_url', s.profile_photo_url,
        'skill_level', null,
        'availability', null,
        'note', 'Requested spots on another game',
        'match_score', s.match_score,
        'invite_pending', s.invite_pending
      )
      from jsonb_to_recordset(v_seekers) as s(
        user_id uuid, username text, profile_photo_url text,
        match_score int, invite_pending boolean
      )
    ) combined
  ), '[]'::jsonb);
end;
$$;

create or replace function public.invite_fill_in(
  p_activity_id uuid,
  p_target_user_id uuid,
  p_source text default 'seeker',
  p_source_post_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_source = 'free_agent' and p_source_post_id is not null then
    return public.invite_free_agent(p_source_post_id, p_activity_id)::uuid;
  end if;

  if not exists (
    select 1 from public.activities a
    where a.id = p_activity_id
      and a.user_id = v_user
      and a.status = 'active'
      and a.match_status <> 'finalized'
      and coalesce(a.missing_players, 0) > 0
  ) then
    raise exception 'Game is not open for fill-ins';
  end if;

  if p_target_user_id = v_user then
    raise exception 'Cannot invite yourself';
  end if;

  insert into public.activity_fill_invites (
    activity_id, host_user_id, target_user_id, source, source_post_id
  )
  values (p_activity_id, v_user, p_target_user_id, coalesce(p_source, 'seeker'), p_source_post_id)
  on conflict (activity_id, target_user_id) do update
  set
    status = case
      when activity_fill_invites.status = 'declined' then 'pending'
      else activity_fill_invites.status
    end,
    source = excluded.source,
    created_at = case
      when activity_fill_invites.status = 'declined' then now()
      else activity_fill_invites.created_at
    end
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.list_my_pending_fill_invites()
returns jsonb
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

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        afi.id,
        afi.activity_id,
        afi.host_user_id,
        afi.source,
        afi.created_at,
        hp.username as host_username,
        a.sport_type,
        a.start_time,
        al.name as location_name,
        coalesce(a.missing_players, 0) as open_spots
      from public.activity_fill_invites afi
      join public.activities a on a.id = afi.activity_id
      join public.profiles hp on hp.id = afi.host_user_id
      left join public.activity_locations al on al.id = a.location_id
      where afi.target_user_id = v_user
        and afi.status = 'pending'
      order by afi.created_at desc
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.respond_fill_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite record;
  v_join_id uuid;
  v_was_approved boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_invite
  from public.activity_fill_invites
  where id = p_invite_id and target_user_id = v_user
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite already handled';
  end if;

  if not p_accept then
    update public.activity_fill_invites
    set status = 'declined', responded_at = now()
    where id = p_invite_id;
    return;
  end if;

  perform public.assert_user_can_join_activity(v_invite.activity_id);

  select id, status = 'approved' into v_join_id, v_was_approved
  from public.join_requests
  where activity_id = v_invite.activity_id and user_id = v_user;

  if v_join_id is null then
    insert into public.join_requests (activity_id, user_id, status, responded_at)
    values (v_invite.activity_id, v_user, 'approved', now());
  elsif not v_was_approved then
    update public.join_requests
    set status = 'approved', responded_at = now(), updated_at = now()
    where id = v_join_id;
  end if;

  update public.activity_fill_invites
  set status = 'accepted', responded_at = now()
  where id = p_invite_id;

  if not v_was_approved then
    update public.activities
    set
      player_count = coalesce(player_count, 1) + 1,
      missing_players = greatest(coalesce(missing_players, 0) - 1, 0),
      updated_at = now()
    where id = v_invite.activity_id;
  end if;

  perform public.ensure_activity_group_conversation(v_invite.activity_id);
end;
$$;

-- ── 4.4 Concierge requests ────────────────────────────────────────────────────

create table if not exists public.concierge_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  skill_level text default 'open'
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'open')),
  area_note text,
  availability_note text,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'closed')),
  admin_note text,
  matched_activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_concierge_requests_status
  on public.concierge_requests(status, created_at desc);

alter table public.concierge_requests enable row level security;

drop policy if exists "Users view own concierge requests" on public.concierge_requests;
create policy "Users view own concierge requests"
  on public.concierge_requests for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_admin, false)
    )
  );

create or replace function public.submit_concierge_request(
  p_sport text,
  p_skill_level text default 'open',
  p_area_note text default null,
  p_availability_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  insert into public.concierge_requests (
    user_id, sport, skill_level, area_note, availability_note
  )
  values (
    v_user,
    p_sport,
    coalesce(nullif(trim(p_skill_level), ''), 'open'),
    nullif(trim(p_area_note), ''),
    nullif(trim(p_availability_note), '')
  )
  returning id into v_id;

  return v_id;
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
        cr.created_at
      from public.concierge_requests cr
      join public.profiles p on p.id = cr.user_id
      where cr.status = 'pending'
      order by cr.created_at desc
      limit greatest(1, least(p_limit, 100))
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_update_concierge_request(
  p_request_id uuid,
  p_status text,
  p_admin_note text default null
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

  update public.concierge_requests
  set
    status = p_status,
    admin_note = coalesce(nullif(trim(p_admin_note), ''), admin_note),
    updated_at = now()
  where id = p_request_id;
end;
$$;

-- ── 6.2 Captain feedback ──────────────────────────────────────────────────────

create table if not exists public.captain_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  feature_area text not null,
  friction_score int not null check (friction_score between 1 and 5),
  note text not null,
  activity_id uuid references public.activities(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_captain_feedback_sport
  on public.captain_feedback(sport, created_at desc);

alter table public.captain_feedback enable row level security;

drop policy if exists "Captains and admins read captain feedback" on public.captain_feedback;
create policy "Captains and admins read captain feedback"
  on public.captain_feedback for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_admin, false)
    )
  );

create or replace function public.submit_captain_feedback(
  p_sport text,
  p_feature_area text,
  p_friction_score int,
  p_note text,
  p_activity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_sport_captain(v_user, p_sport) then
    raise exception 'Only active captains can submit sport feedback';
  end if;

  if p_friction_score < 1 or p_friction_score > 5 then
    raise exception 'Friction score must be 1–5';
  end if;

  if nullif(trim(p_note), '') is null then
    raise exception 'Note is required';
  end if;

  insert into public.captain_feedback (
    user_id, sport, feature_area, friction_score, note, activity_id
  )
  values (
    v_user,
    p_sport,
    nullif(trim(p_feature_area), ''),
    p_friction_score,
    nullif(trim(p_note), ''),
    p_activity_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.admin_list_captain_feedback(p_limit int default 30)
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
        cf.id,
        cf.sport,
        cf.feature_area,
        cf.friction_score,
        cf.note,
        cf.activity_id,
        cf.created_at,
        p.username
      from public.captain_feedback cf
      join public.profiles p on p.id = cf.user_id
      order by cf.created_at desc
      limit greatest(1, least(p_limit, 100))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.suggest_fill_ins(uuid) from public;
grant execute on function public.suggest_fill_ins(uuid) to authenticated;

revoke all on function public.invite_fill_in(uuid, uuid, text, uuid) from public;
grant execute on function public.invite_fill_in(uuid, uuid, text, uuid) to authenticated;

revoke all on function public.list_my_pending_fill_invites() from public;
grant execute on function public.list_my_pending_fill_invites() to authenticated;

revoke all on function public.respond_fill_invite(uuid, boolean) from public;
grant execute on function public.respond_fill_invite(uuid, boolean) to authenticated;

revoke all on function public.submit_concierge_request(text, text, text, text) from public;
grant execute on function public.submit_concierge_request(text, text, text, text) to authenticated;

revoke all on function public.admin_list_concierge_requests(int) from public;
grant execute on function public.admin_list_concierge_requests(int) to authenticated;

revoke all on function public.admin_update_concierge_request(uuid, text, text) from public;
grant execute on function public.admin_update_concierge_request(uuid, text, text) to authenticated;

revoke all on function public.submit_captain_feedback(text, text, int, text, uuid) from public;
grant execute on function public.submit_captain_feedback(text, text, int, text, uuid) to authenticated;

revoke all on function public.admin_list_captain_feedback(int) from public;
grant execute on function public.admin_list_captain_feedback(int) to authenticated;
