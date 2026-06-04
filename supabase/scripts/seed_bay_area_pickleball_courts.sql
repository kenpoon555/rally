-- Seed pickleball courts near Cupertino / SF Bay Area (iOS simulator default area).
-- Run in Supabase SQL Editor after migrations.
-- Safe to re-run: skips rows when google_place_id already exists.

INSERT INTO activity_locations (name, sport_type, location, google_place_id, radius)
VALUES
  (
    'Cupertino Memorial Park Pickleball',
    'Pickleball',
    ST_SetSRID(ST_MakePoint(-122.0322, 37.3230), 4326)::geography,
    'seed-cupertino-memorial-pickleball',
    80
  ),
  (
    'Sunnyvale Baylands Pickleball Courts',
    'Pickleball',
    ST_SetSRID(ST_MakePoint(-122.0125, 37.3895), 4326)::geography,
    'seed-sunnyvale-baylands-pickleball',
    80
  ),
  (
    'Mountain View Rengstorff Park Pickleball',
    'Pickleball',
    ST_SetSRID(ST_MakePoint(-122.0955, 37.4058), 4326)::geography,
    'seed-mv-rengstorff-pickleball',
    80
  ),
  (
    'San Jose Backesto Park Pickleball',
    'Pickleball',
    ST_SetSRID(ST_MakePoint(-121.8835, 37.3488), 4326)::geography,
    'seed-sj-backesto-pickleball',
    80
  ),
  (
    'Palo Alto Mitchell Park Pickleball',
    'Pickleball',
    ST_SetSRID(ST_MakePoint(-122.1088, 37.4212), 4326)::geography,
    'seed-pa-mitchell-pickleball',
    80
  )
ON CONFLICT (google_place_id) DO NOTHING;
