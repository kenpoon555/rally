/**
 * Seed Bay Area pickleball courts via Supabase service role.
 * Legacy — closed beta is LA-only. Use: node scripts/seed-la-courts.mjs
 * Usage (from RallyApp/):
 *   node scripts/seed-bay-area-courts.mjs
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const courts = [
  {
    name: 'Cupertino Memorial Park Pickleball',
    google_place_id: 'seed-cupertino-memorial-pickleball',
    coordinates: [-122.0322, 37.323],
  },
  {
    name: 'Sunnyvale Baylands Pickleball Courts',
    google_place_id: 'seed-sunnyvale-baylands-pickleball',
    coordinates: [-122.0125, 37.3895],
  },
  {
    name: 'Mountain View Rengstorff Park Pickleball',
    google_place_id: 'seed-mv-rengstorff-pickleball',
    coordinates: [-122.0955, 37.4058],
  },
  {
    name: 'San Jose Backesto Park Pickleball',
    google_place_id: 'seed-sj-backesto-pickleball',
    coordinates: [-121.8835, 37.3488],
  },
  {
    name: 'Palo Alto Mitchell Park Pickleball',
    google_place_id: 'seed-pa-mitchell-pickleball',
    coordinates: [-122.1088, 37.4212],
  },
  {
    name: 'SF Presidio Pickleball Courts',
    google_place_id: 'seed-sf-presidio-pickleball',
    coordinates: [-122.4662, 37.7989],
  },
  {
    name: 'SF Golden Gate Park Pickleball',
    google_place_id: 'seed-sf-ggp-pickleball',
    coordinates: [-122.4833, 37.7694],
  },
  {
    name: 'SF Mission Dolores Park Pickleball',
    google_place_id: 'seed-sf-dolores-pickleball',
    coordinates: [-122.4269, 37.7596],
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
    sport_type: 'Pickleball',
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

console.log(`Done. inserted=${inserted} skipped=${skipped}`);
