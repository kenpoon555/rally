/**
 * Seed Play → Players board with demo free-agent posts.
 *
 * Usage (from RallyApp/):
 *   node scripts/seed-free-agent-posts.mjs
 *
 * Requires kunyu + kenpoon4real profiles (seed_beta_test_data.sql).
 */
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '../supabase/scripts/seed_free_agent_posts.sql');
console.log('Applying seed_free_agent_posts.sql via supabase db query --linked …');
execFileSync('supabase', ['db', 'query', '--linked', '-f', sqlPath], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
});
console.log('Done. Open Play → Players (switch sport to Badminton or Pickleball to filter).');
