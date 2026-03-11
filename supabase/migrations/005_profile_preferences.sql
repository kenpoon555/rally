-- Phase 8 / V2.1 foundation:
-- Profile upgrades and user preference center fields.

alter table public.profiles
  add column if not exists nickname text,
  add column if not exists default_duration integer,
  add column if not exists default_visibility text
    check (default_visibility in ('friends', 'nearby')),
  add column if not exists default_distance_meters integer,
  add column if not exists default_time_window_start time,
  add column if not exists default_time_window_end time,
  add column if not exists onboarding_completed boolean not null default false;

-- Keep existing profile_photo_url as the canonical avatar field for now.
-- Optional backfill for nickname from username.
update public.profiles
set nickname = username
where nickname is null;
