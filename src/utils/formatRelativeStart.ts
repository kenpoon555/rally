/** Human-readable countdown until an activity start time. */
export function formatRelativeStart(startTime?: string | null): string {
  if (!startTime) {
    return 'Time TBD';
  }
  const diffMs = new Date(startTime).getTime() - Date.now();
  if (diffMs <= 0) {
    return 'Happening now';
  }
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) {
    return `In ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `In ${hours} hr${hours === 1 ? '' : 's'}`;
  }
  const days = Math.round(hours / 24);
  return `In ${days} day${days === 1 ? '' : 's'}`;
}
