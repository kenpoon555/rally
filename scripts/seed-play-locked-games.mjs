/**
 * Seed Play tab "locked · still welcoming" demo games.
 *
 * Usage (from RallyApp/):
 *   supabase db query --linked -f supabase/scripts/seed_play_locked_games.sql
 *
 * Requires LA courts from seed_la_courts.sql.
 */
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '../supabase/scripts/seed_play_locked_games.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('Applying seed_play_locked_games.sql via supabase db query --linked …');
execFileSync('supabase', ['db', 'query', '--linked', sql], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
});
console.log('Done.');
