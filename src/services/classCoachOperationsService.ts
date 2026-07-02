import { supabase } from './api/supabase';
import { COACH_CLASS_OPERATIONS } from '../constants/coachOpsFlags';
import { CoachClassListing, ClassAnnouncementInboxItem } from '../types/coachParent';

type SessionStateRow = {
  class_id: string;
  coach_user_id: string;
  class_title: string;
  sport_type: string | null;
  scheduled_start: string;
  effective_start: string;
  duration_minutes: number;
  session_status: 'scheduled' | 'deferred' | 'cancelled';
  updated_at: string;
};

export async function getClassSessionState(
  coachUserId: string,
  classId: string
): Promise<SessionStateRow | null> {
  if (!COACH_CLASS_OPERATIONS) {
    return null;
  }
  const { data, error } = await supabase
    .from('coach_class_session_state')
    .select('*')
    .eq('coach_user_id', coachUserId)
    .eq('class_id', classId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as SessionStateRow | null) ?? null;
}

export function applySessionStateToListing(
  listing: CoachClassListing,
  state: SessionStateRow | null
): CoachClassListing {
  if (!state) {
    return listing;
  }
  return {
    ...listing,
    session_status: state.session_status,
    effective_start_time: state.effective_start,
    start_time:
      state.session_status === 'deferred' ? state.effective_start : listing.start_time,
  };
}

export async function deferCoachClassSession(
  listing: CoachClassListing,
  notifyParents: boolean
): Promise<SessionStateRow> {
  const { data, error } = await supabase.rpc('defer_coach_class_session', {
    p_class_id: listing.id,
    p_class_title: listing.title,
    p_sport_type: listing.sport_type,
    p_scheduled_start: listing.start_time,
    p_duration_minutes: listing.duration_minutes,
    p_notify_parents: notifyParents,
  });
  if (error) {
    throw error;
  }
  return data as SessionStateRow;
}

export async function cancelCoachClassSession(
  listing: CoachClassListing,
  notifyParents: boolean
): Promise<SessionStateRow> {
  const { data, error } = await supabase.rpc('cancel_coach_class_session', {
    p_class_id: listing.id,
    p_class_title: listing.title,
    p_sport_type: listing.sport_type,
    p_scheduled_start: listing.start_time,
    p_duration_minutes: listing.duration_minutes,
    p_notify_parents: notifyParents,
  });
  if (error) {
    throw error;
  }
  return data as SessionStateRow;
}

export async function listParentClassNotifications(
  parentUserId: string
): Promise<ClassAnnouncementInboxItem[]> {
  if (!COACH_CLASS_OPERATIONS) {
    return [];
  }
  const { data, error } = await supabase
    .from('class_parent_notifications')
    .select('id, class_id, operation, message, created_at, profiles!coach_user_id(username)')
    .eq('parent_user_id', parentUserId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    throw error;
  }

  const classIds = [...new Set((data ?? []).map((row) => row.class_id as string))];
  const titleByClassId = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: states } = await supabase
      .from('coach_class_session_state')
      .select('class_id, class_title')
      .in('class_id', classIds);
    for (const row of states ?? []) {
      titleByClassId.set(row.class_id as string, row.class_title as string);
    }
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    class_title: titleByClassId.get(row.class_id as string) ?? 'Class update',
    coach_display_name: (row.profiles as { username: string } | null)?.username,
    preview: row.message as string,
    sent_at: row.created_at as string,
    audience: 'parents' as const,
    operation: row.operation as ClassAnnouncementInboxItem['operation'],
  }));
}

export async function getSessionStateForParentClass(
  parentUserId: string,
  classId: string,
  coachUserId: string
): Promise<SessionStateRow | null> {
  if (!COACH_CLASS_OPERATIONS) {
    return null;
  }
  const { data, error } = await supabase
    .from('coach_class_session_state')
    .select('*')
    .eq('class_id', classId)
    .eq('coach_user_id', coachUserId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as SessionStateRow | null) ?? null;
}

export function sessionStatusLabel(status: SessionStateRow['session_status']): string {
  if (status === 'deferred') {
    return 'Deferred';
  }
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  return 'Scheduled';
}

export async function sendClassAnnouncement(
  classId: string,
  coachUserId: string,
  message: string
): Promise<number> {
  const { data, error } = await supabase.rpc('notify_enrolled_class_parents', {
    p_class_id: classId,
    p_coach_user_id: coachUserId,
    p_operation: 'notify',
    p_message: message,
  });
  if (error) {
    throw error;
  }
  return (data as number) ?? 0;
}

/** Coach view: deduplicated list of announcements sent for a class. */
export async function listCoachSentAnnouncements(
  classId: string,
  coachUserId: string
): Promise<ClassAnnouncementInboxItem[]> {
  if (!COACH_CLASS_OPERATIONS) {
    return [];
  }
  const { data, error } = await supabase
    .from('class_parent_notifications')
    .select('id, operation, message, created_at')
    .eq('class_id', classId)
    .eq('coach_user_id', coachUserId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    throw error;
  }
  // One row is inserted per enrolled parent per send; deduplicate by message+operation.
  const seen = new Set<string>();
  const unique: ClassAnnouncementInboxItem[] = [];
  for (const row of data ?? []) {
    const key = `${row.operation as string}|${row.message as string}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        id: row.id as string,
        class_title: '',
        preview: row.message as string,
        sent_at: row.created_at as string,
        audience: 'parents',
        operation: row.operation as ClassAnnouncementInboxItem['operation'],
      });
    }
  }
  return unique;
}

/** Parent view: announcements received for a specific class. */
export async function listParentAnnouncementsForClass(
  parentUserId: string,
  classId: string
): Promise<ClassAnnouncementInboxItem[]> {
  if (!COACH_CLASS_OPERATIONS) {
    return [];
  }
  const { data, error } = await supabase
    .from('class_parent_notifications')
    .select('id, operation, message, created_at, profiles!coach_user_id(username)')
    .eq('parent_user_id', parentUserId)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    class_title: '',
    coach_display_name: (row.profiles as { username: string } | null)?.username,
    preview: row.message as string,
    sent_at: row.created_at as string,
    audience: 'parents',
    operation: row.operation as ClassAnnouncementInboxItem['operation'],
  }));
}
