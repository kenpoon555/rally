import AsyncStorage from '@react-native-async-storage/async-storage';

/** Lightweight one-time onboarding flags for the badminton host wedge (Phase 5). */
export const ONBOARDING_FLAGS = {
  HOST_ONBOARDING_COMPLETED: 'host_onboarding_completed',
  COACH_SHARE_SHOWN: 'coach_share_shown',
  COACH_RECURRING_SHOWN: 'coach_recurring_shown',
  COACH_REGULARS_SHOWN: 'coach_regulars_shown',
  PLAY_INTENT: 'onboarding_play_intent',
  SKILL_LEVEL: 'onboarding_skill_level',
} as const;

export type OnboardingFlag = (typeof ONBOARDING_FLAGS)[keyof typeof ONBOARDING_FLAGS];

export async function isOnboardingFlagSet(flag: OnboardingFlag): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(flag)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingFlag(flag: OnboardingFlag): Promise<void> {
  try {
    await AsyncStorage.setItem(flag, 'true');
  } catch {
    // Non-critical: a coach mark may show again if persistence fails.
  }
}

export async function setOnboardingPreference(flag: OnboardingFlag, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(flag, value);
  } catch {
    // Non-critical preference sync.
  }
}

export async function getOnboardingPreference(flag: OnboardingFlag): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(flag);
  } catch {
    return null;
  }
}
