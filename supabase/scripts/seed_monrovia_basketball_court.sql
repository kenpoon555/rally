-- Monrovia Recreation Park basketball courts (LA area tester seed)
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT
  'Monrovia Recreation Park Basketball Courts',
  'Basketball',
  'seed-monrovia-rec-park-basketball',
  80,
  ST_SetSRID(ST_MakePoint(-118.0019, 34.1442), 4326)
WHERE NOT EXISTS (
  SELECT 1 FROM public.activity_locations
  WHERE google_place_id = 'seed-monrovia-rec-park-basketball'
);
