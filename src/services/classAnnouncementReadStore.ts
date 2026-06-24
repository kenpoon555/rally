import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_KEY = 'rally_seen_class_announcement_ids';

async function readSeenIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export async function countUnreadClassAnnouncements(ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }
  const seen = await readSeenIds();
  return ids.filter((id) => !seen.has(id)).length;
}

export async function markClassAnnouncementsSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const seen = await readSeenIds();
  for (const id of ids) {
    seen.add(id);
  }
  const trimmed = [...seen].slice(-200);
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}
