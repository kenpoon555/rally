import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_DEEP_LINK_KEY = 'rally_pending_deep_link_v1';

export async function storePendingDeepLink(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) {
    return;
  }
  await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, trimmed);
}

export async function consumePendingDeepLink(): Promise<string | null> {
  const value = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
  if (!value) {
    return null;
  }
  await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
  return value;
}

export async function peekPendingDeepLink(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
}
