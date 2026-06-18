/**
 * Guardian attestation copy — DO NOT set production copy until lawyer approves
 * text in docs/contracts/flow-parent-guardian-consent.md (lawyer_copy_approved).
 */

export const GUARDIAN_CONSENT_POLICY_VERSION = 'guardian-v1-2026-06';

/** Must stay false until founder sets lawyer_copy_approved in the contract doc. */
export const GUARDIAN_LAWYER_COPY_APPROVED = false;

/**
 * Production attestation text. Null while legal review is pending.
 * Never paste draft contract copy here without lawyer sign-off.
 */
export const GUARDIAN_ATTESTATION_COPY: string | null = null;

export const GUARDIAN_CONSENT_PENDING_MESSAGE =
  'Guardian attestation is pending legal review. Student profiles cannot be created until counsel approves the consent text.';

export function canShowGuardianAttestation(): boolean {
  return GUARDIAN_LAWYER_COPY_APPROVED && Boolean(GUARDIAN_ATTESTATION_COPY?.trim());
}
