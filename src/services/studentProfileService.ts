import { supabase } from './api/supabase';
import { STUDENT_PROFILES } from '../constants/parentStudentFlags';
import {
  canShowGuardianAttestation,
  GUARDIAN_CONSENT_POLICY_VERSION,
} from '../constants/guardianConsent';
import { canCreateStudentProfiles, AgeCategory } from '../types/ageCategory';
import { StudentProfile } from '../types/coachParent';

const MAX_ACTIVE_STUDENT_PROFILES = 5;

type StudentProfileRow = {
  id: string;
  parent_user_id: string;
  display_name: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
};

function mapRow(row: StudentProfileRow, summary = 'No active class'): StudentProfile {
  return {
    id: row.id,
    parent_user_id: row.parent_user_id,
    display_name: row.display_name,
    active_class_summary: summary,
    status: row.status,
  };
}

async function enrollmentSummary(studentId: string): Promise<string> {
  const { data } = await supabase
    .from('student_enrollments')
    .select('class_title, status')
    .eq('student_profile_id', studentId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.class_title) {
    return 'No active class';
  }
  return data.class_title;
}

export async function listStudentProfilesForParent(
  parentUserId: string
): Promise<StudentProfile[]> {
  if (!STUDENT_PROFILES) {
    return [];
  }
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('parent_user_id', parentUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (error) {
    throw error;
  }
  const rows = (data ?? []) as StudentProfileRow[];
  return Promise.all(
    rows.map(async (row) => mapRow(row, await enrollmentSummary(row.id)))
  );
}

export async function countActiveStudentProfiles(parentUserId: string): Promise<number> {
  const { count, error } = await supabase
    .from('student_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('parent_user_id', parentUserId)
    .eq('status', 'active');
  if (error) {
    throw error;
  }
  return count ?? 0;
}

export async function createStudentProfile(
  parentUserId: string,
  displayName: string,
  ageCategory: AgeCategory | null | undefined
): Promise<StudentProfile> {
  if (!STUDENT_PROFILES) {
    throw new Error('Student profiles are not enabled.');
  }
  if (!canCreateStudentProfiles(ageCategory)) {
    throw new Error('Only adults 18+ can create student profiles.');
  }
  if (!canShowGuardianAttestation()) {
    throw new Error('Guardian consent is pending legal review.');
  }

  const activeCount = await countActiveStudentProfiles(parentUserId);
  if (activeCount >= MAX_ACTIVE_STUDENT_PROFILES) {
    throw new Error(
      `You can have up to ${MAX_ACTIVE_STUDENT_PROFILES} active student profiles. Archive one to add another.`
    );
  }

  const trimmed = displayName.trim();
  if (!trimmed) {
    throw new Error('Enter a display name.');
  }

  const { data: consent } = await supabase
    .from('guardian_consents')
    .select('id')
    .eq('parent_user_id', parentUserId)
    .eq('policy_version', GUARDIAN_CONSENT_POLICY_VERSION)
    .is('revoked_at', null)
    .is('student_profile_id', null)
    .order('attested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!consent?.id) {
    throw new Error('Guardian consent is required before creating a student profile.');
  }

  const { data, error } = await supabase
    .from('student_profiles')
    .insert({
      parent_user_id: parentUserId,
      display_name: trimmed,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from('guardian_consents')
    .update({ student_profile_id: data.id })
    .eq('id', consent.id);

  return mapRow(data as StudentProfileRow);
}

export async function archiveStudentProfile(
  parentUserId: string,
  studentProfileId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_profiles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', studentProfileId)
    .eq('parent_user_id', parentUserId);
  if (error) {
    throw error;
  }

  await supabase
    .from('student_enrollments')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('student_profile_id', studentProfileId);
}

export { MAX_ACTIVE_STUDENT_PROFILES };
