/**
 * Seed Los Angeles metro courts for all 10 launch sports.
 *
 * Usage (from RallyApp/):
 *   node scripts/seed-la-courts.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 * Idempotent — skips rows that already exist by google_place_id.
 *
 * Court list lives in scripts/la-courts-data.mjs (shared with the SQL generator).
 * No Google Places calls — static lat/lng, $0 to seed.
 */
import { createClient } from '@supabase/supabase-js';
import { courts, sports, regions } from './la-courts-data.mjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const seen = new Set();
for (const court of courts) {
  if (seen.has(court.google_place_id)) {
    console.error(`Duplicate google_place_id in data: ${court.google_place_id}`);
    process.exit(1);
  }
  seen.add(court.google_place_id);
}

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
    source: 'seed',
    location: `SRID=4326;POINT(${lng} ${lat})`,
  });

  if (error) {
    console.error(`fail: ${court.name}`, error.message);
    process.exit(1);
  }

  inserted += 1;
  console.log(`inserted: ${court.name}`);
}

console.log(
  `Done. inserted=${inserted} skipped=${skipped} total=${courts.length} ` +
    `sports=${sports.length} regions=${regions.length}`
);
