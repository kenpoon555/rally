-- Phase 4.3 + 4.5: Free Agent board + sport landing payload.

insert into public.app_feature_flags (key, enabled, config)
values ('free_agents_v1', true, '{"description":"Free agent availability board","cities":["Los Angeles"],"sports":["Badminton","Pickleball"]}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled, config = excluded.config;

-- ── Free agent posts ──────────────────────────────────────────────────────────

create table if not exists public.free_agent_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  city text not null default 'Los Angeles',
  skill_level text not null default 'open'
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'open')),
  availability jsonb not null default '{"preset":"flexible"}'::jsonb,
  note text,
  status text not null default 'open'
    check (status in ('open', 'filled', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_free_agent_posts_open_user_sport
  on public.free_agent_posts(user_id, sport)
  where status = 'open';

create index if not exists idx_free_agent_posts_list
  on public.free_agent_posts(city, sport, status, expires_at);

-- ── Free agent invites (host → agent) ─────────────────────────────────────────

create table if not exists public.free_agent_invites (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.free_agent_posts(id) on delete cascade,
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (post_id, activity_id)
);

create index if not exists idx_free_agent_invites_activity
  on public.free_agent_invites(activity_id, status);

create index if not exists idx_free_agent_invites_agent
  on public.free_agent_invites(post_id, status);

alter table public.free_agent_posts enable row level security;
alter table public.free_agent_invites enable row level security;

drop policy if exists "Authenticated read open free agent posts" on public.free_agent_posts;
create policy "Authenticated read open free agent posts"
  on public.free_agent_posts for select
  using (
    status = 'open'
    or user_id = auth.uid()
  );

drop policy if exists "Users view related free agent invites" on public.free_agent_invites;
create policy "Users view related free agent invites"
  on public.free_agent_invites for select
  using (
    host_user_id = auth.uid()
    or exists (
      select 1 from public.free_agent_posts fap
      where fap.id = free_agent_invites.post_id and fap.user_id = auth.uid()
    )
  );

-- ── Create / manage free agent post ───────────────────────────────────────────

create or replace function public.create_free_agent_post(
  p_sport text,
  p_skill_level text default 'open',
  p_availability_preset text default 'flexible',
  p_note text default null,
  p_expires_days int default 14
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_days int;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'free_agents_v1' and enabled = true
  ) then
    raise exception 'Free Agent board is not enabled';
  end if;

  if p_sport not in ('Badminton', 'Pickleball') then
    raise exception 'Free Agent board is LA badminton and pickleball only for now';
  end if;

  if p_skill_level not in ('beginner', 'intermediate', 'advanced', 'open') then
    raise exception 'Invalid skill level';
  end if;

  if p_availability_preset not in ('weeknights', 'weekends', 'flexible') then
    raise exception 'Invalid availability preset';
  end if;

  v_days := greatest(1, least(coalesce(p_expires_days, 14), 30));

  update public.free_agent_posts
  set status = 'cancelled', updated_at = now()
  where user_id = v_user and sport = p_sport and status = 'open';

  insert into public.free_agent_posts (
    user_id, sport, city, skill_level, availability, note, expires_at
  )
  values (
    v_user,
    p_sport,
    'Los Angeles',
    p_skill_level,
    jsonb_build_object(
      'preset', p_availability_preset,
      'note', nullif(trim(p_note), '')
    ),
    nullif(trim(p_note), ''),
    now() + (v_days || ' days')::interval
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cancel_free_agent_post(p_post_id uuid)
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

  update public.free_agent_posts
  set status = 'cancelled', updated_at = now()
  where id = p_post_id and user_id = v_user and status = 'open';

  if not found then
    raise exception 'Post not found';
  end if;
end;
$$;

create or replace function public.get_my_free_agent_post(p_sport text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select jsonb_build_object(
    'id', fap.id,
    'sport', fap.sport,
    'skill_level', fap.skill_level,
    'availability', fap.availability,
    'note', fap.note,
    'status', fap.status,
    'expires_at', fap.expires_at,
    'created_at', fap.created_at
  )
  into v_row
  from public.free_agent_posts fap
  where fap.user_id = v_user
    and fap.status = 'open'
    and fap.expires_at > now()
    and (p_sport is null or fap.sport = p_sport)
  order by fap.created_at desc
  limit 1;

  return v_row;
end;
$$;

create or replace function public.list_free_agent_posts(
  p_sport text default null,
  p_city text default 'Los Angeles'
)
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

  if not exists (
    select 1 from public.app_feature_flags where key = 'free_agents_v1' and enabled = true
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        fap.id,
        fap.user_id,
        fap.sport,
        fap.city,
        fap.skill_level,
        fap.availability,
        fap.note,
        fap.expires_at,
        fap.created_at,
        p.username,
        p.profile_photo_url,
        public.is_sport_captain(fap.user_id, fap.sport) as is_captain
      from public.free_agent_posts fap
      join public.profiles p on p.id = fap.user_id
      where fap.status = 'open'
        and fap.expires_at > now()
        and fap.city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
        and (p_sport is null or fap.sport = p_sport)
      order by fap.created_at desc
      limit 50
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ── Invites ───────────────────────────────────────────────────────────────────

create or replace function public.invite_free_agent(
  p_post_id uuid,
  p_activity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_post record;
  v_activity record;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_post
  from public.free_agent_posts
  where id = p_post_id and status = 'open' and expires_at > now()
  for update;

  if not found then
    raise exception 'Free agent post not found or expired';
  end if;

  if v_post.user_id = v_user then
    raise exception 'You cannot invite yourself';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can invite free agents';
  end if;

  if v_activity.regular_group_id is not null then
    raise exception 'Invite free agents from public games only';
  end if;

  if v_activity.sport_type <> v_post.sport then
    raise exception 'Sport mismatch';
  end if;

  if v_activity.status <> 'active' or v_activity.match_status = 'finalized' then
    raise exception 'Game is not open';
  end if;

  if coalesce(v_activity.missing_players, 0) < 1 then
    raise exception 'No open spots';
  end if;

  insert into public.free_agent_invites (post_id, host_user_id, activity_id)
  values (p_post_id, v_user, p_activity_id)
  on conflict (post_id, activity_id) do update
  set
    status = case
      when free_agent_invites.status = 'declined' then 'pending'
      else free_agent_invites.status
    end,
    created_at = case
      when free_agent_invites.status = 'declined' then now()
      else free_agent_invites.created_at
    end
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.list_suggested_free_agents_for_activity(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can view suggestions';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.match_score desc, t.created_at desc)
    from (
      select
        fap.id,
        fap.user_id,
        fap.sport,
        fap.skill_level,
        fap.availability,
        fap.note,
        fap.expires_at,
        fap.created_at,
        p.username,
        p.profile_photo_url,
        case
          when (fap.availability->>'preset') = 'weeknights'
            and extract(dow from v_activity.start_time) between 1 and 5
            and extract(hour from v_activity.start_time at time zone 'America/Los_Angeles') between 17 and 22
          then 2
          when (fap.availability->>'preset') = 'weekends'
            and extract(dow from v_activity.start_time) in (0, 6)
          then 2
          else 1
        end as match_score,
        exists (
          select 1 from public.free_agent_invites fai
          where fai.post_id = fap.id
            and fai.activity_id = p_activity_id
            and fai.status = 'pending'
        ) as invite_pending
      from public.free_agent_posts fap
      join public.profiles p on p.id = fap.user_id
      where fap.status = 'open'
        and fap.expires_at > now()
        and fap.sport = v_activity.sport_type
        and fap.user_id <> v_user
      order by match_score desc, fap.created_at desc
      limit 10
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_my_pending_free_agent_invites()
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
        fai.id,
        fai.post_id,
        fai.activity_id,
        fai.host_user_id,
        fai.status,
        fai.created_at,
        hp.username as host_username,
        a.sport_type,
        a.start_time,
        al.name as location_name,
        coalesce(a.missing_players, 0) as open_spots
      from public.free_agent_invites fai
      join public.free_agent_posts fap on fap.id = fai.post_id
      join public.activities a on a.id = fai.activity_id
      join public.profiles hp on hp.id = fai.host_user_id
      left join public.activity_locations al on al.id = a.location_id
      where fap.user_id = v_user
        and fai.status = 'pending'
      order by fai.created_at desc
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.respond_free_agent_invite(
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
  v_post record;
  v_activity record;
  v_join_id uuid;
  v_was_approved boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select fai.* into v_invite
  from public.free_agent_invites fai
  join public.free_agent_posts fap on fap.id = fai.post_id
  where fai.id = p_invite_id and fap.user_id = v_user
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite already handled';
  end if;

  if not p_accept then
    update public.free_agent_invites
    set status = 'declined', responded_at = now()
    where id = p_invite_id;
    return;
  end if;

  select * into v_post from public.free_agent_posts where id = v_invite.post_id;
  select * into v_activity from public.activities where id = v_invite.activity_id for update;

  if coalesce(v_activity.missing_players, 0) < 1 then
    raise exception 'No open spots left';
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

  update public.free_agent_invites
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

-- ── Sport landing payload (4.5) ───────────────────────────────────────────────

create or replace function public.get_sport_landing_payload(
  p_city text default 'Los Angeles',
  p_sport text default 'Badminton'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_need jsonb;
  v_captains jsonb;
  v_open_games int;
  v_free_agents int;
begin
  if p_sport not in ('Badminton', 'Pickleball', 'Basketball') then
    raise exception 'Sport not supported';
  end if;

  v_slug := lower(p_sport);

  select count(*)::int into v_open_games
  from public.activities a
  where a.sport_type = p_sport
    and a.status = 'active'
    and a.visibility = 'nearby'
    and a.regular_group_id is null
    and coalesce(a.missing_players, 0) > 0
    and a.start_time > now() - interval '2 hours';

  select count(*)::int into v_free_agents
  from public.free_agent_posts fap
  where fap.sport = p_sport
    and fap.city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
    and fap.status = 'open'
    and fap.expires_at > now();

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.starts_at asc), '[]'::jsonb)
  into v_need
  from (
    select
      npp.id,
      npp.spot_count,
      npp.starts_at,
      npp.skill_level,
      al.name as location_name,
      p.username as host_username
    from public.need_player_posts npp
    join public.profiles p on p.id = npp.host_user_id
    left join public.activity_locations al on al.id = npp.location_id
    where npp.sport = p_sport
      and npp.city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
      and npp.status = 'open'
      and npp.starts_at > now() - interval '2 hours'
    order by npp.starts_at asc
    limit 5
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_captains
  from (
    select
      sc.id,
      p.username,
      p.profile_photo_url,
      sc.sport,
      sc.city,
      rg.name as rally_name
    from public.sport_captains sc
    join public.profiles p on p.id = sc.user_id
    left join public.regular_groups rg on rg.id = sc.regular_group_id
    where sc.sport = p_sport
      and sc.city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
      and sc.status = 'active'
    order by sc.approved_at desc nulls last
    limit 6
  ) t;

  return jsonb_build_object(
    'city', coalesce(nullif(trim(p_city), ''), 'Los Angeles'),
    'sport', p_sport,
    'slug', v_slug,
    'tagline', 'Find your next ' || lower(p_sport) || ' game in Los Angeles',
    'open_games_count', v_open_games,
    'free_agent_count', v_free_agents,
    'need_posts', v_need,
    'captains', v_captains
  );
end;
$$;

revoke all on function public.create_free_agent_post(text, text, text, text, int) from public;
grant execute on function public.create_free_agent_post(text, text, text, text, int) to authenticated;

revoke all on function public.cancel_free_agent_post(uuid) from public;
grant execute on function public.cancel_free_agent_post(uuid) to authenticated;

revoke all on function public.get_my_free_agent_post(text) from public;
grant execute on function public.get_my_free_agent_post(text) to authenticated;

revoke all on function public.list_free_agent_posts(text, text) from public;
grant execute on function public.list_free_agent_posts(text, text) to authenticated;

revoke all on function public.invite_free_agent(uuid, uuid) from public;
grant execute on function public.invite_free_agent(uuid, uuid) to authenticated;

revoke all on function public.list_suggested_free_agents_for_activity(uuid) from public;
grant execute on function public.list_suggested_free_agents_for_activity(uuid) to authenticated;

revoke all on function public.list_my_pending_free_agent_invites() from public;
grant execute on function public.list_my_pending_free_agent_invites() to authenticated;

revoke all on function public.respond_free_agent_invite(uuid, boolean) from public;
grant execute on function public.respond_free_agent_invite(uuid, boolean) to authenticated;

revoke all on function public.get_sport_landing_payload(text, text) from public;
grant execute on function public.get_sport_landing_payload(text, text) to authenticated;
grant execute on function public.get_sport_landing_payload(text, text) to anon;
