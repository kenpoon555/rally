/** Parent/student core (v1.2) — default off until legal + product gates clear. */

import { readEnvOptional } from './config';

const envOn = (key: string): boolean => {
  const fromProcess = typeof process.env[key] === 'string' && process.env[key] === 'true';
  const fromConfig = readEnvOptional(key) === 'true';
  return fromProcess || fromConfig;
};

const parentStudentBundle = (): boolean => envOn('EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE');

export const AGE_GATE_ONBOARDING =
  envOn('EXPO_PUBLIC_AGE_GATE_ONBOARDING') || parentStudentBundle();

export const STUDENT_PROFILES =
  envOn('EXPO_PUBLIC_STUDENT_PROFILES') || parentStudentBundle();

export const GUARDIAN_CONSENT_FLOW =
  envOn('EXPO_PUBLIC_GUARDIAN_CONSENT') || parentStudentBundle();

const parentPilotBundle = (): boolean => envOn('EXPO_PUBLIC_ENABLE_PARENT_PILOT');

export const PARENT_PILOT_ENROLLMENT =
  envOn('EXPO_PUBLIC_PARENT_PILOT_ENROLLMENT') || parentPilotBundle();

export const COACH_MINOR_ROSTER =
  envOn('EXPO_PUBLIC_COACH_MINOR_ROSTER') || parentPilotBundle();

export function isParentStudentCoreActive(): boolean {
  return AGE_GATE_ONBOARDING || STUDENT_PROFILES || GUARDIAN_CONSENT_FLOW;
}

export function isParentPilotActive(): boolean {
  return PARENT_PILOT_ENROLLMENT || COACH_MINOR_ROSTER;
}
