import { MyGameEntry, UserAttendanceStats } from '../services/activityService';
import { PLAY_TAB_SPORT_ORDER, SportType } from '../constants/sports';

export type ProfileScorecardStats = {
  games: number;
  going: number;
  attendanceLabel: string;
};

export function formatRallyMemberSince(createdAt?: string | null): string | null {
  if (!createdAt) {
    return null;
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Sports played, most frequent first; ties follow Play tab order. Falls back to preferred sports. */
export function orderSportsAttended(
  games: MyGameEntry[],
  preferredSports: string[] = []
): string[] {
  const counts = new Map<string, number>();
  for (const entry of games) {
    if (entry.role === 'waitlisted') {
      continue;
    }
    const sport = entry.activity.sport_type?.trim();
    if (!sport) {
      continue;
    }
    counts.set(sport, (counts.get(sport) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return preferredSports.filter(Boolean);
  }

  const orderIndex = new Map(PLAY_TAB_SPORT_ORDER.map((sport, index) => [sport, index]));
  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return (
        (orderIndex.get(a[0] as SportType) ?? 999) - (orderIndex.get(b[0] as SportType) ?? 999)
      );
    })
    .map(([sport]) => sport);
}

export function countProfileGames(games: MyGameEntry[]): number {
  const seen = new Set<string>();
  for (const entry of games) {
    if (entry.role === 'waitlisted') {
      continue;
    }
    seen.add(entry.activity.id);
  }
  return seen.size;
}

export function buildProfileScorecardStats(
  games: MyGameEntry[],
  attendance: UserAttendanceStats | null
): ProfileScorecardStats {
  const going = attendance?.committed_sessions ?? 0;
  const attendanceLabel =
    attendance?.reliability_pct != null
      ? `${Math.round(attendance.reliability_pct)}%`
      : going > 0
        ? '—'
        : 'New';

  return {
    games: countProfileGames(games),
    going,
    attendanceLabel,
  };
}
