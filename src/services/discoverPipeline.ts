import { CONFIG } from '../constants/config';
import { SportType } from '../constants/sports';
import { supabase } from './api/supabase';
import { ensureSupabaseSessionReady } from './api/ensureSupabaseSession';
import { getNearbyActivities } from './activityService';
import { isActivityListingActive, parseActivityTimestamp } from '../utils/activityExpiry';

/** Bump when changing discover logic — visible in dev empty state to confirm bundle reload. */
export const DISCOVER_PIPELINE_VERSION = 'v5';

export type DiscoverPipelineStep = {
  name: string;
  ok: boolean;
  detail: string;
};

export type DiscoverPipelineReport = {
  version: string;
  finishedAt: string;
  steps: DiscoverPipelineStep[];
  finalCount: number;
  error: string | null;
};

export async function runDiscoverPipeline(params: {
  userId?: string;
  latitude?: number;
  longitude?: number;
  sportType?: SportType;
}): Promise<DiscoverPipelineReport> {
  const steps: DiscoverPipelineStep[] = [];
  const { userId, latitude, longitude, sportType } = params;
  let finalCount = 0;
  let error: string | null = null;

  const add = (name: string, ok: boolean, detail: string) => {
    steps.push({ name, ok, detail });
    if (__DEV__) {
      console.log(`[DiscoverPipeline] ${ok ? 'OK' : 'FAIL'} ${name}: ${detail}`);
    }
  };

  try {
    add(
      '1. Supabase config',
      Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY),
      CONFIG.SUPABASE_URL
        ? `URL set (${CONFIG.SUPABASE_URL.slice(0, 28)}…)`
        : 'SUPABASE_URL missing — rebuild app after .env change'
    );

    await ensureSupabaseSessionReady();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    add(
      '2. Auth session',
      true,
      session?.user?.id
        ? `signed in ${session.user.id.slice(0, 8)}…`
        : 'no session (anon reads still allowed)'
    );

    if (userId && session?.user?.id && userId !== session.user.id) {
      add('3. Profile vs session', false, `profile ${userId.slice(0, 8)} ≠ session ${session.user.id.slice(0, 8)}`);
    } else {
      add('3. Profile vs session', true, userId ? `match ${userId.slice(0, 8)}…` : 'no profile user yet');
    }

    let query = supabase
      .from('activities')
      .select('id, sport_type, status, expires_at, start_time, user_id', { count: 'exact' })
      .eq('status', 'active');
    if (sportType) {
      query = query.eq('sport_type', sportType);
    }
    const { data: rawRows, error: rawErr, count } = await query;
    add(
      '4. DB query (active)',
      !rawErr,
      rawErr ? rawErr.message : `${count ?? rawRows?.length ?? 0} row(s)${sportType ? ` sport=${sportType}` : ''}`
    );

    const listingActive = (rawRows || []).filter((row) =>
      isActivityListingActive(row as Parameters<typeof isActivityListingActive>[0])
    );
    let step5Detail = `${listingActive.length} of ${rawRows?.length ?? 0} still open (expires_at ≥ now)`;
    if ((rawRows?.length ?? 0) > 0 && listingActive.length === 0) {
      const sample = rawRows![0].expires_at as string | null | undefined;
      if (sample) {
        const parsedMs = parseActivityTimestamp(sample);
        step5Detail += Number.isFinite(parsedMs)
          ? `; sample parses to ${new Date(parsedMs).toISOString()}`
          : `; sample "${sample}" failed to parse`;
      }
    }
    add('5. Listing not expired', true, step5Detail);

    const mine = listingActive.filter((row) => row.user_id === (session?.user?.id || userId));
    add('6. Your hosted (in query)', true, `${mine.length} hosted by you in raw results`);

    const nearby = await getNearbyActivities(latitude, longitude, CONFIG.DISCOVERY_RADIUS_M, sportType);
    finalCount = nearby.length;
    add(
      '7. getNearbyActivities',
      nearby.length > 0 || listingActive.length === 0,
      `${nearby.length} returned${latitude != null ? ` @ ${latitude.toFixed(3)},${longitude?.toFixed(3)}` : ''}`
    );
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    add('7. getNearbyActivities', false, error);
  }

  return {
    version: DISCOVER_PIPELINE_VERSION,
    finishedAt: new Date().toISOString(),
    steps,
    finalCount,
    error,
  };
}
