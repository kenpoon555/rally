/** Coach class operations (v1.4) — defer/cancel + parent notifications. */

import { readEnvOptional } from './config';

const envOn = (key: string): boolean => {
  const fromProcess = typeof process.env[key] === 'string' && process.env[key] === 'true';
  const fromConfig = readEnvOptional(key) === 'true';
  return fromProcess || fromConfig;
};

export const COACH_CLASS_OPERATIONS = envOn('EXPO_PUBLIC_ENABLE_COACH_OPS');

export function isCoachOpsActive(): boolean {
  return COACH_CLASS_OPERATIONS;
}
