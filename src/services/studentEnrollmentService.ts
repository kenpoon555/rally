import { Share } from 'react-native';
import { supabase } from './api/supabase';
import { PARENT_PILOT_ENROLLMENT } from '../constants/parentStudentFlags';
import { COACH_CLASS_OPERATIONS } from '../constants/coachOpsFlags';
import { SportType } from '../constants/sports';
import {
  ClassEnrollmentInvite,
  ClassRosterStudent,
  ParentClassEnrollment,
} from '../types/coachParent';
import { buildClassEnrollmentInviteUrl } from '../navigation/deepLinking';

type EnrollmentRow = {
  id: string;
  student_profile_id: string;
  coach_user_id: string;
  class_id: string | null;
  class_title: string;
  sport_type: string | null;
  status: 'active' | 'ended';
  response_status: 'confirmed' | 'not_responded' | 'cant_make_it';
  attendance_status: 'present' | 'absent' | null;
  enrolled_at: string;
  student_profiles?: { display_name: string; parent_user_id: string } | { display_name: string; parent_user_id: string }[];
};

type InviteRow = {
  id: string;
  invite_token: string;
  coach_user_id: string;
  class_id: string;
  class_title: string;
  sport_type: string | null;
  expires_at: string | null;
  created_at: string;
};

function mapInvite(row: InviteRow): ClassEnrollmentInvite {
  return {
    id: row.id,
    invite_token: row.invite_token,
    coach_user_id: row.coach_user_id,
    class_id: row.class_id,
    class_title: row.class_title,
    sport_type: (row.sport_type as SportType) ?? SportType.BADMINTON,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}

function studentName(row: EnrollmentRow): string {
  const profile = row.student_profiles;
  if (!profile) {
    return 'Student';
  }
  if (Array.isArray(profile)) {
    return profile[0]?.display_name ?? 'Student';
  }
  return profile.display_name;
}

function mapParentEnrollment(
  row: EnrollmentRow,
  studentNameValue: string,
  session?: { session_status: 'scheduled' | 'deferred' | 'cancelled'; effective_start: string } | null
): ParentClassEnrollment {
  return {
    id: row.id,
    student_profile_id: row.student_profile_id,
    student_name: studentNameValue,
    class_id: row.class_id ?? row.id,
    class_title: row.class_title,
    sport_type: (row.sport_type as SportType) ?? SportType.BADMINTON,
    start_time: session?.session_status === 'deferred' ? session.effective_start : row.enrolled_at,
    response_status: row.response_status,
    session_status: session?.session_status,
    effective_start_time: session?.effective_start,
  };
}

function mapRosterStudent(row: EnrollmentRow): ClassRosterStudent {
  return {
    id: row.id,
    display_name: studentName(row),
    status: row.response_status,
    guardian_name: undefined,
    attendance_status: row.attendance_status,
    enrollment_id: row.id,
  };
}

export async function getClassInviteByToken(token: string): Promise<ClassEnrollmentInvite | null> {
  if (!PARENT_PILOT_ENROLLMENT) {
    return null;
  }
  const { data, error } = await supabase
    .from('class_enrollment_invites')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error('This class invite has expired.');
  }
  return mapInvite(data as InviteRow);
}

export async function ensureClassInvite(
  coachUserId: string,
  classId: string,
  classTitle: string,
  sportType: SportType
): Promise<ClassEnrollmentInvite> {
  const { data: existing } = await supabase
    .from('class_enrollment_invites')
    .select('*')
    .eq('coach_user_id', coachUserId)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return mapInvite(existing as InviteRow);
  }

  const { data, error } = await supabase
    .from('class_enrollment_invites')
    .insert({
      coach_user_id: coachUserId,
      class_id: classId,
      class_title: classTitle,
      sport_type: sportType,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return mapInvite(data as InviteRow);
}

export async function shareClassEnrollmentInvite(invite: ClassEnrollmentInvite): Promise<void> {
  const url = buildClassEnrollmentInviteUrl(invite.invite_token);
  await Share.share({
    message: `Join ${invite.class_title} on Rally. Parents enroll a child here: ${url}`,
    url,
    title: `${invite.class_title} — parent enrollment`,
  });
}

export async function enrollStudentInClass(params: {
  parentUserId: string;
  studentProfileId: string;
  invite: ClassEnrollmentInvite;
}): Promise<ParentClassEnrollment> {
  if (!PARENT_PILOT_ENROLLMENT) {
    throw new Error('Parent enrollment is not enabled.');
  }

  const { data, error } = await supabase.rpc('enroll_student_in_class', {
    p_student_profile_id: params.studentProfileId,
    p_coach_user_id: params.invite.coach_user_id,
    p_class_id: params.invite.class_id,
    p_class_title: params.invite.class_title,
    p_sport_type: params.invite.sport_type,
  });

  if (error) {
    throw new Error(error.message || 'Could not enroll this student.');
  }

  const studentNameValue =
    (
      await supabase
        .from('student_profiles')
        .select('display_name')
        .eq('id', params.studentProfileId)
        .maybeSingle()
    ).data?.display_name ?? 'Student';

  return mapParentEnrollment(data as EnrollmentRow, studentNameValue);
}

export async function listParentEnrollmentsFromDb(
  parentUserId: string
): Promise<ParentClassEnrollment[]> {
  if (!PARENT_PILOT_ENROLLMENT) {
    return [];
  }
  const { data: profiles, error: profileError } = await supabase
    .from('student_profiles')
    .select('id, display_name')
    .eq('parent_user_id', parentUserId)
    .eq('status', 'active');
  if (profileError) {
    throw profileError;
  }
  const profileIds = (profiles ?? []).map((row) => row.id);
  if (profileIds.length === 0) {
    return [];
  }
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.display_name as string]));

  const { data, error } = await supabase
    .from('student_enrollments')
    .select('*')
    .in('student_profile_id', profileIds)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });
  if (error) {
    throw error;
  }

  const sessionByClass = new Map<string, { session_status: 'scheduled' | 'deferred' | 'cancelled'; effective_start: string }>();
  if (COACH_CLASS_OPERATIONS && (data ?? []).length > 0) {
    const classIds = [...new Set((data ?? []).map((row) => row.class_id as string).filter(Boolean))];
    if (classIds.length > 0) {
      const { data: states } = await supabase
        .from('coach_class_session_state')
        .select('class_id, session_status, effective_start')
        .in('class_id', classIds);
      for (const state of states ?? []) {
        sessionByClass.set(state.class_id as string, {
          session_status: state.session_status as 'scheduled' | 'deferred' | 'cancelled',
          effective_start: state.effective_start as string,
        });
      }
    }
  }

  return (data ?? []).map((row) =>
    mapParentEnrollment(
      row as EnrollmentRow,
      nameById.get(row.student_profile_id) ?? 'Student',
      row.class_id ? sessionByClass.get(row.class_id as string) ?? null : null
    )
  );
}

export async function listClassRosterFromDb(
  coachUserId: string,
  classId: string
): Promise<ClassRosterStudent[]> {
  if (!PARENT_PILOT_ENROLLMENT) {
    return [];
  }
  const { data: enrollments, error } = await supabase
    .from('student_enrollments')
    .select('*')
    .eq('coach_user_id', coachUserId)
    .eq('class_id', classId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: true });
  if (error) {
    throw error;
  }
  if (!enrollments?.length) {
    return [];
  }

  const profileIds = enrollments.map((row) => row.student_profile_id);
  const { data: profiles, error: profileError } = await supabase
    .from('student_profiles')
    .select('id, display_name')
    .in('id', profileIds);
  if (profileError) {
    throw profileError;
  }
  const nameById = new Map((profiles ?? []).map((row) => [row.id, row.display_name as string]));

  return enrollments.map((row) =>
    mapRosterStudent({
      ...(row as EnrollmentRow),
      student_profiles: { display_name: nameById.get(row.student_profile_id) ?? 'Student' },
    })
  );
}

export async function markEnrollmentAttendance(
  coachUserId: string,
  enrollmentId: string,
  attendance: 'present' | 'absent'
): Promise<void> {
  const { error } = await supabase
    .from('student_enrollments')
    .update({ attendance_status: attendance })
    .eq('id', enrollmentId)
    .eq('coach_user_id', coachUserId);
  if (error) {
    throw error;
  }
}

export async function endEnrollment(parentUserId: string, enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_enrollments')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .in(
      'student_profile_id',
      (
        await supabase
          .from('student_profiles')
          .select('id')
          .eq('parent_user_id', parentUserId)
      ).data?.map((row) => row.id) ?? []
    );
  if (error) {
    throw error;
  }
}
