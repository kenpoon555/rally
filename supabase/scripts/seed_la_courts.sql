-- LA metro courts for closed beta (all 10 launch sports). Idempotent via google_place_id.

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Griffith Park Pickleball Courts', 'Pickleball', 'seed-la-griffith-park-pickleball', 80, ST_SetSRID(ST_MakePoint(-118.296, 34.132), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-pickleball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Santa Monica Memorial Park Pickleball', 'Pickleball', 'seed-la-santa-monica-memorial-pickleball', 80, ST_SetSRID(ST_MakePoint(-118.491, 34.024), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-santa-monica-memorial-pickleball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Culver City Syd Kronenthal Park Pickleball', 'Pickleball', 'seed-la-culver-syd-kronenthal-pickleball', 80, ST_SetSRID(ST_MakePoint(-118.395, 34.008), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-culver-syd-kronenthal-pickleball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Mar Vista Recreation Center Pickleball', 'Pickleball', 'seed-la-mar-vista-rec-pickleball', 80, ST_SetSRID(ST_MakePoint(-118.432, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-mar-vista-rec-pickleball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Monrovia Recreation Park Basketball Courts', 'Basketball', 'seed-monrovia-rec-park-basketball', 80, ST_SetSRID(ST_MakePoint(-118.0019, 34.1442), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-monrovia-rec-park-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Julian Fisher Park Basketball Courts', 'Basketball', 'seed-julian-fisher-park-basketball', 80, ST_SetSRID(ST_MakePoint(-117.9954, 34.1418), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-julian-fisher-park-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Venice Beach Basketball Courts', 'Basketball', 'seed-la-venice-beach-basketball', 80, ST_SetSRID(ST_MakePoint(-118.469, 33.985), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-venice-beach-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Pan Pacific Park Basketball Courts', 'Basketball', 'seed-la-pan-pacific-basketball', 80, ST_SetSRID(ST_MakePoint(-118.359, 34.073), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pan-pacific-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Van Nuys Sherman Oaks Recreation Center Basketball', 'Basketball', 'seed-la-van-nuys-basketball', 80, ST_SetSRID(ST_MakePoint(-118.451, 34.151), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-van-nuys-basketball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Elite Badminton Center (City of Industry)', 'Badminton', 'seed-elite-badminton-city-industry', 80, ST_SetSRID(ST_MakePoint(-117.9178, 34.0195), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-elite-badminton-city-industry');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'San Gabriel Valley Badminton Club (El Monte)', 'Badminton', 'seed-sgv-badminton-el-monte', 80, ST_SetSRID(ST_MakePoint(-118.027, 34.0686), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sgv-badminton-el-monte');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Los Angeles Badminton Club (El Monte)', 'Badminton', 'seed-la-badminton-el-monte', 80, ST_SetSRID(ST_MakePoint(-118.032, 34.0755), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-badminton-el-monte');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Griffith Park Tennis Courts', 'Tennis', 'seed-la-griffith-park-tennis', 80, ST_SetSRID(ST_MakePoint(-118.303, 34.128), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-tennis');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Echo Park Recreation Center Tennis', 'Tennis', 'seed-la-echo-park-tennis', 80, ST_SetSRID(ST_MakePoint(-118.26, 34.073), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-echo-park-tennis');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Exposition Park Tennis Courts', 'Tennis', 'seed-la-exposition-park-tennis', 80, ST_SetSRID(ST_MakePoint(-118.287, 34.014), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-exposition-park-tennis');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Santa Monica Beach Volleyball Courts', 'Volleyball', 'seed-la-santa-monica-beach-volleyball', 80, ST_SetSRID(ST_MakePoint(-118.499, 34.008), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-santa-monica-beach-volleyball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Manhattan Beach Sand Dune Park Volleyball', 'Volleyball', 'seed-la-manhattan-beach-volleyball', 80, ST_SetSRID(ST_MakePoint(-118.414, 33.884), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-manhattan-beach-volleyball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Hermosa Beach Pier Volleyball Courts', 'Volleyball', 'seed-la-hermosa-beach-volleyball', 80, ST_SetSRID(ST_MakePoint(-118.399, 33.862), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-hermosa-beach-volleyball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Griffith Park Soccer Fields', 'Soccer', 'seed-la-griffith-park-soccer', 80, ST_SetSRID(ST_MakePoint(-118.318, 34.125), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-soccer');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'LA Soccer Park (Downey)', 'Soccer', 'seed-la-soccer-park-downey', 80, ST_SetSRID(ST_MakePoint(-118.141, 33.942), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-soccer-park-downey');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Mar Vista Recreation Center Soccer Field', 'Soccer', 'seed-la-mar-vista-soccer', 80, ST_SetSRID(ST_MakePoint(-118.432, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-mar-vista-soccer');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Los Angeles Athletic Club Squash Courts', 'Squash', 'seed-la-athletic-club-squash', 80, ST_SetSRID(ST_MakePoint(-118.252, 34.047), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-athletic-club-squash');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'UCLA John Wooden Center Squash', 'Squash', 'seed-la-ucla-wooden-squash', 80, ST_SetSRID(ST_MakePoint(-118.445, 34.071), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-ucla-wooden-squash');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT '24 Hour Fitness Hollywood Racquetball', 'Racquetball', 'seed-la-hollywood-racquetball', 80, ST_SetSRID(ST_MakePoint(-118.326, 34.098), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-hollywood-racquetball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'YMCA West Los Angeles Racquetball', 'Racquetball', 'seed-la-ymca-wla-racquetball', 80, ST_SetSRID(ST_MakePoint(-118.448, 34.042), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-ymca-wla-racquetball');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Spin Los Angeles Table Tennis', 'Table Tennis', 'seed-la-spin-dtla-table-tennis', 80, ST_SetSRID(ST_MakePoint(-118.256, 34.04), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-spin-dtla-table-tennis');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'LA Table Tennis Club (El Monte)', 'Table Tennis', 'seed-la-table-tennis-el-monte', 80, ST_SetSRID(ST_MakePoint(-118.032, 34.0755), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-table-tennis-el-monte');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Mar Vista Recreation Center Ultimate Field', 'Ultimate Frisbee', 'seed-la-mar-vista-ultimate', 80, ST_SetSRID(ST_MakePoint(-118.432, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-mar-vista-ultimate');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Culver City Blair Hills Park Ultimate Field', 'Ultimate Frisbee', 'seed-la-blair-hills-ultimate', 80, ST_SetSRID(ST_MakePoint(-118.405, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-blair-hills-ultimate');

INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, location)
SELECT 'Rancho Park Ultimate Field (West LA)', 'Ultimate Frisbee', 'seed-la-rancho-park-ultimate', 80, ST_SetSRID(ST_MakePoint(-118.424, 34.042), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-rancho-park-ultimate');
