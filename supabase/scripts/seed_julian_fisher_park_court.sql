-- Julian Fisher Park basketball courts — Monrovia, CA (915 S California Ave)
-- Safe to re-run.

INSERT INTO public.activity_locations (id, name, sport_type, google_place_id, radius, location, source, is_active)
SELECT
  'f1000001-0001-4001-8001-000000000201'::uuid,
  'Julian Fisher Park Basketball Courts',
  'Basketball',
  'seed-julian-fisher-park-basketball',
  80,
  ST_SetSRID(ST_MakePoint(-117.9954, 34.1418), 4326)::geography,
  'seed',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.activity_locations
  WHERE google_place_id = 'seed-julian-fisher-park-basketball'
);
