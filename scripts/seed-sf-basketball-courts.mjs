/**
 * Seed San Francisco basketball courts via Supabase service role.
 *
 * Usage (from RallyApp/):
 *   node scripts/seed-sf-basketball-courts.mjs
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
  {
    name: 'Golden Gate Park Basketball Courts',
    google_place_id: 'seed-sf-ggp-basketball',
    coordinates: [-122.4536, 37.7699],
    address: 'Golden Gate Park, San Francisco, CA',
  },
  {
    name: 'Mission Playground Basketball Courts',
    google_place_id: 'seed-sf-mission-playground-basketball',
    coordinates: [-122.4128, 37.7562],
    address: '2450 Harrison St, San Francisco, CA',
  },
  {
    name: 'Crocker Amazon Playground Basketball',
    google_place_id: 'seed-sf-crocker-amazon-basketball',
    coordinates: [-122.431, 37.7205],
    address: '799 Moscow St, San Francisco, CA',
  },
  {
    name: 'Hamilton Recreation Center Basketball',
    google_place_id: 'seed-sf-hamilton-rec-basketball',
    coordinates: [-122.4329, 37.786],
    address: '1900 Geary Blvd, San Francisco, CA',
  },
  {
    name: 'Balboa Park Basketball Courts',
    google_place_id: 'seed-sf-balboa-park-basketball',
    coordinates: [-122.4414, 37.7241],
    address: 'Balboa Park, San Francisco, CA',
  },
  {
    name: 'Upper Noe Recreation Center Basketball',
    google_place_id: 'seed-sf-upper-noe-basketball',
    coordinates: [-122.4335, 37.7428],
    address: '295 Day St, San Francisco, CA',
  },
  {
    name: 'Joe DiMaggio Playground Basketball',
    google_place_id: 'seed-sf-joe-dimaggio-basketball',
    coordinates: [-122.4094, 37.8013],
    address: '651 Lombard St, San Francisco, CA',
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
    sport_type: 'Basketball',
    google_place_id: court.google_place_id,
    radius: 80,
    location: `SRID=4326;POINT(${lng} ${lat})`,
    address: court.address,
    source: 'seed',
    is_active: true,
  });

  if (error) {
    console.error(`fail: ${court.name}`, error.message);
    process.exit(1);
  }

  inserted += 1;
  console.log(`inserted: ${court.name}`);
}

console.log(`Done. inserted=${inserted} skipped=${skipped} total=${courts.length}`);
