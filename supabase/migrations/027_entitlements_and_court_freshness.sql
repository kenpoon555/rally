-- 027: Monetization-ready entitlements scaffold + court freshness / community reports
--
-- Entitlements: flip paid features on later without schema churn.
-- Courts: track freshness, hide closed venues, let hosts add via Places when seed data is missing.

-- ── Entitlements ─────────────────────────────────────────────────────────────

create table if not exists public.user_entitlements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature_key text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  source text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (user_id, feature_key)
);

create index if not exists idx_user_entitlements_user_feature
  on public.user_entitlements(user_id, feature_key);

alter table public.user_entitlements enable row level security;

drop policy if exists "Users read own entitlements" on public.user_entitlements;
create policy "Users read own entitlements"
  on public.user_entitlements
  for select
  using (user_id = auth.uid());

-- Service role / admin inserts entitlements (no client insert policy yet).

create or replace function public.user_has_entitlement(
  p_feature_key text,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_feature_key is null or length(trim(p_feature_key)) = 0 then
    return false;
  end if;

  return exists (
    select 1
    from public.user_entitlements e
    where e.user_id = p_user_id
      and e.feature_key = p_feature_key
      and (e.expires_at is null or e.expires_at > now())
  );
end;
$$;

grant execute on function public.user_has_entitlement(text, uuid) to authenticated;

insert into public.app_feature_flags (key, enabled, config)
values
  ('entitlement_organizer_pro', false, '{"description":"Organizer Pro paid tier"}'::jsonb),
  ('entitlement_player_plus', false, '{"description":"Player Plus paid tier"}'::jsonb),
  ('entitlement_leagues', false, '{"description":"Leagues feature gate"}'::jsonb)
on conflict (key) do nothing;

-- ── Court freshness ──────────────────────────────────────────────────────────

alter table public.activity_locations
  add column if not exists is_active boolean not null default true,
  add column if not exists source text not null default 'seed',
  add column if not exists last_verified_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.court_reports (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references public.activity_locations(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null check (report_type in ('closed', 'wrong_sport', 'wrong_location', 'duplicate', 'other')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_court_reports_location
  on public.court_reports(location_id, created_at desc);

alter table public.court_reports enable row level security;

drop policy if exists "Authenticated users insert court reports" on public.court_reports;
create policy "Authenticated users insert court reports"
  on public.court_reports
  for insert
  with check (reporter_id = auth.uid());

drop policy if exists "Authenticated users read court reports" on public.court_reports;
create policy "Authenticated users read court reports"
  on public.court_reports
  for select
  using (true);

create or replace function public.report_court_issue(
  p_location_id uuid,
  p_report_type text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id uuid;
  v_closed_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_report_type not in ('closed', 'wrong_sport', 'wrong_location', 'duplicate', 'other') then
    raise exception 'Invalid report type';
  end if;

  insert into public.court_reports (location_id, reporter_id, report_type, note)
  values (p_location_id, auth.uid(), p_report_type, nullif(trim(p_note), ''))
  returning id into v_report_id;

  update public.activity_locations
  set updated_at = now()
  where id = p_location_id;

  -- Auto-hide after 2 independent "closed" reports (lightweight community moderation).
  if p_report_type = 'closed' then
    select count(distinct reporter_id)::integer into v_closed_count
    from public.court_reports
    where location_id = p_location_id
      and report_type = 'closed';

    if v_closed_count >= 2 then
      update public.activity_locations
      set is_active = false, updated_at = now()
      where id = p_location_id;
    end if;
  end if;

  return v_report_id;
end;
$$;

grant execute on function public.report_court_issue(uuid, text, text) to authenticated;

-- Only return active courts in nearby search.
create or replace function public.get_nearby_locations(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer
)
returns table (
  id uuid,
  name text,
  sport_type text,
  location geography,
  google_place_id text,
  radius integer,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    al.id,
    al.name,
    al.sport_type,
    al.location,
    al.google_place_id,
    al.radius,
    al.created_at
  from public.activity_locations al
  where al.is_active is true
    and al.location is not null
    and st_dwithin(
      al.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    );
end;
$$;
