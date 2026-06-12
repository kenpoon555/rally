-- San Francisco outdoor basketball courts (iOS simulator / SF testers).
-- Idempotent via google_place_id. Run in Supabase SQL Editor or:
--   supabase db query --linked -f supabase/scripts/seed_sf_basketball_courts.sql

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Golden Gate Park Basketball Courts', 'Basketball', 'seed-sf-ggp-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4536, 37.7699), 4326)::geography,
  'Golden Gate Park, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-ggp-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Mission Playground Basketball Courts', 'Basketball', 'seed-sf-mission-playground-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4128, 37.7562), 4326)::geography,
  '2450 Harrison St, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-mission-playground-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Crocker Amazon Playground Basketball', 'Basketball', 'seed-sf-crocker-amazon-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4310, 37.7205), 4326)::geography,
  '799 Moscow St, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-crocker-amazon-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Hamilton Recreation Center Basketball', 'Basketball', 'seed-sf-hamilton-rec-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4329, 37.7860), 4326)::geography,
  '1900 Geary Blvd, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-hamilton-rec-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Balboa Park Basketball Courts', 'Basketball', 'seed-sf-balboa-park-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4414, 37.7241), 4326)::geography,
  'Balboa Park, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-balboa-park-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Upper Noe Recreation Center Basketball', 'Basketball', 'seed-sf-upper-noe-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4335, 37.7428), 4326)::geography,
  '295 Day St, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-upper-noe-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location, address, source, is_active)
SELECT 'Joe DiMaggio Playground Basketball', 'Basketball', 'seed-sf-joe-dimaggio-basketball', 80,
  ST_SetSRID(ST_MakePoint(-122.4094, 37.8013), 4326)::geography,
  '651 Lombard St, San Francisco, CA', 'seed', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sf-joe-dimaggio-basketball');
