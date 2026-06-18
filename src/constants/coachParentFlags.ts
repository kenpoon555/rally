/** Coach / parent foundation feature flags — default off for GTM 1. */

import { readEnvOptional } from './config';

const envOn = (key: string): boolean => {
  const fromProcess = typeof process.env[key] === 'string' && process.env[key] === 'true';
  const fromConfig = readEnvOptional(key) === 'true';
  return fromProcess || fromConfig;
};

const foundationBundle = (): boolean => envOn('EXPO_PUBLIC_ENABLE_COACH_FOUNDATION');

export const COACH_CLASSES_DISCOVER =
  envOn('EXPO_PUBLIC_COACH_CLASSES_DISCOVER') || foundationBundle();

export const PARENT_FAMILY_UI =
  envOn('EXPO_PUBLIC_PARENT_FAMILY_UI') || foundationBundle();

export const COACH_DASHBOARD =
  envOn('EXPO_PUBLIC_COACH_DASHBOARD') || foundationBundle();

export const CLASS_INBOX_ANNOUNCE =
  envOn('EXPO_PUBLIC_CLASS_INBOX_ANNOUNCE') || foundationBundle();

export function isCoachParentFoundationActive(): boolean {
  return COACH_CLASSES_DISCOVER || PARENT_FAMILY_UI || COACH_DASHBOARD || CLASS_INBOX_ANNOUNCE;
}
