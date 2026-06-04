/**
 * Seed Los Angeles metro courts for all 10 launch sports.
 *
 * Usage (from RallyApp/):
 *   node scripts/seed-la-courts.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 * Idempotent — skips rows that already exist by google_place_id.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

/** [lng, lat] — PostGIS POINT order */
const courts = [
  // Pickleball
  {
    name: 'Griffith Park Pickleball Courts',
    sport_type: 'Pickleball',
    google_place_id: 'seed-la-griffith-park-pickleball',
    coordinates: [-118.296, 34.132],
  },
  {
    name: 'Santa Monica Memorial Park Pickleball',
    sport_type: 'Pickleball',
    google_place_id: 'seed-la-santa-monica-memorial-pickleball',
    coordinates: [-118.491, 34.024],
  },
  {
    name: 'Culver City Syd Kronenthal Park Pickleball',
    sport_type: 'Pickleball',
    google_place_id: 'seed-la-culver-syd-kronenthal-pickleball',
    coordinates: [-118.395, 34.008],
  },
  {
    name: 'Mar Vista Recreation Center Pickleball',
    sport_type: 'Pickleball',
    google_place_id: 'seed-la-mar-vista-rec-pickleball',
    coordinates: [-118.432, 34.005],
  },
  // Basketball
  {
    name: 'Monrovia Recreation Park Basketball Courts',
    sport_type: 'Basketball',
    google_place_id: 'seed-monrovia-rec-park-basketball',
    coordinates: [-118.0019, 34.1442],
  },
  {
    name: 'Venice Beach Basketball Courts',
    sport_type: 'Basketball',
    google_place_id: 'seed-la-venice-beach-basketball',
    coordinates: [-118.469, 33.985],
  },
  {
    name: 'Pan Pacific Park Basketball Courts',
    sport_type: 'Basketball',
    google_place_id: 'seed-la-pan-pacific-basketball',
    coordinates: [-118.359, 34.073],
  },
  {
    name: 'Van Nuys Sherman Oaks Recreation Center Basketball',
    sport_type: 'Basketball',
    google_place_id: 'seed-la-van-nuys-basketball',
    coordinates: [-118.451, 34.151],
  },
  // Badminton
  {
    name: 'Elite Badminton Center (City of Industry)',
    sport_type: 'Badminton',
    google_place_id: 'seed-elite-badminton-city-industry',
    coordinates: [-117.9178, 34.0195],
  },
  {
    name: 'San Gabriel Valley Badminton Club (El Monte)',
    sport_type: 'Badminton',
    google_place_id: 'seed-sgv-badminton-el-monte',
    coordinates: [-118.027, 34.0686],
  },
  {
    name: 'Los Angeles Badminton Club (El Monte)',
    sport_type: 'Badminton',
    google_place_id: 'seed-la-badminton-el-monte',
    coordinates: [-118.032, 34.0755],
  },
  // Tennis
  {
    name: 'Griffith Park Tennis Courts',
    sport_type: 'Tennis',
    google_place_id: 'seed-la-griffith-park-tennis',
    coordinates: [-118.303, 34.128],
  },
  {
    name: 'Echo Park Recreation Center Tennis',
    sport_type: 'Tennis',
    google_place_id: 'seed-la-echo-park-tennis',
    coordinates: [-118.26, 34.073],
  },
  {
    name: 'Exposition Park Tennis Courts',
    sport_type: 'Tennis',
    google_place_id: 'seed-la-exposition-park-tennis',
    coordinates: [-118.287, 34.014],
  },
  // Volleyball
  {
    name: 'Santa Monica Beach Volleyball Courts',
    sport_type: 'Volleyball',
    google_place_id: 'seed-la-santa-monica-beach-volleyball',
    coordinates: [-118.499, 34.008],
  },
  {
    name: 'Manhattan Beach Sand Dune Park Volleyball',
    sport_type: 'Volleyball',
    google_place_id: 'seed-la-manhattan-beach-volleyball',
    coordinates: [-118.414, 33.884],
  },
  {
    name: 'Hermosa Beach Pier Volleyball Courts',
    sport_type: 'Volleyball',
    google_place_id: 'seed-la-hermosa-beach-volleyball',
    coordinates: [-118.399, 33.862],
  },
  // Soccer
  {
    name: 'Griffith Park Soccer Fields',
    sport_type: 'Soccer',
    google_place_id: 'seed-la-griffith-park-soccer',
    coordinates: [-118.318, 34.125],
  },
  {
    name: 'LA Soccer Park (Downey)',
    sport_type: 'Soccer',
    google_place_id: 'seed-la-soccer-park-downey',
    coordinates: [-118.141, 33.942],
  },
  {
    name: 'Mar Vista Recreation Center Soccer Field',
    sport_type: 'Soccer',
    google_place_id: 'seed-la-mar-vista-soccer',
    coordinates: [-118.432, 34.005],
  },
  // Squash
  {
    name: 'Los Angeles Athletic Club Squash Courts',
    sport_type: 'Squash',
    google_place_id: 'seed-la-athletic-club-squash',
    coordinates: [-118.252, 34.047],
  },
  {
    name: 'UCLA John Wooden Center Squash',
    sport_type: 'Squash',
    google_place_id: 'seed-la-ucla-wooden-squash',
    coordinates: [-118.445, 34.071],
  },
  // Racquetball
  {
    name: '24 Hour Fitness Hollywood Racquetball',
    sport_type: 'Racquetball',
    google_place_id: 'seed-la-hollywood-racquetball',
    coordinates: [-118.326, 34.098],
  },
  {
    name: 'YMCA West Los Angeles Racquetball',
    sport_type: 'Racquetball',
    google_place_id: 'seed-la-ymca-wla-racquetball',
    coordinates: [-118.448, 34.042],
  },
  // Table Tennis
  {
    name: 'Spin Los Angeles Table Tennis',
    sport_type: 'Table Tennis',
    google_place_id: 'seed-la-spin-dtla-table-tennis',
    coordinates: [-118.256, 34.04],
  },
  {
    name: 'LA Table Tennis Club (El Monte)',
    sport_type: 'Table Tennis',
    google_place_id: 'seed-la-table-tennis-el-monte',
    coordinates: [-118.032, 34.0755],
  },
  // Ultimate Frisbee
  {
    name: 'Mar Vista Recreation Center Ultimate Field',
    sport_type: 'Ultimate Frisbee',
    google_place_id: 'seed-la-mar-vista-ultimate',
    coordinates: [-118.432, 34.005],
  },
  {
    name: 'Culver City Blair Hills Park Ultimate Field',
    sport_type: 'Ultimate Frisbee',
    google_place_id: 'seed-la-blair-hills-ultimate',
    coordinates: [-118.405, 34.005],
  },
  {
    name: 'Rancho Park Ultimate Field (West LA)',
    sport_type: 'Ultimate Frisbee',
    google_place_id: 'seed-la-rancho-park-ultimate',
    coordinates: [-118.424, 34.042],
  },
];

const supabase = createClient(url, key);

let inserted = 0;
let skipped = 0;

for (const court of courts) {
  const { data: existing } = await supabase
    .from('activity_locations')
    .select('id')
    .eq('google_place_id', court.google_place_id)
    .maybeSingle();

  if (existing) {
    skipped += 1;
    console.log(`skip (exists): ${court.name}`);
    continue;
  }

  const [lng, lat] = court.coordinates;
  const { error } = await supabase.from('activity_locations').insert({
    name: court.name,
    sport_type: court.sport_type,
    google_place_id: court.google_place_id,
    radius: 80,
    location: `SRID=4326;POINT(${lng} ${lat})`,
  });

  if (error) {
    console.error(`fail: ${court.name}`, error.message);
    process.exit(1);
  }

  inserted += 1;
  console.log(`inserted: ${court.name}`);
}

console.log(`Done. inserted=${inserted} skipped=${skipped} total=${courts.length}`);
