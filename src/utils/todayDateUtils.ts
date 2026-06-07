/** Monday-first week strip helpers for the Today tab. */

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toLocalDayDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Seven days starting Monday of the week containing `anchor`. */
export function getWeekStripDays(anchor: Date = new Date()): Date[] {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(anchor.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return next;
  });
}

export function weekdayLetter(date: Date): string {
  const day = date.getDay();
  const index = day === 0 ? 6 : day - 1;
  return WEEKDAY_LETTERS[index];
}

export function activityOnCalendarDay(
  startTime: string | null | undefined,
  day: Date
): boolean {
  if (!startTime) {
    return false;
  }
  return isSameCalendarDay(new Date(startTime), day);
}
