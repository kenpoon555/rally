/**
 * Seed Los Angeles area badminton courts via Supabase service role.
 * Prefer the unified script: node scripts/seed-la-courts.mjs
 * Usage (from RallyApp/):
 *   node scripts/seed-la-badminton-courts.mjs
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
    name: 'Elite Badminton Center (City of Industry)',
    google_place_id: 'seed-elite-badminton-city-industry',
    coordinates: [-117.9178, 34.0195],
  },
  {
    name: 'San Gabriel Valley Badminton Club (El Monte)',
    google_place_id: 'seed-sgv-badminton-el-monte',
    coordinates: [-118.027, 34.0686],
  },
  {
    name: 'Los Angeles Badminton Club (El Monte)',
    google_place_id: 'seed-la-badminton-el-monte',
    coordinates: [-118.032, 34.0755],
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
    sport_type: 'Badminton',
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
