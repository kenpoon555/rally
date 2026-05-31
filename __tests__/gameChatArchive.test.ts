import {
  getGameChatArchiveAtMs,
  isGameChatInPostGameGrace,
  isGameChatReadOnly,
} from '../src/utils/activityHelpers';
import { gameEndMs } from '../src/utils/activityExpiry';
import { GAME_CHAT_ARCHIVE_GRACE_MS } from '../src/constants/gameChat';

describe('game chat archive grace', () => {
  const base = {
    start_time: new Date(Date.now() - 3600000).toISOString(),
    duration: 60,
  };

  it('allows chat during post-game grace window', () => {
    expect(isGameChatReadOnly(base)).toBe(false);
    expect(isGameChatInPostGameGrace(base)).toBe(true);
  });

  it('archives after grace period from play end', () => {
    const start = new Date(Date.now() - GAME_CHAT_ARCHIVE_GRACE_MS - 7200000).toISOString();
    const activity = { start_time: start, duration: 60 };
    expect(isGameChatReadOnly(activity)).toBe(true);
    expect(isGameChatInPostGameGrace(activity)).toBe(false);
  });

  it('allows chat before play ends', () => {
    const upcoming = {
      start_time: new Date(Date.now() + 3600000).toISOString(),
      duration: 60,
    };
    expect(isGameChatReadOnly(upcoming)).toBe(false);
    expect(isGameChatInPostGameGrace(upcoming)).toBe(false);
  });

  it('archive timestamp is play end plus grace', () => {
    const activity = { start_time: '2026-06-01T18:00:00.000Z', duration: 90 };
    expect(getGameChatArchiveAtMs(activity)).toBe(
      gameEndMs(activity) + GAME_CHAT_ARCHIVE_GRACE_MS
    );
  });
});
