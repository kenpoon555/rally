import { Activity } from '../types/activity';
import { SportType } from '../constants/sports';
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

const MARCUS_ID = 'd1000001-0001-4001-8001-000000000001';
const OTHER_COACH_ID = 'd1000002-0002-4002-8002-000000000002';

const DEMO_STUDENTS: StudentProfile[] = [
  {
    id: 'sp-demo-alex',
    parent_user_id: MARCUS_ID,
    display_name: 'Alex',
    active_class_summary: 'Beginner Badminton · Mon 7 PM',
    status: 'active',
  },
  {
    id: 'sp-demo-mia',
    parent_user_id: MARCUS_ID,
    display_name: 'Mia',
    active_class_summary: 'No active class',
    status: 'active',
  },
];

function nextMondayAt(hour: number): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const DEMO_COACH_CLASSES: CoachClassListing[] = [
  {
    id: 'class-demo-badminton',
    coach_user_id: MARCUS_ID,
    title: 'Beginner Badminton',
    sport_type: SportType.BADMINTON,
    location_name: 'Monrovia Community Center',
    start_time: nextMondayAt(19),
    duration_minutes: 90,
    enrolled_count: 8,
    confirmed_count: 6,
    fee_note: '$20 drop-in · Venmo @marcus',
  },
  {
    id: 'class-demo-basketball',
    coach_user_id: MARCUS_ID,
    title: 'Youth Basketball Clinic',
    sport_type: SportType.BASKETBALL,
    location_name: 'Julian Fisher Park Basketball Courts',
    start_time: nextMondayAt(10),
    duration_minutes: 120,
    enrolled_count: 10,
    confirmed_count: 7,
    fee_note: 'Bring water',
  },
  {
    id: 'class-discover-badminton',
    coach_user_id: OTHER_COACH_ID,
    title: 'Intermediate Badminton',
    sport_type: SportType.BADMINTON,
    location_name: 'Arcadia Badminton Center',
    start_time: nextMondayAt(18),
    duration_minutes: 90,
    enrolled_count: 6,
    confirmed_count: 4,
    fee_note: '$25/session',
  },
  {
    id: 'class-discover-basketball',
    coach_user_id: OTHER_COACH_ID,
    title: 'Saturday Skills Camp',
    sport_type: SportType.BASKETBALL,
    location_name: 'Pasadena YMCA',
    start_time: nextMondayAt(9),
    duration_minutes: 120,
    enrolled_count: 12,
    confirmed_count: 9,
    fee_note: 'Ages 10–14',
  },
];

const DEMO_PARENT_ENROLLMENTS: ParentClassEnrollment[] = [
  {
    id: 'enroll-alex-badminton',
    student_profile_id: 'sp-demo-alex',
    student_name: 'Alex',
    class_id: 'class-demo-badminton',
    class_title: 'Beginner Badminton',
    sport_type: SportType.BADMINTON,
    start_time: nextMondayAt(19),
    response_status: 'not_responded',
  },
];

const DEMO_ROSTER: Record<string, ClassRosterStudent[]> = {
  'class-demo-badminton': [
    { id: 'r1', display_name: 'Alex', status: 'not_responded', guardian_name: 'Marcus' },
    { id: 'r2', display_name: 'Jordan K.', status: 'confirmed', guardian_name: 'Parent' },
    { id: 'r3', display_name: 'Sam T.', status: 'confirmed', guardian_name: 'Parent' },
    { id: 'r4', display_name: 'Riley P.', status: 'cant_make_it', guardian_name: 'Parent' },
  ],
  'class-demo-basketball': [
    { id: 'r5', display_name: 'Casey', status: 'confirmed', guardian_name: 'Parent' },
    { id: 'r6', display_name: 'Devin', status: 'confirmed', guardian_name: 'Parent' },
    { id: 'r7', display_name: 'Taylor', status: 'not_responded', guardian_name: 'Parent' },
  ],
};

const DEMO_ANNOUNCEMENTS: ClassAnnouncementInboxItem[] = [
  {
    id: 'ann-demo-1',
    class_title: 'Beginner Badminton',
    preview: 'Reminder: bring indoor shoes. Court 2 this Monday.',
    sent_at: new Date().toISOString(),
    audience: 'parents',
  },
];

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
  if (STUDENT_PROFILES) {
    try {
      const rows = await listStudentProfilesForParent(parentUserId);
      if (rows.length > 0) {
        return rows;
      }
    } catch {
      // Fall through to demo rows for coach foundation when DB empty.
    }
  }
  if (!PARENT_FAMILY_UI) {
    return [];
  }
  return DEMO_STUDENTS.filter((row) => row.parent_user_id === parentUserId);
}

export async function listCoachClasses(coachUserId: string): Promise<CoachClassListing[]> {
  if (COACH_DASHBOARD) {
    try {
      const rows = await listCoachClassListingsFromDb(coachUserId);
      if (rows.length > 0) {
        return rows;
      }
    } catch {
      // Fall through to demo rows when DB empty or migration pending.
    }
  }
  return DEMO_COACH_CLASSES.filter((row) => row.coach_user_id === coachUserId);
}

export async function listParentEnrollments(parentUserId: string): Promise<ParentClassEnrollment[]> {
  if (!PARENT_FAMILY_UI && !PARENT_PILOT_ENROLLMENT) {
    return [];
  }
  if (PARENT_PILOT_ENROLLMENT) {
    try {
      const rows = await listParentEnrollmentsFromDb(parentUserId);
      if (rows.length > 0) {
        return rows;
      }
    } catch {
      // Fall through to demo rows.
    }
  }
  if (!PARENT_FAMILY_UI) {
    return [];
  }
  if (parentUserId !== MARCUS_ID) {
    return [];
  }
  return DEMO_PARENT_ENROLLMENTS;
}

export async function listDiscoverClasses(sport: string, coachUserId?: string): Promise<CoachClassListing[]> {
  const rows = coachUserId
    ? DEMO_COACH_CLASSES.filter((c) => c.coach_user_id !== coachUserId)
    : DEMO_COACH_CLASSES;
  return rows.filter((row) => row.sport_type === sport);
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

  const listing = DEMO_COACH_CLASSES.find((row) => row.id === classId) ?? null;
  if (!listing || !COACH_CLASS_OPERATIONS) {
    return listing;
  }
  try {
    const state = await getClassSessionState(listing.coach_user_id, classId);
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
  } catch {
    return listing;
  }
}

export async function getClassRoster(classId: string): Promise<ClassRosterStudent[]> {
  return DEMO_ROSTER[classId] ?? [];
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
  if (COACH_CLASS_OPERATIONS && parentUserId) {
    try {
      const rows = await listParentClassNotifications(parentUserId);
      if (rows.length > 0) {
        return rows;
      }
    } catch {
      // Fall through to demo rows.
    }
  }
  return DEMO_ANNOUNCEMENTS;
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
