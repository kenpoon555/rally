/**
 * Seed Los Angeles area basketball courts via Supabase service role.
 * Usage (from RallyApp/):
 *   node scripts/seed-la-basketball-courts.mjs
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

/** Monrovia Recreation Park — 119 W Palm Ave, Monrovia, CA 91016 */
const courts = [
  {
    name: 'Monrovia Recreation Park Basketball Courts',
    google_place_id: 'seed-monrovia-rec-park-basketball',
    coordinates: [-118.0019, 34.1442],
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
  });

  if (error) {
    console.error(`fail: ${court.name}`, error.message);
    process.exit(1);
  }

  inserted += 1;
  console.log(`inserted: ${court.name}`);
}

console.log(`Done. inserted=${inserted} skipped=${skipped}`);
