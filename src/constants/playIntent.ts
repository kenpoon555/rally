export const PLAY_INTENTS = [
  { id: 'pickup', label: 'Pickup game' },
  { id: 'training_partner', label: 'Training partner' },
  { id: 'split_court', label: 'Split court cost' },
  { id: 'last_minute_fill', label: 'Last-minute fill' },
  { id: 'casual_only', label: 'Casual only' },
] as const;

export type PlayIntentId = (typeof PLAY_INTENTS)[number]['id'];

const LABEL_BY_ID = Object.fromEntries(PLAY_INTENTS.map((item) => [item.id, item.label])) as Record<
  PlayIntentId,
  string
>;

export function playIntentLabel(intent?: string | null): string | null {
  if (!intent) {
    return null;
  }
  return LABEL_BY_ID[intent as PlayIntentId] ?? null;
}

/** Primary line on Discover when host sets a headline. */
export function activityListingHeadline(activity: {
  listing_title?: string | null;
  sport_type: string;
  location?: { name?: string } | null;
}): string {
  const trimmed = activity.listing_title?.trim();
  if (trimmed) {
    return trimmed;
  }
  const court = activity.location?.name;
  return court ? `${activity.sport_type} · ${court}` : activity.sport_type;
}
