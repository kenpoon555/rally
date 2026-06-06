-- Phase 4.1 + 4.2: Sport captain program + Need Players board.

insert into public.app_feature_flags (key, enabled, config)
values
  ('captain_program_v1', true, '{"description":"Sport captain applications and partner Rallies"}'::jsonb),
  ('need_players_v1', true, '{"description":"Need Players board for open spots","cities":["Los Angeles"],"sports":["Badminton","Pickleball"]}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled, config = excluded.config;

-- ── Partner Rally flag ────────────────────────────────────────────────────────

alter table public.regular_groups
  add column if not exists is_partner_rally boolean not null default false;

-- ── Sport captains (approved) ─────────────────────────────────────────────────

create table if not exists public.sport_captains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  city text not null default 'Los Angeles',
  sub_market text,
  status text not null default 'active'
    check (status in ('pending', 'active', 'inactive')),
  regular_group_id uuid references public.regular_groups(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_sport_captains_active_user_sport_city
  on public.sport_captains(user_id, sport, city)
  where status = 'active';

create index if not exists idx_sport_captains_group
  on public.sport_captains(regular_group_id)
  where regular_group_id is not null;

-- ── Captain applications ──────────────────────────────────────────────────────

create table if not exists public.captain_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  city text not null default 'Los Angeles',
  sub_market text,
  typical_game_note text,
  regular_group_id uuid references public.regular_groups(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_captain_applications_pending_user_sport
  on public.captain_applications(user_id, sport, city)
  where status = 'pending';

-- ── Need player posts ─────────────────────────────────────────────────────────

create table if not exists public.need_player_posts (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  sport text not null,
  city text not null default 'Los Angeles',
  spot_count int not null check (spot_count > 0),
  skill_level text not null default 'open'
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'open')),
  location_id uuid references public.activity_locations(id) on delete set null,
  starts_at timestamptz not null,
  note text,
  status text not null default 'open'
    check (status in ('open', 'filled', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_need_player_posts_open_activity
  on public.need_player_posts(activity_id)
  where status = 'open' and activity_id is not null;

create index if not exists idx_need_player_posts_list
  on public.need_player_posts(city, sport, status, starts_at);

-- ── Need player requests ──────────────────────────────────────────────────────

create table if not exists public.need_player_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.need_player_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (post_id, user_id)
);

create index if not exists idx_need_player_requests_post
  on public.need_player_requests(post_id, status);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.sport_captains enable row level security;
alter table public.captain_applications enable row level security;
alter table public.need_player_posts enable row level security;
alter table public.need_player_requests enable row level security;

drop policy if exists "Anyone authenticated reads active captains" on public.sport_captains;
create policy "Anyone authenticated reads active captains"
  on public.sport_captains for select
  using (status = 'active' or user_id = auth.uid());

drop policy if exists "Users view own captain applications" on public.captain_applications;
create policy "Users view own captain applications"
  on public.captain_applications for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_admin, false)
    )
  );

drop policy if exists "Authenticated read open need posts" on public.need_player_posts;
create policy "Authenticated read open need posts"
  on public.need_player_posts for select
  using (
    status = 'open'
    or host_user_id = auth.uid()
    or exists (
      select 1 from public.need_player_requests npr
      where npr.post_id = need_player_posts.id and npr.user_id = auth.uid()
    )
  );

drop policy if exists "Hosts view need requests on their posts" on public.need_player_requests;
create policy "Hosts view need requests on their posts"
  on public.need_player_requests for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.need_player_posts npp
      where npp.id = need_player_requests.post_id
        and npp.host_user_id = auth.uid()
    )
  );

-- ── Helpers ───────────────────────────────────────────────────────────────────

create or replace function public.is_sport_captain(p_user_id uuid, p_sport text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sport_captains sc
    where sc.user_id = p_user_id
      and sc.sport = p_sport
      and sc.status = 'active'
  );
$$;

-- ── Captain application ───────────────────────────────────────────────────────

create or replace function public.submit_captain_application(
  p_sport text,
  p_city text default 'Los Angeles',
  p_typical_game_note text default null,
  p_regular_group_id uuid default null,
  p_sub_market text default null
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

  if not exists (
    select 1 from public.app_feature_flags where key = 'captain_program_v1' and enabled = true
  ) then
    raise exception 'Captain program is not enabled';
  end if;

  if p_sport not in ('Badminton', 'Pickleball', 'Basketball') then
    raise exception 'Sport not supported for captain program yet';
  end if;

  if exists (
    select 1 from public.sport_captains
    where user_id = v_user and sport = p_sport and city = p_city and status = 'active'
  ) then
    raise exception 'You are already an active captain for this sport';
  end if;

  if p_regular_group_id is not null then
    if not exists (
      select 1 from public.regular_groups rg
      where rg.id = p_regular_group_id
        and (
          rg.host_id = v_user
          or exists (
            select 1 from public.regular_group_members rgm
            where rgm.group_id = p_regular_group_id and rgm.user_id = v_user
          )
        )
    ) then
      raise exception 'Rally not found or you are not a member';
    end if;
  end if;

  select id into v_id
  from public.captain_applications
  where user_id = v_user
    and sport = p_sport
    and city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
    and status = 'pending';

  if v_id is not null then
    return v_id;
  end if;

  insert into public.captain_applications (
    user_id, sport, city, sub_market, typical_game_note, regular_group_id
  )
  values (
    v_user,
    p_sport,
    coalesce(nullif(trim(p_city), ''), 'Los Angeles'),
    nullif(trim(p_sub_market), ''),
    nullif(trim(p_typical_game_note), ''),
    p_regular_group_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.get_my_captain_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_captain jsonb;
  v_apps jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', sc.id,
      'sport', sc.sport,
      'city', sc.city,
      'sub_market', sc.sub_market,
      'status', sc.status,
      'regular_group_id', sc.regular_group_id,
      'approved_at', sc.approved_at
    )
  ), '[]'::jsonb)
  into v_captain
  from public.sport_captains sc
  where sc.user_id = v_user;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ca.id,
      'sport', ca.sport,
      'city', ca.city,
      'status', ca.status,
      'typical_game_note', ca.typical_game_note,
      'regular_group_id', ca.regular_group_id,
      'created_at', ca.created_at,
      'reviewed_at', ca.reviewed_at
    )
    order by ca.created_at desc
  ), '[]'::jsonb)
  into v_apps
  from public.captain_applications ca
  where ca.user_id = v_user;

  return jsonb_build_object('captains', v_captain, 'applications', v_apps);
end;
$$;

create or replace function public.admin_approve_captain_application(
  p_application_id uuid,
  p_regular_group_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app record;
  v_group_id uuid;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and coalesce(is_admin, false)
  ) then
    raise exception 'Admin only';
  end if;

  select * into v_app
  from public.captain_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  if v_app.status <> 'pending' then
    raise exception 'Application already reviewed';
  end if;

  v_group_id := coalesce(p_regular_group_id, v_app.regular_group_id);

  update public.captain_applications
  set status = 'approved', reviewed_at = now()
  where id = p_application_id;

  insert into public.sport_captains (
    user_id, sport, city, sub_market, status, regular_group_id, approved_at
  )
  values (
    v_app.user_id,
    v_app.sport,
    v_app.city,
    v_app.sub_market,
    'active',
    v_group_id,
    now()
  )
  on conflict do nothing;

  if v_group_id is not null then
    update public.regular_groups
    set is_partner_rally = true, updated_at = now()
    where id = v_group_id;
  end if;
end;
$$;

create or replace function public.admin_list_pending_captain_applications(p_limit int default 50)
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
        ca.id,
        ca.user_id,
        p.username,
        ca.sport,
        ca.city,
        ca.sub_market,
        ca.typical_game_note,
        ca.regular_group_id,
        ca.created_at
      from public.captain_applications ca
      join public.profiles p on p.id = ca.user_id
      where ca.status = 'pending'
      order by ca.created_at desc
      limit greatest(1, least(p_limit, 100))
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ── Need player posts ─────────────────────────────────────────────────────────

create or replace function public.create_need_player_post(
  p_activity_id uuid,
  p_skill_level text default 'open',
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity record;
  v_post_id uuid;
  v_spots int;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.app_feature_flags where key = 'need_players_v1' and enabled = true
  ) then
    raise exception 'Need Players board is not enabled';
  end if;

  select * into v_activity from public.activities where id = p_activity_id;
  if not found then
    raise exception 'Game not found';
  end if;

  if v_activity.user_id <> v_user then
    raise exception 'Only the host can post open spots';
  end if;

  if v_activity.status <> 'active' or v_activity.match_status = 'finalized' then
    raise exception 'Game is not open for players';
  end if;

  if v_activity.regular_group_id is not null then
    raise exception 'Post open spots from public games — crew games use Rally invites';
  end if;

  if v_activity.sport_type not in ('Badminton', 'Pickleball') then
    raise exception 'Need Players board is LA badminton and pickleball only for now';
  end if;

  v_spots := coalesce(v_activity.missing_players, 0);
  if v_spots < 1 then
    raise exception 'No open spots on this game';
  end if;

  if p_skill_level not in ('beginner', 'intermediate', 'advanced', 'open') then
    raise exception 'Invalid skill level';
  end if;

  update public.need_player_posts
  set status = 'cancelled', updated_at = now()
  where activity_id = p_activity_id and status = 'open';

  insert into public.need_player_posts (
    host_user_id,
    activity_id,
    sport,
    city,
    spot_count,
    skill_level,
    location_id,
    starts_at,
    note
  )
  values (
    v_user,
    p_activity_id,
    v_activity.sport_type,
    'Los Angeles',
    v_spots,
    p_skill_level,
    v_activity.location_id,
    v_activity.start_time,
    nullif(trim(p_note), '')
  )
  returning id into v_post_id;

  return v_post_id;
end;
$$;

create or replace function public.list_need_player_posts(
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
    select 1 from public.app_feature_flags where key = 'need_players_v1' and enabled = true
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.starts_at asc)
    from (
      select
        npp.id,
        npp.activity_id,
        npp.host_user_id,
        npp.sport,
        npp.city,
        npp.spot_count,
        npp.skill_level,
        npp.starts_at,
        npp.note,
        npp.status,
        npp.created_at,
        al.name as location_name,
        al.address as location_address,
        p.username as host_username,
        p.profile_photo_url as host_photo_url,
        public.is_sport_captain(npp.host_user_id, npp.sport) as host_is_captain,
        exists (
          select 1 from public.need_player_requests npr
          where npr.post_id = npp.id
            and npr.user_id = v_user
            and npr.status = 'pending'
        ) as my_request_pending,
        exists (
          select 1 from public.need_player_requests npr
          where npr.post_id = npp.id
            and npr.user_id = v_user
            and npr.status = 'accepted'
        ) as my_request_accepted
      from public.need_player_posts npp
      join public.profiles p on p.id = npp.host_user_id
      left join public.activity_locations al on al.id = npp.location_id
      where npp.status = 'open'
        and npp.starts_at > now() - interval '2 hours'
        and npp.city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
        and (p_sport is null or npp.sport = p_sport)
      order by npp.starts_at asc
      limit 50
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.request_need_player_spot(
  p_post_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_post record;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_post
  from public.need_player_posts
  where id = p_post_id and status = 'open'
  for update;

  if not found then
    raise exception 'Post not found or closed';
  end if;

  if v_post.host_user_id = v_user then
    raise exception 'You cannot request your own post';
  end if;

  if v_post.starts_at < now() - interval '2 hours' then
    raise exception 'This game has already started';
  end if;

  insert into public.need_player_requests (post_id, user_id, message)
  values (p_post_id, v_user, nullif(trim(p_message), ''))
  on conflict (post_id, user_id) do update
  set
    message = excluded.message,
    status = case
      when need_player_requests.status = 'declined' then 'pending'
      else need_player_requests.status
    end,
    created_at = case
      when need_player_requests.status = 'declined' then now()
      else need_player_requests.created_at
    end
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.list_need_player_requests_for_activity(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_host uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select user_id into v_host from public.activities where id = p_activity_id;
  if v_host is null then
    raise exception 'Game not found';
  end if;

  if v_host <> v_user then
    raise exception 'Only the host can view requests';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at asc)
    from (
      select
        npr.id,
        npr.post_id,
        npr.user_id,
        npr.message,
        npr.status,
        npr.created_at,
        p.username,
        p.profile_photo_url
      from public.need_player_requests npr
      join public.need_player_posts npp on npp.id = npr.post_id
      join public.profiles p on p.id = npr.user_id
      where npp.activity_id = p_activity_id
        and npr.status = 'pending'
      order by npr.created_at asc
    ) t
  ), '[]'::jsonb);
end;
$$;

create or replace function public.respond_need_player_request(
  p_request_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_req record;
  v_post record;
  v_activity record;
  v_join_id uuid;
  v_was_approved boolean := false;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select npr.* into v_req
  from public.need_player_requests npr
  where npr.id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_req.status <> 'pending' then
    raise exception 'Request already handled';
  end if;

  select * into v_post
  from public.need_player_posts
  where id = v_req.post_id
  for update;

  if v_post.host_user_id <> v_user then
    raise exception 'Only the host can respond';
  end if;

  if not p_accept then
    update public.need_player_requests
    set status = 'declined', responded_at = now()
    where id = p_request_id;
    return;
  end if;

  if v_post.activity_id is null then
    raise exception 'Post is not linked to a game';
  end if;

  select * into v_activity
  from public.activities
  where id = v_post.activity_id
  for update;

  if v_activity.user_id <> v_user then
    raise exception 'Game host mismatch';
  end if;

  if coalesce(v_activity.missing_players, 0) < 1 then
    raise exception 'No open spots left';
  end if;

  perform public.assert_user_can_join_activity(v_post.activity_id);

  select id, status = 'approved' into v_join_id, v_was_approved
  from public.join_requests
  where activity_id = v_post.activity_id and user_id = v_req.user_id;

  if v_join_id is null then
    insert into public.join_requests (activity_id, user_id, status, responded_at)
    values (v_post.activity_id, v_req.user_id, 'approved', now());
  elsif not v_was_approved then
    update public.join_requests
    set status = 'approved', responded_at = now(), updated_at = now()
    where id = v_join_id;
  end if;

  update public.need_player_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id;

  if not v_was_approved then
    update public.activities
    set
      player_count = coalesce(player_count, 1) + 1,
      missing_players = greatest(coalesce(missing_players, 0) - 1, 0),
      updated_at = now()
    where id = v_post.activity_id;
  end if;

  if (select coalesce(missing_players, 0) from public.activities where id = v_post.activity_id) <= 0 then
    update public.need_player_posts
    set status = 'filled', updated_at = now()
    where id = v_post.id;
  end if;

  perform public.ensure_activity_group_conversation(v_post.activity_id);
end;
$$;

create or replace function public.cancel_need_player_post(p_post_id uuid)
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

  update public.need_player_posts
  set status = 'cancelled', updated_at = now()
  where id = p_post_id and host_user_id = v_user and status = 'open';

  if not found then
    raise exception 'Post not found';
  end if;
end;
$$;

create or replace function public.get_open_need_post_for_activity(p_activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
begin
  select jsonb_build_object(
    'id', npp.id,
    'spot_count', npp.spot_count,
    'skill_level', npp.skill_level,
    'status', npp.status,
    'created_at', npp.created_at
  )
  into v_row
  from public.need_player_posts npp
  where npp.activity_id = p_activity_id and npp.status = 'open'
  limit 1;

  return v_row;
end;
$$;

-- ── Grants ────────────────────────────────────────────────────────────────────

revoke all on function public.is_sport_captain(uuid, text) from public;
grant execute on function public.is_sport_captain(uuid, text) to authenticated;

revoke all on function public.submit_captain_application(text, text, text, uuid, text) from public;
grant execute on function public.submit_captain_application(text, text, text, uuid, text) to authenticated;

revoke all on function public.get_my_captain_status() from public;
grant execute on function public.get_my_captain_status() to authenticated;

revoke all on function public.admin_approve_captain_application(uuid, uuid) from public;
grant execute on function public.admin_approve_captain_application(uuid, uuid) to authenticated;

revoke all on function public.admin_list_pending_captain_applications(int) from public;
grant execute on function public.admin_list_pending_captain_applications(int) to authenticated;

revoke all on function public.create_need_player_post(uuid, text, text) from public;
grant execute on function public.create_need_player_post(uuid, text, text) to authenticated;

revoke all on function public.list_need_player_posts(text, text) from public;
grant execute on function public.list_need_player_posts(text, text) to authenticated;

revoke all on function public.request_need_player_spot(uuid, text) from public;
grant execute on function public.request_need_player_spot(uuid, text) to authenticated;

revoke all on function public.list_need_player_requests_for_activity(uuid) from public;
grant execute on function public.list_need_player_requests_for_activity(uuid) to authenticated;

revoke all on function public.respond_need_player_request(uuid, boolean) from public;
grant execute on function public.respond_need_player_request(uuid, boolean) to authenticated;

revoke all on function public.cancel_need_player_post(uuid) from public;
grant execute on function public.cancel_need_player_post(uuid) to authenticated;

revoke all on function public.get_open_need_post_for_activity(uuid) from public;
grant execute on function public.get_open_need_post_for_activity(uuid) to authenticated;
