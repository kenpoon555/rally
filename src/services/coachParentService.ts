import { Activity } from '../types/activity';
import {
  ClassAnnouncementInboxItem,
  ClassRosterStudent,
  CoachClassListing,
  ParentClassEnrollment,
  StudentProfile,
} from '../types/coachParent';
import {
  CLASS_INBOX_ANNOUNCE,
  COACH_DASHBOARD,
  PARENT_FAMILY_UI,
} from '../constants/coachParentFlags';
import { STUDENT_PROFILES, PARENT_PILOT_ENROLLMENT } from '../constants/parentStudentFlags';
import { listStudentProfilesForParent } from './studentProfileService';
import { listParentEnrollmentsFromDb, updateEnrollmentResponseStatus } from './studentEnrollmentService';
import {
  getCoachClassListingFromDb,
  listCoachClassListingsFromDb,
} from './coachClassListingService';
import { getClassSessionState, listParentClassNotifications } from './classCoachOperationsService';
import { COACH_CLASS_OPERATIONS } from '../constants/coachOpsFlags';
import {
  AgeCategory,
  isAdultAgeCategory,
  isTeenAgeCategory,
} from '../types/ageCategory';

export type CoachParentUser = {
  id?: string;
  is_coach?: boolean;
  age_category?: AgeCategory | null;
};

export function userIsCoach(user: CoachParentUser | null | undefined): boolean {
  if (!user?.id || isTeenAgeCategory(user.age_category)) {
    return false;
  }
  return Boolean(user.is_coach);
}

export function shouldShowFamilySection(
  user: CoachParentUser | null | undefined,
  studentCount: number
): boolean {
  if (!user?.id) {
    return false;
  }
  if (isTeenAgeCategory(user.age_category)) {
    return false;
  }
  if (!PARENT_FAMILY_UI && !STUDENT_PROFILES) {
    return false;
  }
  if (PARENT_FAMILY_UI || STUDENT_PROFILES) {
    return isAdultAgeCategory(user.age_category) || studentCount > 0;
  }
  return studentCount > 0;
}

export function shouldShowCoachToolsSection(user: CoachParentUser | null | undefined): boolean {
  if (!COACH_DASHBOARD || isTeenAgeCategory(user?.age_category)) {
    return false;
  }
  return userIsCoach(user);
}

/** Today MY CLASSES — adult parents with child context only (not R0 players, teens, or empty coaches). */
export function shouldShowTodayMyClassesCard(
  user: CoachParentUser | null | undefined,
  studentCount: number,
  enrollmentCount: number
): boolean {
  if (!PARENT_FAMILY_UI) {
    return false;
  }
  if (!user?.id || isTeenAgeCategory(user.age_category)) {
    return false;
  }
  if (!isAdultAgeCategory(user.age_category)) {
    return false;
  }
  return studentCount > 0 || enrollmentCount > 0;
}

export async function listStudentProfiles(parentUserId: string): Promise<StudentProfile[]> {
  if (!PARENT_FAMILY_UI && !STUDENT_PROFILES) {
    return [];
  }
  if (!STUDENT_PROFILES) {
    return [];
  }
  try {
    return await listStudentProfilesForParent(parentUserId);
  } catch {
    return [];
  }
}

export async function listCoachClasses(coachUserId: string): Promise<CoachClassListing[]> {
  if (!COACH_DASHBOARD) {
    return [];
  }
  try {
    return await listCoachClassListingsFromDb(coachUserId);
  } catch {
    return [];
  }
}

export async function listParentEnrollments(parentUserId: string): Promise<ParentClassEnrollment[]> {
  if (!PARENT_FAMILY_UI && !PARENT_PILOT_ENROLLMENT) {
    return [];
  }
  if (!PARENT_PILOT_ENROLLMENT) {
    return [];
  }
  try {
    return await listParentEnrollmentsFromDb(parentUserId);
  } catch {
    return [];
  }
}

export async function listDiscoverClasses(_sport: string, _coachUserId?: string): Promise<CoachClassListing[]> {
  return [];
}

export async function getCoachClass(classId: string): Promise<CoachClassListing | null> {
  if (COACH_DASHBOARD) {
    try {
      const fromDb = await getCoachClassListingFromDb(classId);
      if (fromDb) {
        if (!COACH_CLASS_OPERATIONS) {
          return fromDb;
        }
        try {
          const state = await getClassSessionState(fromDb.coach_user_id, classId);
          if (!state) {
            return fromDb;
          }
          return {
            ...fromDb,
            session_status: state.session_status,
            effective_start_time: state.effective_start,
            start_time:
              state.session_status === 'deferred' ? state.effective_start : fromDb.start_time,
          };
        } catch {
          return fromDb;
        }
      }
    } catch {
      // Fall through to demo listing.
    }
  }

  return null;
}

export async function getClassRoster(classId: string): Promise<ClassRosterStudent[]> {
  if (!COACH_CLASS_OPERATIONS) {
    return [];
  }
  try {
    const { data, error } = await (await import('./api/supabase')).supabase
      .from('class_roster_students')
      .select('id, display_name, status, guardian_name')
      .eq('class_id', classId)
      .order('display_name');
    if (error) throw error;
    return (data ?? []) as ClassRosterStudent[];
  } catch {
    return [];
  }
}

export async function listClassAnnouncements(
  parentUserId?: string,
  options?: { isCoach?: boolean; hasClassContext?: boolean }
): Promise<ClassAnnouncementInboxItem[]> {
  if (!CLASS_INBOX_ANNOUNCE || !parentUserId) {
    return [];
  }
  if (!options?.isCoach && !options?.hasClassContext) {
    return [];
  }
  if (!COACH_CLASS_OPERATIONS) {
    return [];
  }
  try {
    return await listParentClassNotifications(parentUserId);
  } catch {
    return [];
  }
}

export function coachClassToActivity(listing: CoachClassListing, hostUsername = 'coach'): Activity {
  return {
    id: listing.id,
    user_id: listing.coach_user_id,
    sport_type: listing.sport_type,
    start_time: listing.start_time,
    duration: listing.duration_minutes,
    visibility: 'nearby',
    player_count: listing.enrolled_count,
    missing_players: Math.max(0, listing.enrolled_count - listing.confirmed_count),
    status: 'active',
    match_status: 'open',
    listing_title: listing.title,
    cost_note: listing.fee_note ?? null,
    created_at: listing.start_time,
    updated_at: listing.start_time,
    location: {
      id: `loc-${listing.id}`,
      name: listing.location_name,
      address: listing.location_name,
      sport_type: listing.sport_type,
      google_place_id: undefined,
      radius: 50,
      location: {
        type: 'Point',
        coordinates: [-118.0, 34.14],
      },
      created_at: listing.start_time,
      updated_at: listing.start_time,
    },
    user: {
      id: listing.coach_user_id,
      username: hostUsername,
    },
  };
}

export function coachTodayClasses(coachUserId: string): CoachClassListing[] {
  const today = new Date();
  return DEMO_COACH_CLASSES.filter((row) => {
    if (row.coach_user_id !== coachUserId) {
      return false;
    }
    const start = new Date(row.start_time);
    return start.toDateString() === today.toDateString() || start > today;
  }).slice(0, 2);
}

/** Parent updates session response from Today My Classes (demo + DB). */
export async function updateParentEnrollmentResponse(
  parentUserId: string,
  enrollmentId: string,
  status: ParentClassEnrollment['response_status']
): Promise<ParentClassEnrollment> {
  if (PARENT_PILOT_ENROLLMENT) {
    try {
      return await updateEnrollmentResponseStatus(parentUserId, enrollmentId, status);
    } catch {
      // Fall through to demo rows when id is local demo or DB empty.
    }
  }

  const demo = DEMO_PARENT_ENROLLMENTS.find(
    (row) => row.id === enrollmentId && parentUserId === MARCUS_ID
  );
  if (!demo) {
    throw new Error('Could not update class response.');
  }
  demo.response_status = status;
  const roster = DEMO_ROSTER[demo.class_id];
  const rosterRow = roster?.find((row) => row.display_name === demo.student_name);
  if (rosterRow) {
    rosterRow.status = status;
  }
  return { ...demo };
}
