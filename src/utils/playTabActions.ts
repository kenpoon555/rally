import { SessionCardPayload } from '../types/sessionCard';

/** True when the viewer should take action on an upcoming session (Join, I'm in, Lock, etc.). */
export function sessionNeedsViewerAction(card: SessionCardPayload): boolean {
  if (card.status !== 'active') {
    return false;
  }
  const viewer = card.viewer;
  if (!viewer.show_actions) {
    return false;
  }
  if (!viewer.is_on_roster && !viewer.is_waitlisted && !viewer.is_host) {
    return true;
  }
  if (viewer.is_on_roster && !viewer.is_ready && !viewer.is_finalized) {
    return true;
  }
  if (viewer.is_host && viewer.can_lock && viewer.lock_readiness === 'ready') {
    return true;
  }
  if (viewer.can_nudge) {
    return true;
  }
  return false;
}

export function countPlayTabActions(cards: SessionCardPayload[]): number {
  return cards.filter(sessionNeedsViewerAction).length;
}
