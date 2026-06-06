-- Phase 5.1 + 5.2 + 5.3 (minimal) + 6.1: Venue partners, coach listings, intro sessions, sport templates.

insert into public.app_feature_flags (key, enabled, config)
values
  ('partners_v1', true, '{"description":"Partner venues and coach listings"}'::jsonb),
  ('sport_templates_v1', true, '{"description":"Per-sport session defaults"}'::jsonb),
  ('intro_sessions_v1', true, '{"description":"Rally-hosted intro games for strangers"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled, config = excluded.config;

-- ── 5.1 Venue partners (activity_locations) ───────────────────────────────────

alter table public.activity_locations
  add column if not exists partner_tier text
    check (partner_tier is null or partner_tier in ('partner', 'featured')),
  add column if not exists logo_url text,
  add column if not exists promo_note text;

update public.activity_locations
set
  partner_tier = 'partner',
  promo_note = coalesce(promo_note, 'Rally partner court — mention Rally at the desk for member rates.'),
  booking_url = coalesce(booking_url, 'https://www.google.com/maps')
where sport_type = 'Badminton'
  and google_place_id like 'seed-%'
  and partner_tier is null;

update public.activity_locations al
set
  partner_tier = 'featured',
  promo_note = 'Featured pickleball partner — outdoor courts, bring your own paddle.'
from (
  select id from public.activity_locations
  where sport_type = 'Pickleball' and google_place_id like 'seed-%'
  order by created_at
  limit 1
) pick
where al.id = pick.id and al.partner_tier is null;

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
    'longitude', v_lng,
    'partner_tier', v_row.partner_tier,
    'logo_url', v_row.logo_url,
    'promo_note', v_row.promo_note
  );
end;
$$;

create or replace function public.list_partner_venues(
  p_sport text default null,
  p_city text default 'Los Angeles'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.app_feature_flags where key = 'partners_v1' and enabled = true
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.partner_tier desc nulls last, t.name)
    from (
      select
        al.id,
        al.name,
        al.sport_type,
        al.address,
        al.partner_tier,
        al.promo_note,
        al.booking_url,
        st_y(al.location::geometry) as latitude,
        st_x(al.location::geometry) as longitude
      from public.activity_locations al
      where al.partner_tier is not null
        and coalesce(al.is_active, true)
        and (p_sport is null or al.sport_type = p_sport)
      order by al.partner_tier desc nulls last, al.name
      limit 20
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ── 5.2 Coach / clinic listings ───────────────────────────────────────────────

create table if not exists public.coach_listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  city text not null default 'Los Angeles',
  venue_id uuid references public.activity_locations(id) on delete set null,
  schedule_note text,
  booking_url text,
  promo_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_coach_listings_sport_city
  on public.coach_listings(sport, city)
  where is_active = true;

alter table public.coach_listings enable row level security;

drop policy if exists "Authenticated read active coach listings" on public.coach_listings;
create policy "Authenticated read active coach listings"
  on public.coach_listings for select
  using (is_active = true);

insert into public.coach_listings (name, sport, schedule_note, booking_url, promo_note)
select 'LA Badminton Academy', 'Badminton',
  'Tue/Thu 6–9pm · beginner-friendly clinics', 'https://www.google.com/maps',
  'Small-group drills — great before your first Rally game.'
where not exists (select 1 from public.coach_listings where name = 'LA Badminton Academy');

insert into public.coach_listings (name, sport, schedule_note, booking_url, promo_note)
select 'Westside Pickleball', 'Pickleball',
  'Sat 9am intro sessions · paddles available', 'https://www.google.com/maps',
  'New to pickleball? Clinic then join a public game same day.'
where not exists (select 1 from public.coach_listings where name = 'Westside Pickleball');

insert into public.coach_listings (name, sport, schedule_note, booking_url, promo_note)
select 'Run LA Hoops', 'Basketball',
  'Sun open runs · mixed skill', 'https://www.google.com/maps',
  'Pickup runs — link up with hosts on Rally after.'
where not exists (select 1 from public.coach_listings where name = 'Run LA Hoops');

create or replace function public.list_coach_listings(
  p_sport text default null,
  p_city text default 'Los Angeles'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.app_feature_flags where key = 'partners_v1' and enabled = true
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.name)
    from (
      select
        cl.id,
        cl.name,
        cl.sport,
        cl.city,
        cl.schedule_note,
        cl.booking_url,
        cl.promo_note,
        al.name as venue_name
      from public.coach_listings cl
      left join public.activity_locations al on al.id = cl.venue_id
      where cl.is_active
        and cl.city = coalesce(nullif(trim(p_city), ''), 'Los Angeles')
        and (p_sport is null or cl.sport = p_sport)
      order by cl.name
      limit 12
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ── 5.3 Intro sessions flag ───────────────────────────────────────────────────

alter table public.activities
  add column if not exists is_intro_session boolean not null default false;

create index if not exists idx_activities_intro_sessions
  on public.activities(sport_type, start_time)
  where is_intro_session = true and status = 'active';

create or replace function public.list_intro_sessions(
  p_sport text default null,
  p_city text default 'Los Angeles'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.app_feature_flags where key = 'intro_sessions_v1' and enabled = true
  ) then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.start_time asc)
    from (
      select
        a.id,
        a.sport_type,
        a.start_time,
        a.missing_players,
        a.listing_title,
        al.name as location_name,
        p.username as host_username
      from public.activities a
      join public.profiles p on p.id = a.user_id
      left join public.activity_locations al on al.id = a.location_id
      where a.is_intro_session = true
        and a.status = 'active'
        and a.visibility = 'nearby'
        and a.start_time > now() - interval '1 hour'
        and (p_sport is null or a.sport_type = p_sport)
      order by a.start_time asc
      limit 10
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ── 6.1 Sport templates ───────────────────────────────────────────────────────

create table if not exists public.sport_templates (
  sport text primary key,
  default_roster int not null check (default_roster >= 2),
  default_open_spots int not null check (default_open_spots >= 0),
  default_duration_minutes int not null default 60,
  rotation_config jsonb,
  tourney_formats text[] not null default '{}',
  venue_field_hints text[] not null default '{}',
  create_game_hints jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.sport_templates (
  sport, default_roster, default_open_spots, default_duration_minutes,
  rotation_config, tourney_formats, venue_field_hints, create_game_hints
)
values
  (
    'Badminton',
    4, 3, 90,
    '{"team_size":2,"style":"doubles","avoid_repeat_partners":true}'::jsonb,
    array['mini_doubles_round_robin'],
    array['indoor', 'shuttle_fee', 'court_split'],
    '{"listing_title_hint":"Doubles · split court fee","play_intent_default":"pickup"}'::jsonb
  ),
  (
    'Pickleball',
    4, 3, 90,
    '{"team_size":2,"style":"doubles","avoid_repeat_partners":true}'::jsonb,
    array['mini_doubles_round_robin'],
    array['outdoor', 'paddle_rental'],
    '{"listing_title_hint":"Open play · bring paddle","play_intent_default":"pickup"}'::jsonb
  ),
  (
    'Basketball',
    10, 9, 120,
    null,
    '{}',
    array['full_court', 'run_full'],
    '{"listing_title_hint":"Pickup run · full court","play_intent_default":"pickup"}'::jsonb
  )
on conflict (sport) do update set
  default_roster = excluded.default_roster,
  default_open_spots = excluded.default_open_spots,
  default_duration_minutes = excluded.default_duration_minutes,
  rotation_config = excluded.rotation_config,
  tourney_formats = excluded.tourney_formats,
  venue_field_hints = excluded.venue_field_hints,
  create_game_hints = excluded.create_game_hints,
  updated_at = now();

alter table public.regular_groups
  add column if not exists sport_template_id text references public.sport_templates(sport) on delete set null;

create or replace function public.get_sport_template(p_sport text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if not exists (
    select 1 from public.app_feature_flags where key = 'sport_templates_v1' and enabled = true
  ) then
    return null;
  end if;

  select * into v_row from public.sport_templates where sport = p_sport;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'sport', v_row.sport,
    'default_roster', v_row.default_roster,
    'default_open_spots', v_row.default_open_spots,
    'default_duration_minutes', v_row.default_duration_minutes,
    'rotation_config', v_row.rotation_config,
    'tourney_formats', v_row.tourney_formats,
    'venue_field_hints', v_row.venue_field_hints,
    'create_game_hints', v_row.create_game_hints
  );
end;
$$;

-- Extend landing payload with partners + intro sessions
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
  v_partners jsonb;
  v_intro jsonb;
  v_coaches jsonb;
  v_template jsonb;
begin
  if p_sport not in ('Badminton', 'Pickleball', 'Basketball') then
    raise exception 'Sport not supported';
  end if;

  v_slug := lower(p_sport);
  v_template := public.get_sport_template(p_sport);

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
      npp.id, npp.spot_count, npp.starts_at, npp.skill_level,
      al.name as location_name, p.username as host_username
    from public.need_player_posts npp
    join public.profiles p on p.id = npp.host_user_id
    left join public.activity_locations al on al.id = npp.location_id
    where npp.sport = p_sport and npp.status = 'open'
      and npp.starts_at > now() - interval '2 hours'
    order by npp.starts_at asc
    limit 5
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_captains
  from (
    select sc.id, p.username, p.profile_photo_url, sc.sport, sc.city, rg.name as rally_name
    from public.sport_captains sc
    join public.profiles p on p.id = sc.user_id
    left join public.regular_groups rg on rg.id = sc.regular_group_id
    where sc.sport = p_sport and sc.status = 'active'
    order by sc.approved_at desc nulls last
    limit 6
  ) t;

  v_partners := public.list_partner_venues(p_sport, p_city);
  v_intro := public.list_intro_sessions(p_sport, p_city);
  v_coaches := public.list_coach_listings(p_sport, p_city);

  return jsonb_build_object(
    'city', coalesce(nullif(trim(p_city), ''), 'Los Angeles'),
    'sport', p_sport,
    'slug', v_slug,
    'tagline', 'Find your next ' || lower(p_sport) || ' game in Los Angeles',
    'open_games_count', v_open_games,
    'free_agent_count', v_free_agents,
    'need_posts', v_need,
    'captains', v_captains,
    'partner_venues', v_partners,
    'intro_sessions', v_intro,
    'coach_listings', v_coaches,
    'sport_template', v_template
  );
end;
$$;

revoke all on function public.list_partner_venues(text, text) from public;
grant execute on function public.list_partner_venues(text, text) to authenticated;
grant execute on function public.list_partner_venues(text, text) to anon;

revoke all on function public.list_coach_listings(text, text) from public;
grant execute on function public.list_coach_listings(text, text) to authenticated;
grant execute on function public.list_coach_listings(text, text) to anon;

revoke all on function public.list_intro_sessions(text, text) from public;
grant execute on function public.list_intro_sessions(text, text) to authenticated;
grant execute on function public.list_intro_sessions(text, text) to anon;

revoke all on function public.get_sport_template(text) from public;
grant execute on function public.get_sport_template(text) to authenticated;
grant execute on function public.get_sport_template(text) to anon;
