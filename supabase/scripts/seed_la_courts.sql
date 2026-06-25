-- LA metro courts for closed beta (all 10 launch sports). Idempotent via google_place_id.
-- GENERATED from scripts/la-courts-data.mjs — do not edit by hand.
-- Regenerate: node scripts/gen-la-courts-sql.mjs
-- Apply:      supabase db query --linked -f supabase/scripts/seed_la_courts.sql
--
-- Courts: 97 · Sports: 10 · Regions: Central, Eastside, Long Beach, SFV, SGV, South Bay, Westside

-- SGV · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Monrovia Recreation Park Basketball Courts', 'Basketball', 'seed-monrovia-rec-park-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.0019, 34.1442), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-monrovia-rec-park-basketball');

-- SGV · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Julian Fisher Park Basketball Courts', 'Basketball', 'seed-julian-fisher-park-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-117.9954, 34.1418), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-julian-fisher-park-basketball');

-- Westside · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Venice Beach Basketball Courts', 'Basketball', 'seed-la-venice-beach-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.469, 33.985), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-venice-beach-basketball');

-- Central · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Pan Pacific Park Basketball Courts', 'Basketball', 'seed-la-pan-pacific-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.359, 34.073), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pan-pacific-basketball');

-- SFV · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Van Nuys Sherman Oaks Recreation Center Basketball', 'Basketball', 'seed-la-van-nuys-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.451, 34.151), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-van-nuys-basketball');

-- Westside · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Westwood Recreation Center Basketball', 'Basketball', 'seed-la-westwood-rec-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.445, 34.052), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-westwood-rec-basketball');

-- Westside · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Stoner Recreation Center Basketball', 'Basketball', 'seed-la-stoner-rec-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.452, 34.03), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-stoner-rec-basketball');

-- Central · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Poinsettia Recreation Center Basketball', 'Basketball', 'seed-la-poinsettia-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.345, 34.085), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-poinsettia-basketball');

-- Central · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Gilbert Lindsay Recreation Center Basketball', 'Basketball', 'seed-la-gilbert-lindsay-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.273, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-gilbert-lindsay-basketball');

-- Eastside · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Lincoln Park Recreation Center Basketball', 'Basketball', 'seed-la-lincoln-park-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.207, 34.072), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-lincoln-park-basketball');

-- Eastside · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Hazard Park Basketball Courts', 'Basketball', 'seed-la-hazard-park-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.205, 34.048), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-hazard-park-basketball');

-- SGV · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Garvey Ranch Park Basketball (Monterey Park)', 'Basketball', 'seed-la-garvey-ranch-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.122, 34.06), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-garvey-ranch-basketball');

-- SFV · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Balboa Sports Complex Basketball (Encino)', 'Basketball', 'seed-la-balboa-sports-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.502, 34.184), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-balboa-sports-basketball');

-- South Bay · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Live Oak Park Basketball (Manhattan Beach)', 'Basketball', 'seed-la-live-oak-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.404, 33.892), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-live-oak-basketball');

-- Long Beach · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Houghton Park Basketball (Long Beach)', 'Basketball', 'seed-la-houghton-park-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.189, 33.866), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-houghton-park-basketball');

-- Long Beach · Basketball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Furman Park Basketball (Downey)', 'Basketball', 'seed-la-furman-park-basketball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.135, 33.945), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-furman-park-basketball');

-- Central · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Griffith Park Pickleball Courts', 'Pickleball', 'seed-la-griffith-park-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.296, 34.132), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-pickleball');

-- Westside · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Santa Monica Memorial Park Pickleball', 'Pickleball', 'seed-la-santa-monica-memorial-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.491, 34.024), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-santa-monica-memorial-pickleball');

-- Westside · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Culver City Syd Kronenthal Park Pickleball', 'Pickleball', 'seed-la-culver-syd-kronenthal-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.395, 34.008), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-culver-syd-kronenthal-pickleball');

-- Westside · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Mar Vista Recreation Center Pickleball', 'Pickleball', 'seed-la-mar-vista-rec-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.432, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-mar-vista-rec-pickleball');

-- Westside · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Cheviot Hills Recreation Center Pickleball', 'Pickleball', 'seed-la-cheviot-hills-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.405, 34.038), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-cheviot-hills-pickleball');

-- SFV · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Glendale Pacific Park Pickleball', 'Pickleball', 'seed-la-glendale-pacific-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.255, 34.146), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-glendale-pacific-pickleball');

-- SGV · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Pasadena Victory Park Pickleball', 'Pickleball', 'seed-la-pasadena-victory-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.108, 34.165), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pasadena-victory-pickleball');

-- SGV · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Arcadia County Park Pickleball', 'Pickleball', 'seed-la-arcadia-county-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.027, 34.118), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-arcadia-county-pickleball');

-- SFV · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Ralph Foy Park Pickleball (Burbank)', 'Pickleball', 'seed-la-ralph-foy-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.317, 34.181), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-ralph-foy-pickleball');

-- South Bay · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'El Segundo Recreation Park Pickleball', 'Pickleball', 'seed-la-el-segundo-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.416, 33.918), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-el-segundo-pickleball');

-- South Bay · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Wilson Park Pickleball (Torrance)', 'Pickleball', 'seed-la-wilson-park-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.336, 33.836), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-wilson-park-pickleball');

-- Long Beach · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'El Dorado Park Pickleball (Long Beach)', 'Pickleball', 'seed-la-el-dorado-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.084, 33.806), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-el-dorado-pickleball');

-- Long Beach · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Apollo Park Pickleball (Downey)', 'Pickleball', 'seed-la-apollo-park-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.118, 33.927), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-apollo-park-pickleball');

-- Eastside · Pickleball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Eagle Rock Recreation Center Pickleball', 'Pickleball', 'seed-la-eagle-rock-pickleball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.211, 34.146), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-eagle-rock-pickleball');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Elite Badminton Center (City of Industry)', 'Badminton', 'seed-elite-badminton-city-industry', 80, 'seed', ST_SetSRID(ST_MakePoint(-117.9178, 34.0195), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-elite-badminton-city-industry');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'San Gabriel Valley Badminton Club (El Monte)', 'Badminton', 'seed-sgv-badminton-el-monte', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.027, 34.0686), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-sgv-badminton-el-monte');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Los Angeles Badminton Club (El Monte)', 'Badminton', 'seed-la-badminton-el-monte', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.032, 34.0755), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-badminton-el-monte');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Pasadena Badminton Club', 'Badminton', 'seed-la-pasadena-badminton', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.085, 34.146), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pasadena-badminton');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Bintang Badminton (Monterey Park)', 'Badminton', 'seed-la-bintang-badminton', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.118, 34.045), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-bintang-badminton');

-- South Bay · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'South Bay Badminton (Torrance)', 'Badminton', 'seed-la-south-bay-badminton', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.33, 33.852), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-south-bay-badminton');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Stardust Badminton (City of Industry)', 'Badminton', 'seed-la-stardust-badminton', 80, 'seed', ST_SetSRID(ST_MakePoint(-117.905, 34.018), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-stardust-badminton');

-- SGV · Badminton
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Synergy Badminton Academy (Hacienda Heights)', 'Badminton', 'seed-la-synergy-badminton', 80, 'seed', ST_SetSRID(ST_MakePoint(-117.969, 33.993), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-synergy-badminton');

-- Central · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Griffith Park Tennis Courts', 'Tennis', 'seed-la-griffith-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.303, 34.128), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-tennis');

-- Eastside · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Echo Park Recreation Center Tennis', 'Tennis', 'seed-la-echo-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.26, 34.073), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-echo-park-tennis');

-- Central · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Exposition Park Tennis Courts', 'Tennis', 'seed-la-exposition-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.287, 34.014), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-exposition-park-tennis');

-- Westside · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Westwood Recreation Center Tennis', 'Tennis', 'seed-la-westwood-rec-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.446, 34.053), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-westwood-rec-tennis');

-- Westside · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Cheviot Hills Tennis Courts', 'Tennis', 'seed-la-cheviot-hills-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.404, 34.037), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-cheviot-hills-tennis');

-- Westside · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Reed Park Tennis (Santa Monica)', 'Tennis', 'seed-la-reed-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.494, 34.023), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-reed-park-tennis');

-- SFV · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Balboa Park Tennis (Encino)', 'Tennis', 'seed-la-balboa-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.5, 34.178), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-balboa-park-tennis');

-- SGV · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Brookside Tennis (Pasadena)', 'Tennis', 'seed-la-brookside-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.168, 34.162), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-brookside-tennis');

-- SGV · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Arcadia County Park Tennis', 'Tennis', 'seed-la-arcadia-county-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.027, 34.118), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-arcadia-county-tennis');

-- Long Beach · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Billie Jean King Tennis Center (Long Beach)', 'Tennis', 'seed-la-bjk-tennis-long-beach', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.115, 33.815), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-bjk-tennis-long-beach');

-- South Bay · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Wilson Park Tennis (Torrance)', 'Tennis', 'seed-la-wilson-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.336, 33.836), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-wilson-park-tennis');

-- SFV · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Glendale Pacific Park Tennis', 'Tennis', 'seed-la-glendale-pacific-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.255, 34.146), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-glendale-pacific-tennis');

-- Long Beach · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'El Dorado Park Tennis (Long Beach)', 'Tennis', 'seed-la-el-dorado-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.084, 33.806), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-el-dorado-tennis');

-- Eastside · Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Lincoln Park Tennis Courts', 'Tennis', 'seed-la-lincoln-park-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.207, 34.072), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-lincoln-park-tennis');

-- Westside · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Santa Monica Beach Volleyball Courts', 'Volleyball', 'seed-la-santa-monica-beach-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.499, 34.008), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-santa-monica-beach-volleyball');

-- South Bay · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Manhattan Beach Sand Dune Park Volleyball', 'Volleyball', 'seed-la-manhattan-beach-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.414, 33.884), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-manhattan-beach-volleyball');

-- South Bay · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Hermosa Beach Pier Volleyball Courts', 'Volleyball', 'seed-la-hermosa-beach-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.399, 33.862), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-hermosa-beach-volleyball');

-- Westside · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Will Rogers State Beach Volleyball', 'Volleyball', 'seed-la-will-rogers-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.524, 34.03), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-will-rogers-volleyball');

-- Westside · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Venice Beach Volleyball Courts', 'Volleyball', 'seed-la-venice-beach-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.474, 33.986), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-venice-beach-volleyball');

-- Westside · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Marine Park Volleyball (Santa Monica)', 'Volleyball', 'seed-la-marine-park-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.471, 34.01), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-marine-park-volleyball');

-- Westside · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Dockweiler Beach Volleyball (Playa del Rey)', 'Volleyball', 'seed-la-dockweiler-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.437, 33.921), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-dockweiler-volleyball');

-- South Bay · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Redondo Beach Volleyball Courts', 'Volleyball', 'seed-la-redondo-beach-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.392, 33.842), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-redondo-beach-volleyball');

-- Westside · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Westwood Recreation Center Volleyball', 'Volleyball', 'seed-la-westwood-rec-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.445, 34.052), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-westwood-rec-volleyball');

-- Long Beach · Volleyball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Granada Beach Volleyball (Long Beach)', 'Volleyball', 'seed-la-granada-beach-volleyball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.143, 33.76), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-granada-beach-volleyball');

-- Central · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Griffith Park Soccer Fields', 'Soccer', 'seed-la-griffith-park-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.318, 34.125), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-soccer');

-- Long Beach · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'LA Soccer Park (Downey)', 'Soccer', 'seed-la-soccer-park-downey', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.141, 33.942), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-soccer-park-downey');

-- Westside · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Mar Vista Recreation Center Soccer Field', 'Soccer', 'seed-la-mar-vista-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.432, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-mar-vista-soccer');

-- SFV · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Balboa Sports Complex Soccer (Encino)', 'Soccer', 'seed-la-balboa-sports-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.502, 34.184), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-balboa-sports-soccer');

-- Central · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Exposition Park Soccer Fields', 'Soccer', 'seed-la-exposition-park-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.288, 34.016), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-exposition-park-soccer');

-- Westside · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Cheviot Hills Soccer Fields', 'Soccer', 'seed-la-cheviot-hills-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.405, 34.038), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-cheviot-hills-soccer');

-- Central · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Pan Pacific Park Soccer Field', 'Soccer', 'seed-la-pan-pacific-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.359, 34.073), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pan-pacific-soccer');

-- SGV · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Brookside Soccer (Pasadena)', 'Soccer', 'seed-la-brookside-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.168, 34.162), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-brookside-soccer');

-- Long Beach · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'El Dorado Park Soccer (Long Beach)', 'Soccer', 'seed-la-el-dorado-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.084, 33.806), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-el-dorado-soccer');

-- South Bay · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Columbia Park Soccer (Torrance)', 'Soccer', 'seed-la-columbia-park-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.354, 33.866), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-columbia-park-soccer');

-- Eastside · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Lincoln Park Soccer Field', 'Soccer', 'seed-la-lincoln-park-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.207, 34.072), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-lincoln-park-soccer');

-- SFV · Soccer
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Verdugo Park Soccer (Glendale)', 'Soccer', 'seed-la-verdugo-park-soccer', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.232, 34.165), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-verdugo-park-soccer');

-- Central · Squash
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Los Angeles Athletic Club Squash Courts', 'Squash', 'seed-la-athletic-club-squash', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.252, 34.047), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-athletic-club-squash');

-- Westside · Squash
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'UCLA John Wooden Center Squash', 'Squash', 'seed-la-ucla-wooden-squash', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.445, 34.071), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-ucla-wooden-squash');

-- Central · Squash
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'USC Lyon Center Squash', 'Squash', 'seed-la-usc-lyon-squash', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.288, 34.024), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-usc-lyon-squash');

-- Westside · Squash
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Equinox Sports Club LA Squash (West LA)', 'Squash', 'seed-la-equinox-westla-squash', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.444, 34.047), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-equinox-westla-squash');

-- SGV · Squash
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Caltech Braun Athletic Center Squash (Pasadena)', 'Squash', 'seed-la-caltech-braun-squash', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.125, 34.137), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-caltech-braun-squash');

-- Central · Racquetball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT '24 Hour Fitness Hollywood Racquetball', 'Racquetball', 'seed-la-hollywood-racquetball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.326, 34.098), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-hollywood-racquetball');

-- Westside · Racquetball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'YMCA West Los Angeles Racquetball', 'Racquetball', 'seed-la-ymca-wla-racquetball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.448, 34.042), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-ymca-wla-racquetball');

-- South Bay · Racquetball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Spectrum Club El Segundo Racquetball', 'Racquetball', 'seed-la-spectrum-el-segundo-racquetball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.389, 33.917), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-spectrum-el-segundo-racquetball');

-- Long Beach · Racquetball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'LA Fitness Long Beach Racquetball', 'Racquetball', 'seed-la-lafitness-long-beach-racquetball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.158, 33.808), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-lafitness-long-beach-racquetball');

-- SGV · Racquetball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Pasadena YMCA Racquetball', 'Racquetball', 'seed-la-pasadena-ymca-racquetball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.146, 34.156), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pasadena-ymca-racquetball');

-- SFV · Racquetball
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Glendale YMCA Racquetball', 'Racquetball', 'seed-la-glendale-ymca-racquetball', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.255, 34.146), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-glendale-ymca-racquetball');

-- Central · Table Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Spin Los Angeles Table Tennis', 'Table Tennis', 'seed-la-spin-dtla-table-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.256, 34.04), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-spin-dtla-table-tennis');

-- SGV · Table Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'LA Table Tennis Club (El Monte)', 'Table Tennis', 'seed-la-table-tennis-el-monte', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.032, 34.0755), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-table-tennis-el-monte');

-- Westside · Table Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Westside Table Tennis (Culver City)', 'Table Tennis', 'seed-la-westside-table-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.396, 34.025), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-westside-table-tennis');

-- South Bay · Table Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'South Bay Table Tennis Club (Gardena)', 'Table Tennis', 'seed-la-south-bay-table-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.309, 33.888), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-south-bay-table-tennis');

-- SGV · Table Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Pasadena Table Tennis Club', 'Table Tennis', 'seed-la-pasadena-table-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.131, 34.158), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-pasadena-table-tennis');

-- SGV · Table Tennis
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'ICC Table Tennis (San Gabriel)', 'Table Tennis', 'seed-la-icc-table-tennis', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.106, 34.096), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-icc-table-tennis');

-- Westside · Ultimate Frisbee
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Mar Vista Recreation Center Ultimate Field', 'Ultimate Frisbee', 'seed-la-mar-vista-ultimate', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.432, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-mar-vista-ultimate');

-- Westside · Ultimate Frisbee
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Culver City Blair Hills Park Ultimate Field', 'Ultimate Frisbee', 'seed-la-blair-hills-ultimate', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.405, 34.005), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-blair-hills-ultimate');

-- Westside · Ultimate Frisbee
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Rancho Park Ultimate Field (West LA)', 'Ultimate Frisbee', 'seed-la-rancho-park-ultimate', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.424, 34.042), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-rancho-park-ultimate');

-- Central · Ultimate Frisbee
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Griffith Park Ultimate Field', 'Ultimate Frisbee', 'seed-la-griffith-park-ultimate', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.295, 34.135), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-griffith-park-ultimate');

-- SFV · Ultimate Frisbee
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Balboa Park Ultimate Field (Encino)', 'Ultimate Frisbee', 'seed-la-balboa-park-ultimate', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.5, 34.178), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-balboa-park-ultimate');

-- Long Beach · Ultimate Frisbee
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT 'Recreation Park Ultimate Field (Long Beach)', 'Ultimate Frisbee', 'seed-la-recreation-park-ultimate', 80, 'seed', ST_SetSRID(ST_MakePoint(-118.155, 33.792), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = 'seed-la-recreation-park-ultimate');
