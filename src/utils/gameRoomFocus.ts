/** Activity id when user is on that game's room chat (suppress redundant join alerts). */
let focusedGameRoomActivityId: string | null = null;

export function setFocusedGameRoomActivityId(activityId: string | null): void {
  focusedGameRoomActivityId = activityId;
}

export function isFocusedGameRoomActivity(activityId: string): boolean {
  return focusedGameRoomActivityId === activityId;
}
