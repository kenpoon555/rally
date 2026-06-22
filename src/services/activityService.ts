import { supabase } from './api/supabase';
import {
  Activity,
  ActivityCandidateLocation,
  ActivityParticipantPreference,
  FinalizedActivityResult,
  GameRsvpStatus,
  JoinRequest,
} from '../types/activity';
import { SportType, ActivityVisibility } from '../constants/sports';
import { defaultExpiresAt, isActivityListingActive } from '../utils/activityExpiry';
import { normalizeActivityLocation, parseGeographyCoordinates } from '../utils/activityLocationGeo';
import { addDiscoverLog } from '../utils/devLocationLog';
import { CONFIG } from '../constants/config';
import { trackProductEvent, activityAnalyticsProps } from './analyticsService';
import { consumeRateLimit } from './rateLimitService';
import { usersAreBlocked } from './safetyService';
import {
  notifyHostOfJoinRequest,
  notifyPlayerOfJoinApproval,
  notifyPlayerOfJoinRejection,
  notifyGameFinalized,
  notifyRosterNudge,
} from './pushDispatchService';
import { ensureSupabaseSessionReady } from './api/ensureSupabaseSession';
import { ensureActivityGroupConversation } from './chatService';
import { activityHasFriend } from '../utils/activityHelpers';
import { getUserFriends } from './friendsService';

/**
 * Create a new activity
 */
export const createActivity = async (activityData: {
  user_id: string;
  location_id?: string | null;
  sport_type: SportType;
  start_time: string;
  duration: number;
  visibility: ActivityVisibility;
  missing_players?: number;
  roster_min?: number | null;
  roster_max?: number | null;
  scheduling_mode?: 'fixed' | 'flex';
  preference_deadline?: string;
  window_start?: string;
  window_end?: string;
  match_status?: 'open' | 'collecting' | 'finalized' | 'cancelled';
  candidate_location_ids?: string[];
  urgency_level?: 'normal' | 'tonight';
  cost_note?: string | null;
  session_note?: string | null;
  listing_title?: string | null;
  play_intent?: string | null;
  is_intro_session?: boolean;
}): Promise<Activity> => {
  const { candidate_location_ids, ...basePayload } = activityData;
  const schedulingMode = basePayload.scheduling_mode || 'fixed';
  const expires_at = defaultExpiresAt({
    scheduling_mode: schedulingMode,
    start_time: basePayload.start_time,
    window_end: basePayload.window_end,
  });

  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...basePayload,
      expires_at,
      player_count: 1,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create activity: ${error.message}`);
  }

  const createdActivity = data as Activity;

  if (candidate_location_ids?.length) {
    const candidateRows = candidate_location_ids.slice(0, 3).map((locationId, index) => ({
      activity_id: createdActivity.id,
      location_id: locationId,
      priority_order: index + 1,
    }));

    const { error: candidateError } = await supabase
      .from('activity_candidate_locations')
      .insert(candidateRows);

    if (candidateError) {
      throw new Error(`Activity created but candidate locations failed: ${candidateError.message}`);
    }
  }

  trackProductEvent(
    'game_hosted',
    { activity_id: createdActivity.id, sport_type: createdActivity.sport_type },
    activityData.user_id
  );

  try {
    await ensureActivityGroupConversation(createdActivity.id);
  } catch (chatError) {
    if (__DEV__) {
      console.warn('Game lobby chat auto-create skipped:', chatError);
    }
  }

  return createdActivity;
};

/**
 * Get activity by ID with related data
 */
export const getActivityById = async (activityId: string): Promise<Activity | null> => {
  if (!activityId) {
    return null;
  }

  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(*),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('id', activityId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching activity:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const { data: joinRows, error: joinError } = await supabase
    .from('join_requests')
    .select(
      `
      id,
      user_id,
      status,
      requested_at,
      ready_at,
      user:profiles!join_requests_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('activity_id', activityId)
    .in('status', ['approved', 'pending', 'waitlisted']);

  if (joinError) {
    console.error('Error fetching join requests for activity:', joinError);
  }

  return {
    ...(data as Activity),
    join_requests: (joinRows || []) as Activity['join_requests'],
    rsvps: [],
  };
};

/**
 * Distance gate used by {@link getNearbyActivities}. Activities without resolved
 * coordinates pass through so they are not silently dropped.
 */
export function activityWithinRadius(
  activity: Pick<Activity, 'location'>,
  latitude: number,
  longitude: number,
  radiusMeters: number
): boolean {
  const normalized = activity.location
    ? normalizeActivityLocation(activity.location)
    : null;
  const coords = parseGeographyCoordinates(normalized?.location ?? activity.location?.location);
  if (!coords) {
    return true;
  }
  const [lng, lat] = coords;
  const distanceDeg = Math.sqrt(
    Math.pow(lat - latitude, 2) + Math.pow(lng - longitude, 2)
  );
  return distanceDeg * 111000 <= radiusMeters;
}

const DISCOVER_SELECT = `
  *,
  location:activity_locations(*),
  user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
`;

const JOIN_REQUEST_CARD_SELECT = `
  id,
  activity_id,
  user_id,
  status,
  ready_at,
  user:profiles!join_requests_user_id_fkey(id, username, profile_photo_url)
`;

async function enrichActivitiesWithJoinRequests(
  activities: Activity[],
  viewerId?: string
): Promise<Activity[]> {
  if (!viewerId || activities.length === 0) {
    return activities;
  }

  const activityIds = activities.map((activity) => activity.id);
  const hostActivityIds = activities
    .filter((activity) => activity.user_id === viewerId)
    .map((activity) => activity.id);

  const [mineRes, hostJoinRes] = await Promise.all([
    supabase
      .from('join_requests')
      .select(JOIN_REQUEST_CARD_SELECT)
      .in('activity_id', activityIds)
      .eq('user_id', viewerId),
    hostActivityIds.length > 0
      ? supabase
          .from('join_requests')
          .select(JOIN_REQUEST_CARD_SELECT)
          .in('activity_id', hostActivityIds)
          .in('status', ['approved', 'pending'])
      : Promise.resolve({ data: [] as JoinRequest[], error: null }),
  ]);

  const byActivity = new Map<string, JoinRequest[]>();
  const addRow = (row: JoinRequest) => {
    const list = byActivity.get(row.activity_id) || [];
    if (!list.some((existing) => existing.id === row.id)) {
      list.push(row);
      byActivity.set(row.activity_id, list);
    }
  };

  for (const row of (mineRes.data || []) as JoinRequest[]) {
    addRow(row);
  }
  for (const row of (hostJoinRes.data || []) as JoinRequest[]) {
    addRow(row);
  }

  const { data: approvedRows } = await supabase
    .from('join_requests')
    .select(JOIN_REQUEST_CARD_SELECT)
    .in('activity_id', activityIds)
    .eq('status', 'approved');

  for (const row of (approvedRows || []) as JoinRequest[]) {
    addRow(row);
  }

  return activities.map((activity) => ({
    ...activity,
    join_requests: byActivity.get(activity.id) || activity.join_requests || [],
  }));
}

async function queryDiscoverActivities(
  sportType: SportType | undefined
): Promise<{ activities: Activity[]; errorMessage?: string }> {
  let query = supabase.from('activities').select(DISCOVER_SELECT).eq('status', 'active');

  if (sportType) {
    query = query.eq('sport_type', sportType);
  }

  const { data, error } = await query
    .order('start_time', { ascending: true, nullsFirst: false })
    .limit(CONFIG.DISCOVER_QUERY_LIMIT);
  if (error) {
    return { activities: [], errorMessage: error.message };
  }
  return { activities: (data || []) as Activity[] };
}

/**
 * Get nearby activities
 */
/**
 * Mark active listings past expires_at (or past start_time when expires_at unset) as completed
 * and auto-finalize the roster when the play window ends.
 */
export const expireStaleActivities = async (): Promise<void> => {
  const now = new Date().toISOString();
  const completeAndFinalize = {
    status: 'completed' as const,
    match_status: 'finalized' as const,
    finalized_at: now,
    updated_at: now,
  };

  await supabase
    .from('activities')
    .update(completeAndFinalize)
    .eq('status', 'active')
    .not('expires_at', 'is', null)
    .lt('expires_at', now)
    .neq('match_status', 'cancelled');

  await supabase
    .from('activities')
    .update(completeAndFinalize)
    .eq('status', 'active')
    .is('expires_at', null)
    .lt('start_time', now)
    .neq('match_status', 'cancelled');

  const { data: activeGames } = await supabase
    .from('activities')
    .select('id, start_time, duration')
    .eq('status', 'active')
    .neq('match_status', 'cancelled');

  if (activeGames?.length) {
    const nowMs = Date.now();
    const toComplete = activeGames.filter((row) => {
      const endMs =
        new Date(row.start_time).getTime() + (row.duration || 60) * 60 * 1000;
      return nowMs >= endMs;
    });
    if (toComplete.length > 0) {
      await supabase
        .from('activities')
        .update(completeAndFinalize)
        .in(
          'id',
          toComplete.map((r) => r.id)
        );
    }
  }

  await supabase
    .from('activities')
    .update({ match_status: 'finalized', finalized_at: now, updated_at: now })
    .eq('status', 'completed')
    .in('match_status', ['open', 'collecting']);
};

/**
 * Host extends game start + listing expiry together.
 */
export const extendActivitySchedule = async (
  activityId: string,
  newStartTime: Date
): Promise<Activity> => {
  const startIso = newStartTime.toISOString();
  const { data: current, error: readError } = await supabase
    .from('activities')
    .select('scheduling_mode, duration')
    .eq('id', activityId)
    .single();

  if (readError || !current) {
    throw new Error('Could not load activity to extend.');
  }

  const schedulingMode = (current.scheduling_mode as 'fixed' | 'flex') || 'fixed';
  const windowEndIso =
    schedulingMode === 'flex'
      ? new Date(newStartTime.getTime() + 3 * 60 * 60 * 1000).toISOString()
      : undefined;

  return updateActivity(activityId, {
    start_time: startIso,
    expires_at: defaultExpiresAt({
      scheduling_mode: schedulingMode,
      start_time: startIso,
      window_end: windowEndIso,
    }),
    ...(windowEndIso ? { window_end: windowEndIso, window_start: startIso } : {}),
  });
};

function formatScheduleChangeTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function postActivitySystemMessage(
  activityId: string,
  content: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  try {
    await ensureActivityGroupConversation(activityId);
  } catch {
    // Message is best-effort when chat is not open yet.
  }
  const { error } = await supabase.rpc('post_activity_system_message', {
    p_activity_id: activityId,
    p_sender_id: user.id,
    p_content: content,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function hostUpdateGameStartTime(
  activityId: string,
  newStartTime: Date
): Promise<Activity> {
  const updated = await extendActivitySchedule(activityId, newStartTime);
  await postActivitySystemMessage(
    activityId,
    `Host changed game time to ${formatScheduleChangeTime(newStartTime)}`
  );
  return updated;
}

export async function hostUpdateGameCourt(
  activityId: string,
  locationId: string,
  courtName: string
): Promise<Activity> {
  const updated = await updateActivity(activityId, { location_id: locationId });
  await postActivitySystemMessage(activityId, `Host changed court to ${courtName}`);
  return updated;
}

export const getNearbyActivities = async (
  latitude?: number,
  longitude?: number,
  radius: number = CONFIG.DISCOVERY_RADIUS_M,
  sportType?: SportType
): Promise<Activity[]> => {
  const hasUserCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const effectiveRadius = __DEV__
    ? Math.max(radius, 75000)
    : radius;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (authUser) {
    try {
      await consumeRateLimit('discovery_search', authUser.id);
    } catch (rateErr) {
      if (__DEV__) {
        addDiscoverLog(
          'rate limit skipped:',
          rateErr instanceof Error ? rateErr.message : String(rateErr)
        );
      }
    }
    void trackProductEvent(
      'discover_refreshed',
      { sport_type: sportType || null },
      authUser.id
    );
  }

  let { activities, errorMessage } = await queryDiscoverActivities(sportType);
  if (errorMessage && activities.length === 0) {
    throw new Error(`Could not load games: ${errorMessage}`);
  }

  if (__DEV__) {
    addDiscoverLog(
      `query returned ${activities.length} raw`,
      sportType ? `sport=${sportType}` : 'sport=all',
      hasUserCoords ? `coords=${latitude!.toFixed(4)},${longitude!.toFixed(4)}` : 'coords=none'
    );
  }

  let hostedActive: Activity[] = [];
  if (authUser) {
    try {
      const hosted = await getUserActivities(authUser.id);
      hostedActive = hosted.filter(
        (activity) => activity.status === 'active' && isActivityListingActive(activity)
      );
    } catch (hostedErr) {
      if (__DEV__) {
        addDiscoverLog(
          'hosted merge skipped:',
          hostedErr instanceof Error ? hostedErr.message : String(hostedErr)
        );
      }
    }
  }

  const mergedById = new Map<string, Activity>();
  for (const activity of activities) {
    mergedById.set(activity.id, activity);
  }
  for (const activity of hostedActive) {
    mergedById.set(activity.id, activity);
  }

  const authUserId = authUser?.id;

  let friendIds = new Set<string>();
  if (authUserId) {
    try {
      const friends = await getUserFriends(authUserId);
      friendIds = new Set(
        friends
          .map((friendship) => friendship.friend?.id || friendship.friend_id)
          .filter((id): id is string => Boolean(id))
      );
    } catch (friendErr) {
      if (__DEV__) {
        addDiscoverLog(
          'friend list skipped:',
          friendErr instanceof Error ? friendErr.message : String(friendErr)
        );
      }
    }
  }

  const friendRadius = CONFIG.FRIEND_DISCOVERY_RADIUS_M;

  const activeActivities = [...mergedById.values()].filter((activity) =>
    isActivityListingActive(activity)
  );

  const enriched = await enrichActivitiesWithJoinRequests(activeActivities, authUserId);

  const filtered = enriched.filter((activity) => {
    if (authUserId && activity.user_id === authUserId) {
      return true;
    }
    if (__DEV__) {
      return true;
    }
    if (!hasUserCoords) {
      return true;
    }
    if (activityWithinRadius(activity, latitude!, longitude!, effectiveRadius)) {
      return true;
    }
    if (
      friendIds.size > 0 &&
      activityWithinRadius(activity, latitude!, longitude!, friendRadius) &&
      activityHasFriend(activity, friendIds)
    ) {
      return true;
    }
    return false;
  });

  if (__DEV__) {
    addDiscoverLog(
      `returning ${filtered.length} after filters`,
      `radius=${effectiveRadius}m`,
      `friendRadius=${friendRadius}m`
    );
  }

  return filtered;
};

/**
 * Get activities hosted by the user.
 */
export const getUserActivities = async (userId: string): Promise<Activity[]> => {
  await ensureSupabaseSessionReady();

  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(*),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching user activities:', error);
    throw new Error(`Could not load your games: ${error.message}`);
  }

  return (data || []) as Activity[];
};

export type MyGameRole = 'host' | 'joined' | 'waitlisted';

export interface MyGameEntry {
  activity: Activity;
  role: MyGameRole;
}

export interface MyGamesResult {
  active: MyGameEntry[];
  past: MyGameEntry[];
}

function sortMyGameEntries(entries: MyGameEntry[]): MyGameEntry[] {
  return entries.sort(
    (a, b) =>
      new Date(b.activity.created_at).getTime() - new Date(a.activity.created_at).getTime()
  );
}

/**
 * Hosted games plus games the user joined (approved join requests).
 */
export const getMyGames = async (userId: string): Promise<MyGamesResult> => {
  const [hosted, approvedRows, waitlistedRows] = await Promise.all([
    getUserActivities(userId),
    supabase
      .from('join_requests')
      .select(
        `
        activity_id,
        activity:activities(
          *,
          location:activity_locations(*),
          user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'approved')
      .order('requested_at', { ascending: false })
      .limit(50),
    supabase
      .from('join_requests')
      .select(
        `
        activity_id,
        activity:activities(
          *,
          location:activity_locations(*),
          user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'waitlisted')
      .order('requested_at', { ascending: false })
      .limit(20),
  ]);
  const joinRows = approvedRows;

  const entries: MyGameEntry[] = hosted.map((activity) => ({
    activity,
    role: 'host' as const,
  }));
  const seen = new Set(hosted.map((a) => a.id));

  if (!joinRows.error && joinRows.data) {
    for (const row of joinRows.data as { activity_id: string; activity: Activity | null }[]) {
      const activity = row.activity;
      if (!activity || seen.has(activity.id)) {
        continue;
      }
      seen.add(activity.id);
      entries.push({ activity, role: 'joined' });
    }
  }

  if (!waitlistedRows.error && waitlistedRows.data) {
    for (const row of waitlistedRows.data as { activity_id: string; activity: Activity | null }[]) {
      const activity = row.activity;
      if (!activity || seen.has(activity.id)) {
        continue;
      }
      seen.add(activity.id);
      entries.push({ activity, role: 'waitlisted' });
    }
  }

  const hostIds = hosted.map((a) => a.id);
  if (hostIds.length > 0) {
    const { data: hostJoinRows } = await supabase
      .from('join_requests')
      .select(
        `
        id,
        activity_id,
        user_id,
        status,
        ready_at,
        user:profiles!join_requests_user_id_fkey(id, username, profile_photo_url)
      `
      )
      .in('activity_id', hostIds)
      .in('status', ['approved', 'pending', 'waitlisted']);

    const byActivity = new Map<string, Activity['join_requests']>();
    for (const row of hostJoinRows || []) {
      const activityId = row.activity_id as string;
      const list = byActivity.get(activityId) ?? [];
      list.push(row);
      byActivity.set(activityId, list);
    }
    for (const entry of entries) {
      if (entry.role === 'host') {
        entry.activity = {
          ...entry.activity,
          join_requests: byActivity.get(entry.activity.id) ?? [],
        };
      }
    }
  }

  const sorted = sortMyGameEntries(entries);
  return {
    active: sorted.filter(
      ({ activity }) => activity.status === 'active' && isActivityListingActive(activity)
    ),
    past: sorted.filter(
      ({ activity }) => activity.status !== 'active' || !isActivityListingActive(activity)
    ),
  };
};

/** Whether activity group chat should be available in the UI. */
export function canOpenActivityChat(activity: Activity, viewerUserId?: string): boolean {
  if (viewerUserId && viewerUserId === activity.user_id) {
    return true;
  }
  if (activity.match_status === 'finalized') {
    return true;
  }
  const approvedCount = (activity.join_requests || []).filter((r) => r.status === 'approved').length;
  if (approvedCount > 0) {
    return true;
  }
  if (activity.scheduling_mode === 'fixed' && (activity.player_count || 1) >= 2) {
    return true;
  }
  return false;
}

/**
 * Update activity
 */
export const updateActivity = async (
  activityId: string,
  updates: Partial<Activity>
): Promise<Activity> => {
  const { data, error } = await supabase
    .from('activities')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update activity: ${error.message}`);
  }

  return data as Activity;
};

/**
 * Create join request
 */
export const createJoinRequest = async (
  activityId: string,
  userId: string
): Promise<JoinRequest> => {
  const { data: activityRow, error: activityErr } = await supabase
    .from('activities')
    .select('user_id, host:profiles!activities_user_id_fkey(is_suspended)')
    .eq('id', activityId)
    .single();

  if (activityErr || !activityRow) {
    throw new Error('Activity not found.');
  }

  const hostId = activityRow.user_id as string;
  const hostSuspended = Boolean(
    (activityRow.host as { is_suspended?: boolean } | null)?.is_suspended
  );

  if (hostSuspended) {
    throw new Error('This host is not accepting join requests right now.');
  }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', userId)
    .maybeSingle();

  if (requesterProfile?.is_suspended) {
    throw new Error('Your account cannot send join requests right now.');
  }

  if (await usersAreBlocked(userId, hostId)) {
    throw new Error('You cannot join this game because of a block between you and the host.');
  }

  const { error: joinLimitError } = await supabase.rpc('assert_user_can_join_activity', {
    p_activity_id: activityId,
  });
  if (joinLimitError) {
    throw new Error(joinLimitError.message);
  }

  const { data: requestId, error: requestError } = await supabase.rpc('request_join_activity', {
    p_activity_id: activityId,
  });
  if (requestError) {
    throw new Error(`Failed to create join request: ${requestError.message}`);
  }
  if (!requestId) {
    throw new Error('Failed to create join request.');
  }

  const { data, error } = await supabase
    .from('join_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load join request: ${error?.message ?? 'Unknown error'}`);
  }

  try {
    await notifyHostOfJoinRequest(activityId);
  } catch (pushError) {
    if (__DEV__) {
      console.warn('Host push notification skipped:', pushError);
    }
  }

  await trackProductEvent(
    'join_request_created',
    { activity_id: activityId, join_request_id: data.id },
    userId
  );

  return data as JoinRequest;
};

/**
 * Approve join request
 */
export const approveJoinRequest = async (
  requestId: string,
  activityId: string
): Promise<void> => {
  const { error } = await supabase.rpc('approve_join_request', {
    p_request_id: requestId,
    p_activity_id: activityId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { user: hostUser },
  } = await supabase.auth.getUser();
  if (hostUser) {
    await trackProductEvent(
      'join_request_approved',
      { activity_id: activityId, join_request_id: requestId },
      hostUser.id
    );

    const { data: joinRow } = await supabase
      .from('join_requests')
      .select('user_id')
      .eq('id', requestId)
      .maybeSingle();

    if (joinRow?.user_id) {
      try {
        await notifyPlayerOfJoinApproval(activityId, joinRow.user_id as string);
      } catch (pushError) {
        if (__DEV__) {
          console.warn('Approval push skipped:', pushError);
        }
      }

      const { data: playedBefore } = await supabase.rpc('users_played_together_before', {
        p_host_id: hostUser.id,
        p_guest_id: joinRow.user_id as string,
        p_exclude_activity_id: activityId,
      });
      if (playedBefore) {
        await trackProductEvent(
          'repeat_game_detected',
          {
            activity_id: activityId,
            guest_user_id: joinRow.user_id,
          },
          hostUser.id
        );
      }
    }
  }
};

/**
 * Reject join request
 */
export const rejectJoinRequest = async (requestId: string): Promise<void> => {
  const { data: joinRow } = await supabase
    .from('join_requests')
    .select('user_id, activity_id')
    .eq('id', requestId)
    .maybeSingle();

  const { error } = await supabase
    .from('join_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw new Error(`Failed to reject join request: ${error.message}`);
  }

  const activityId = joinRow?.activity_id as string | undefined;
  const playerUserId = joinRow?.user_id as string | undefined;
  if (activityId && playerUserId) {
    try {
      await notifyPlayerOfJoinRejection(activityId, playerUserId);
    } catch (pushError) {
      if (__DEV__) {
        console.warn('Rejection push skipped:', pushError);
      }
    }
  }
};

/**
 * Get join requests for an activity
 */
export const getActivityJoinRequests = async (
  activityId: string
): Promise<JoinRequest[]> => {
  const { data, error } = await supabase
    .from('join_requests')
    .select(
      `
      *,
      user:profiles!join_requests_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('activity_id', activityId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }

  return (data || []) as JoinRequest[];
};

/**
 * Upsert participant preference for flexible matching.
 */
export const upsertParticipantPreference = async (
  activityId: string,
  userId: string,
  preference: {
    earliest_start?: string | null;
    latest_start?: string | null;
    preferred_duration?: number | null;
    preferred_location_id?: string | null;
    availability_weight?: number;
    notes?: string | null;
  }
): Promise<ActivityParticipantPreference> => {
  const payload = {
    activity_id: activityId,
    user_id: userId,
    earliest_start: preference.earliest_start ?? null,
    latest_start: preference.latest_start ?? null,
    preferred_duration: preference.preferred_duration ?? null,
    preferred_location_id: preference.preferred_location_id ?? null,
    availability_weight: preference.availability_weight ?? 3,
    notes: preference.notes ?? null,
  };

  const { data, error } = await supabase
    .from('activity_participant_preferences')
    .upsert(payload, {
      onConflict: 'activity_id,user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit preference: ${error.message}`);
  }

  return data as ActivityParticipantPreference;
};

/**
 * Get all submitted participant preferences for an activity.
 */
export const getActivityParticipantPreferences = async (
  activityId: string
): Promise<ActivityParticipantPreference[]> => {
  const { data, error } = await supabase
    .from('activity_participant_preferences')
    .select('*')
    .eq('activity_id', activityId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }

  return (data || []) as ActivityParticipantPreference[];
};

/**
 * Host finalizes game (fixed or flex) after ready gates pass.
 */
export const finalizeGameCommitment = async (activityId: string): Promise<void> => {
  const { error } = await supabase.rpc('finalize_game_commitment', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  await notifyGameFinalized(activityId);
  const props = await activityAnalyticsProps(activityId);
  void trackProductEvent('roster_locked', props);
};

export const setGameReady = async (activityId: string, ready = true): Promise<void> => {
  const { error } = await supabase.rpc('set_game_ready', {
    p_activity_id: activityId,
    p_ready: ready,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (ready) {
    const props = await activityAnalyticsProps(activityId);
    void trackProductEvent('game_ready_set', props);
  }
};

export const nudgeSessionRoster = async (activityId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('nudge_session_roster', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  await notifyRosterNudge(activityId);
  return Number(data ?? 0);
};

export const leaveGame = async (activityId: string): Promise<void> => {
  const { error } = await supabase.rpc('leave_game', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export type HostTransferResult = {
  cancelled: boolean;
  new_host_id: string | null;
  new_host_username?: string | null;
};

/** Host leaves and passes host to next approved player (ready first, join time asc). */
export const hostTransferAndExit = async (activityId: string): Promise<HostTransferResult> => {
  const { data, error } = await supabase.rpc('host_transfer_and_exit', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const row = (data || {}) as Record<string, unknown>;
  return {
    cancelled: Boolean(row.cancelled),
    new_host_id: row.new_host_id != null ? String(row.new_host_id) : null,
    new_host_username:
      row.new_host_username != null ? String(row.new_host_username) : null,
  };
};

export const setSessionNote = async (activityId: string, note: string | null): Promise<void> => {
  const { error } = await supabase.rpc('set_session_note', {
    p_activity_id: activityId,
    p_note: note ?? '',
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const removeFromRoster = async (
  activityId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase.rpc('remove_from_roster', {
    p_activity_id: activityId,
    p_user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export type UserAttendanceStats = {
  committed_sessions: number;
  confirmed_attended: number;
  reliability_pct: number | null;
  confidence_band: 'new_player' | 'building' | 'established';
};

export const getUserAttendanceStats = async (
  userId?: string
): Promise<UserAttendanceStats | null> => {
  const { data, error } = await supabase.rpc('get_user_attendance_stats', {
    p_user_id: userId ?? undefined,
  });
  if (error) {
    throw new Error(error.message);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return null;
  }
  return {
    committed_sessions: Number(row.committed_sessions ?? 0),
    confirmed_attended: Number(row.confirmed_attended ?? 0),
    reliability_pct:
      row.reliability_pct != null ? Number(row.reliability_pct) : null,
    confidence_band: (row.confidence_band as UserAttendanceStats['confidence_band']) ?? 'new_player',
  };
};

export const submitGameAttendance = async (
  activityId: string,
  attendedUserIds: string[]
): Promise<string | null> => {
  const { data, error } = await supabase.rpc('submit_game_attendance', {
    p_activity_id: activityId,
    p_attended_user_ids: attendedUserIds,
  });
  if (error) {
    throw new Error(error.message);
  }
  const recapId = (data as string | null) ?? null;
  const props = await activityAnalyticsProps(activityId);
  void trackProductEvent('attendance_submitted', {
    ...props,
    attended_count: attendedUserIds.length,
    ...(recapId ? { recap_id: recapId } : {}),
  });
  return recapId;
};

export function formatReliabilityLabel(stats: UserAttendanceStats | null): string {
  if (!stats || stats.committed_sessions === 0) {
    return 'New player';
  }
  if (stats.confidence_band === 'new_player') {
    return 'New player';
  }
  if (stats.confidence_band === 'building') {
    return 'Building reliability';
  }
  if (stats.reliability_pct != null) {
    return `${stats.reliability_pct}% show-up rate`;
  }
  return 'Reliable player';
}

/** Host creates invite-only follow-up game; seeds roster from source game. */
export const scheduleNextGameFromActivity = async (
  sourceActivityId: string,
  startTime?: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('schedule_next_game_from_activity', {
    p_source_activity_id: sourceActivityId,
    p_start_time: startTime ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to schedule next game');
  }
  const sourceProps = await activityAnalyticsProps(sourceActivityId);
  void trackProductEvent('crew_replayed', {
    group_id: sourceProps.group_id,
    activity_id: data,
  });
  void trackProductEvent('second_session_scheduled', {
    ...sourceProps,
    activity_id: data,
    source_activity_id: sourceActivityId,
  });
  return data as string;
};

/** Regulars host posts next invite-only game with chosen roster range. */
export const scheduleGroupNextGame = async (
  groupId: string,
  startTime: string,
  rosterMax = 8,
  duration?: number,
  rosterMin?: number
): Promise<string> => {
  const { data, error } = await supabase.rpc('schedule_group_next_game', {
    p_group_id: groupId,
    p_start_time: startTime,
    p_player_count: rosterMax,
    p_duration: duration ?? null,
    p_roster_min: rosterMin ?? null,
    p_roster_max: rosterMax,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to schedule group game');
  }
  void trackProductEvent('crew_replayed', { group_id: groupId, activity_id: data });
  void trackProductEvent('second_session_scheduled', {
    group_id: groupId,
    activity_id: data,
  });
  return data as string;
};

export const makeActivityRecurring = async (
  activityId: string,
  intervalDays = 7
): Promise<string> => {
  const { data, error } = await supabase.rpc('make_activity_recurring', {
    p_activity_id: activityId,
    p_interval_days: intervalDays,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to create recurring series');
  }
  return data as string;
};

export const setGameRsvp = async (
  activityId: string,
  status: GameRsvpStatus
): Promise<void> => {
  const { error } = await supabase.rpc('set_game_rsvp', {
    p_activity_id: activityId,
    p_status: status,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const joinGameViaInvite = async (inviteToken: string): Promise<string> => {
  const { data, error } = await supabase.rpc('join_game_via_invite', {
    p_invite_token: inviteToken,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Invite link could not be redeemed');
  }
  return data as string;
};

export const resolveActivityIdFromInviteToken = async (
  inviteToken: string
): Promise<string | null> => {
  const { data, error } = await supabase.rpc('get_game_invite_preview', {
    p_invite_token: inviteToken,
  });
  if (error) {
    throw new Error(error.message);
  }
  const preview = data as { found?: boolean; activity_id?: string } | null;
  if (!preview?.found || !preview.activity_id) {
    return null;
  }
  return preview.activity_id;
};

export const getActivityByInviteToken = async (inviteToken: string): Promise<Activity | null> => {
  const activityId = await resolveActivityIdFromInviteToken(inviteToken);
  if (!activityId) {
    return null;
  }
  return getActivityById(activityId);
};

/**
 * Host finalizes best matching slot via RPC (flex internals).
 */
export const finalizeFlexibleActivity = async (
  activityId: string,
  fallbackLocationId?: string
): Promise<FinalizedActivityResult> => {
  const { data, error } = await supabase.rpc('finalize_activity_best_slot', {
    target_activity_id: activityId,
    fallback_location_id: fallbackLocationId || null,
  });

  if (error) {
    throw new Error(`Failed to finalize activity: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error('Finalization returned no result.');
  }

  return result as FinalizedActivityResult;
};

/**
 * Get candidate locations for an activity.
 */
export const getActivityCandidateLocations = async (
  activityId: string
): Promise<ActivityCandidateLocation[]> => {
  const { data, error } = await supabase
    .from('activity_candidate_locations')
    .select(
      `
      id,
      activity_id,
      location_id,
      priority_order,
      created_at,
      location:activity_locations(*)
    `
    )
    .eq('activity_id', activityId)
    .order('priority_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch candidate locations: ${error.message}`);
  }

  return (data || []) as ActivityCandidateLocation[];
};
