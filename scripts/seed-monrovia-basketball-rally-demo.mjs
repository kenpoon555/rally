/**
 * Seed Julian Fisher Park basketball Rally for tomorrow's test group.
 *
 * Creates:
 * - Julian Fisher Park court (Monrovia)
 * - 10 demo auth users (@marcus … @chris — same short-handle pattern as kunyu/jade)
 * - Rally "Julian Fisher Park Regulars" with 4 past games + 1 upcoming (tomorrow 9am PT)
 * - Crew chat, session cards, attendance history
 * - Adds @kunyu as a member so your real login sees the crew
 *
 * Usage (from RallyApp/):
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-monrovia-basketball-rally-demo.mjs
 *
 * Demo login (any of the 10):
 *   marcus@rally-mvrhoops.demo / MonroviaHoops26!
 *
 * Safe to re-run.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile(join(root, '.env'));

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.RALLY_DEMO_PASSWORD || 'MonroviaHoops26!';

const HOST_ID = 'd1000001-0001-4001-8001-000000000001';
const KUNYU_ID = 'f6cee5e0-b650-4a85-a2f1-a99d177c27b4';
const GROUP_ID = 'e1000001-0001-4001-8001-000000000101';
const PAST = [
  'f2000001-0001-4001-8001-000000000001',
  'f2000001-0001-4001-8001-000000000002',
  'f2000001-0001-4001-8001-000000000003',
  'f2000001-0001-4001-8001-000000000004',
];
const UPCOMING_ID = 'f2000001-0001-4001-8001-000000000005';

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COURT = {
  id: 'f1000001-0001-4001-8001-000000000201',
  name: 'Julian Fisher Park Basketball Courts',
  google_place_id: 'seed-julian-fisher-park-basketball',
  lng: -117.9954,
  lat: 34.1418,
};

/** Short handles like kunyu / jade / kenpoon4real */
const DEMO_USERS = [
  { id: HOST_ID, username: 'marcus', nickname: 'Marcus' },
  { id: 'd1000001-0001-4001-8001-000000000002', username: 'derek', nickname: 'Derek' },
  { id: 'd1000001-0001-4001-8001-000000000003', username: 'jordan', nickname: 'Jordan' },
  { id: 'd1000001-0001-4001-8001-000000000004', username: 'alex', nickname: 'Alex' },
  { id: 'd1000001-0001-4001-8001-000000000005', username: 'casey', nickname: 'Casey' },
  { id: 'd1000001-0001-4001-8001-000000000006', username: 'riley', nickname: 'Riley' },
  { id: 'd1000001-0001-4001-8001-000000000007', username: 'devin', nickname: 'Devin' },
  { id: 'd1000001-0001-4001-8001-000000000008', username: 'taylor', nickname: 'Taylor' },
  { id: 'd1000001-0001-4001-8001-000000000009', username: 'morgan', nickname: 'Morgan' },
  { id: 'd1000001-0001-4001-8001-000000000010', username: 'chris', nickname: 'Chris' },
];

const MEMBER_IDS = DEMO_USERS.map((u) => u.id);

function laTomorrow9amIso() {
  const todayLa = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const base = new Date(`${todayLa}T12:00:00-07:00`);
  base.setUTCDate(base.getUTCDate() + 1);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T09:00:00-07:00`).toISOString();
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function upsert(table, row, onConflict) {
  const { error } = await supabase.from(table).upsert(row, { onConflict });
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
}

async function ensureCourt() {
  const { data: existing } = await supabase
    .from('activity_locations')
    .select('id')
    .eq('google_place_id', COURT.google_place_id)
    .maybeSingle();

  if (existing?.id) {
    console.log(`court: skip (exists) ${COURT.name}`);
    return existing.id;
  }

  const { error } = await supabase.from('activity_locations').insert({
    id: COURT.id,
    name: COURT.name,
    sport_type: 'Basketball',
    google_place_id: COURT.google_place_id,
    radius: 80,
    location: `SRID=4326;POINT(${COURT.lng} ${COURT.lat})`,
    source: 'seed',
    is_active: true,
  });

  if (error) throw new Error(`court insert failed: ${error.message}`);
  console.log(`court: inserted ${COURT.name}`);
  return COURT.id;
}

async function ensureDemoUsers() {
  let created = 0;
  let skipped = 0;

  for (const user of DEMO_USERS) {
    const email = `${user.username}@rally-mvrhoops.demo`;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const { error } = await supabase.auth.admin.createUser({
        id: user.id,
        email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { nickname: user.nickname },
      });

      if (error && !error.message?.includes('already been registered')) {
        throw new Error(`createUser @${user.username} failed: ${error.message}`);
      }
      if (!error) {
        created += 1;
        console.log(`user: created @${user.username}`);
      } else {
        skipped += 1;
        console.log(`user: skip (auth exists) @${user.username}`);
      }
    } else {
      skipped += 1;
      console.log(`user: skip (exists) @${user.username}`);
    }

    await supabase
      .from('profiles')
      .update({
        username: user.username,
        nickname: user.nickname,
        preferred_sports: ['Basketball'],
        onboarding_completed: true,
        tos_accepted_at: new Date().toISOString(),
        location_privacy_ack_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }

  return { created, skipped };
}

async function seedRally(locId) {
  await upsert(
    'regular_groups',
    {
      id: GROUP_ID,
      host_id: HOST_ID,
      name: 'Julian Fisher Park Regulars',
      sport_type: 'Basketball',
      default_location_id: locId,
      invite_token: 'a1000001-0001-4001-8001-000000000301',
    },
    'id'
  );

  for (const userId of MEMBER_IDS) {
    await upsert(
      'regular_group_members',
      {
        group_id: GROUP_ID,
        user_id: userId,
        role: userId === HOST_ID ? 'host' : 'member',
      },
      'group_id,user_id'
    );
  }

  await upsert(
    'regular_group_members',
    { group_id: GROUP_ID, user_id: KUNYU_ID, role: 'member' },
    'group_id,user_id'
  );

  const pastGames = [
    { id: PAST[0], days: 28, title: 'Full court Sunday run', player_count: 10, missing: 0, attended: 10 },
    { id: PAST[1], days: 21, title: 'Thursday night run', player_count: 9, missing: 1, attended: 9 },
    { id: PAST[2], days: 14, title: 'Weeknight pickup', player_count: 10, missing: 0, attended: 10 },
    { id: PAST[3], days: 7, title: 'Saturday morning run', player_count: 8, missing: 2, attended: 8 },
  ];

  for (const game of pastGames) {
    await upsert(
      'activities',
      {
        id: game.id,
        user_id: HOST_ID,
        location_id: locId,
        sport_type: 'Basketball',
        start_time: daysAgoIso(game.days),
        duration: 120,
        visibility: 'friends',
        player_count: game.player_count,
        missing_players: game.missing,
        status: 'completed',
        scheduling_mode: 'fixed',
        regular_group_id: GROUP_ID,
        cost_note: 'Free — public courts',
        match_status: 'finalized',
        session_note: 'Full court 5v5. Bring your own ball.',
        listing_title: game.title,
        roster_min: 8,
        roster_max: 10,
      },
      'id'
    );

    for (const userId of MEMBER_IDS) {
      if (userId === HOST_ID) continue;
      await upsert(
        'join_requests',
        {
          activity_id: game.id,
          user_id: userId,
          status: 'approved',
          requested_at: daysAgoIso(game.days + 2),
          responded_at: daysAgoIso(game.days + 2),
          ready_at: daysAgoIso(game.days + 1),
        },
        'activity_id,user_id'
      );
    }

    for (const userId of MEMBER_IDS.slice(0, game.attended)) {
      await upsert(
        'game_attendance',
        { activity_id: game.id, user_id: userId, attended: true, reported_by: HOST_ID },
        'activity_id,user_id'
      );
    }
  }

  await upsert(
    'activities',
    {
      id: UPCOMING_ID,
      user_id: HOST_ID,
      location_id: locId,
      sport_type: 'Basketball',
      start_time: laTomorrow9amIso(),
      duration: 120,
      visibility: 'friends',
      player_count: 7,
      missing_players: 3,
      status: 'active',
      scheduling_mode: 'fixed',
      regular_group_id: GROUP_ID,
      cost_note: 'Free — public courts',
      match_status: 'open',
      session_note: 'Full court 5v5. Meet at the south courts.',
      listing_title: 'Morning pickup run',
      play_intent: 'casual_only',
      roster_min: 8,
      roster_max: 10,
    },
    'id'
  );

  const readyMembers = MEMBER_IDS.slice(1, 5);
  const joinedNotReady = [MEMBER_IDS[5]];
  for (const userId of readyMembers) {
    await upsert(
      'join_requests',
      {
        activity_id: UPCOMING_ID,
        user_id: userId,
        status: 'approved',
        requested_at: daysAgoIso(3),
        responded_at: daysAgoIso(3),
        ready_at: daysAgoIso(1),
      },
      'activity_id,user_id'
    );
  }
  for (const userId of joinedNotReady) {
    await upsert(
      'join_requests',
      {
        activity_id: UPCOMING_ID,
        user_id: userId,
        status: 'approved',
        requested_at: daysAgoIso(2),
        responded_at: daysAgoIso(2),
        ready_at: null,
      },
      'activity_id,user_id'
    );
  }
  await upsert(
    'join_requests',
    {
      activity_id: UPCOMING_ID,
      user_id: KUNYU_ID,
      status: 'approved',
      requested_at: daysAgoIso(1),
      responded_at: daysAgoIso(1),
      ready_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    'activity_id,user_id'
  );

  await supabase
    .from('regular_groups')
    .update({ source_activity_id: PAST[3], default_location_id: locId })
    .eq('id', GROUP_ID);

  console.log('rally: Julian Fisher Park Regulars seeded');
}

async function seedCrewChat() {
  let convId;
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('conversation_type', 'crew_group')
    .eq('regular_group_id', GROUP_ID)
    .maybeSingle();

  if (existingConv?.id) {
    convId = existingConv.id;
  } else {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        conversation_type: 'crew_group',
        regular_group_id: GROUP_ID,
        created_by: HOST_ID,
        title: 'Julian Fisher Park Regulars',
      })
      .select('id')
      .single();
    if (error) throw new Error(`conversation insert failed: ${error.message}`);
    convId = data.id;
  }

  const allMembers = [...MEMBER_IDS, KUNYU_ID];
  for (const userId of allMembers) {
    await upsert(
      'conversation_members',
      {
        conversation_id: convId,
        user_id: userId,
        role: userId === HOST_ID ? 'host' : 'member',
        is_active: true,
      },
      'conversation_id,user_id'
    );
  }

  const cards = [
    { activity_id: UPCOMING_ID, position: 1, is_current: true },
    { activity_id: PAST[3], position: 2, is_current: false },
    { activity_id: PAST[2], position: 3, is_current: false },
  ];
  for (const card of cards) {
    await upsert('conversation_activities', { conversation_id: convId, ...card }, 'conversation_id,activity_id');
  }

  const { error: refreshError } = await supabase.rpc('refresh_crew_conversation_current_session', {
    p_conversation_id: convId,
  });
  if (refreshError) {
    console.warn(`chat: refresh_crew_conversation_current_session: ${refreshError.message}`);
  }

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', convId)
    .like('content', 'Sunday run is posted%');

  if (!count) {
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: HOST_ID,
      message_type: 'text',
      content: "Sunday run is posted — tap I'm in on the card if you can make it.",
    });
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: 'd1000001-0001-4001-8001-000000000003',
      message_type: 'text',
      content: "I'm in — can we run full court?",
    });
  }

  await supabase
    .from('conversations')
    .update({
      pinned_announcement: 'Meet at the south courts by 9:00. Bring water — it gets hot by noon.',
      pinned_announcement_at: new Date().toISOString(),
      pinned_announcement_by: HOST_ID,
    })
    .eq('id', convId);

  console.log(`chat: crew conversation ${convId}`);
}

async function main() {
  console.log('Monrovia basketball Rally demo seed\n');
  const locId = await ensureCourt();
  const { created, skipped } = await ensureDemoUsers();
  console.log(`users: created=${created} skipped=${skipped}`);
  await seedRally(locId);
  await seedCrewChat();

  console.log('\nDone.');
  console.log('Rally: Julian Fisher Park Regulars');
  console.log('Court: Julian Fisher Park Basketball Courts (Monrovia)');
  console.log('Demo login: marcus@rally-mvrhoops.demo /', demoPassword);
  console.log('Your @kunyu account is on the upcoming game roster.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
