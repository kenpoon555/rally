import { supabase } from './api/supabase';
import {
  canShowGuardianAttestation,
  GUARDIAN_ATTESTATION_COPY,
  GUARDIAN_CONSENT_POLICY_VERSION,
} from '../constants/guardianConsent';

export async function hasActiveGuardianConsent(parentUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from('guardian_consents')
    .select('id')
    .eq('parent_user_id', parentUserId)
    .eq('policy_version', GUARDIAN_CONSENT_POLICY_VERSION)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function recordGuardianConsent(parentUserId: string): Promise<void> {
  if (!canShowGuardianAttestation() || !GUARDIAN_ATTESTATION_COPY) {
    throw new Error('Guardian attestation copy is not approved for production.');
  }

  const { error } = await supabase.from('guardian_consents').insert({
    parent_user_id: parentUserId,
    policy_version: GUARDIAN_CONSENT_POLICY_VERSION,
    attested_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function revokeGuardianConsentsForStudent(
  parentUserId: string,
  studentProfileId: string
): Promise<void> {
  const { error } = await supabase
    .from('guardian_consents')
    .update({ revoked_at: new Date().toISOString() })
    .eq('parent_user_id', parentUserId)
    .eq('student_profile_id', studentProfileId)
    .is('revoked_at', null);
  if (error) {
    throw error;
  }
}
