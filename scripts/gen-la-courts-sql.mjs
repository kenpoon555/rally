/**
 * Generate supabase/scripts/seed_la_courts.sql from scripts/la-courts-data.mjs.
 *
 * Usage (from RallyApp/):
 *   node scripts/gen-la-courts-sql.mjs
 *
 * The SQL is idempotent (guarded by NOT EXISTS on google_place_id) and is the
 * version applied via `supabase db query --linked` (no service-role key needed).
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { courts, sports, regions } from './la-courts-data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../supabase/scripts/seed_la_courts.sql');

const esc = (s) => s.replace(/'/g, "''");

const header = `-- LA metro courts for closed beta (all 10 launch sports). Idempotent via google_place_id.
-- GENERATED from scripts/la-courts-data.mjs — do not edit by hand.
-- Regenerate: node scripts/gen-la-courts-sql.mjs
-- Apply:      supabase db query --linked -f supabase/scripts/seed_la_courts.sql
--
-- Courts: ${courts.length} · Sports: ${sports.length} · Regions: ${regions.join(', ')}
`;

const blocks = courts.map((c) => {
  const [lng, lat] = c.coordinates;
  const gid = esc(c.google_place_id);
  return `-- ${esc(c.region)} · ${esc(c.sport_type)}
INSERT INTO public.activity_locations (name, sport_type, google_place_id, radius, source, location)
SELECT '${esc(c.name)}', '${esc(c.sport_type)}', '${gid}', 80, 'seed', ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
WHERE NOT EXISTS (SELECT 1 FROM public.activity_locations WHERE google_place_id = '${gid}');`;
});

const sql = `${header}\n${blocks.join('\n\n')}\n`;

await writeFile(outPath, sql, 'utf8');
console.log(`Wrote ${outPath} (${courts.length} courts).`);
