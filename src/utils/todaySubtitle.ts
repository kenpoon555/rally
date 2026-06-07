import { MyGameEntry } from '../services/activityService';
import { PRODUCT_COPY } from '../constants/productCopy';
import type { HostRosterToLock } from '../hooks/useHomeDashboard';
function formatNextUpTime(startTime: string): string {
  return new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

type TodaySubtitleInput = {
  needsCommitmentGames: MyGameEntry[];
  rosterToLock: HostRosterToLock | null;
  nextGame: MyGameEntry | null;
  activeGameCount: number;
  rallyInviteCount: number;
  isExplorerEmpty: boolean;
};

/** Single contextual line under the Today tab title. */
export function getTodaySubtitle(input: TodaySubtitleInput): string {
  const {
    needsCommitmentGames,
    rosterToLock,
    nextGame,
    activeGameCount,
    rallyInviteCount,
    isExplorerEmpty,
  } = input;

  if (needsCommitmentGames.length > 0) {
    return PRODUCT_COPY.todaySubtitleNeedsConfirm(needsCommitmentGames.length);
  }

  if (rosterToLock?.readiness === 'ready') {
    return PRODUCT_COPY.todaySubtitleHostLockReady;
  }

  if (nextGame) {
    const venue = nextGame.activity.location?.name ?? 'Court TBD';
    const time = formatNextUpTime(nextGame.activity.start_time);
    return PRODUCT_COPY.todaySubtitleNextUp(venue, time);
  }

  if (rallyInviteCount > 0) {
    return PRODUCT_COPY.todaySubtitleRallyInvite(rallyInviteCount);
  }

  if (activeGameCount > 0) {
    return PRODUCT_COPY.todaySubtitleGamesToday(activeGameCount);
  }

  if (isExplorerEmpty) {
    return PRODUCT_COPY.todaySubtitleNew;
  }

  return PRODUCT_COPY.todaySubtitleQuiet;
}
