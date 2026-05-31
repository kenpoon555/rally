/** Bump when terms change; users must re-accept if their stored version differs. */
export const TOS_VERSION = '2026-05-29';

export const TERMS_SUMMARY = `By using Rally you agree to play respectfully, follow local facility rules, and meet only in public sports venues when possible. Rally is a coordination tool — we do not guarantee player skill, attendance, or safety outcomes.`;

export const WAIVER_TEXT = `Activity & liability waiver (summary): You participate in sports activities arranged through Rally at your own risk. Rally and its operators are not responsible for injuries, property damage, disputes, or no-shows between players. You are responsible for your own health, insurance, and decisions to meet other users. Do not share exact home addresses in chat; use court names and public meetup points.`;

export const PRIVACY_LOCATION_TEXT = `Location privacy: Discover and the map show approximate distance and fuzzed pin positions until you are confirmed on a game (or are the host). Exact court names may appear after you join or when the host finalizes a flex game.`;

export const FULL_LEGAL_SECTIONS = [
  { title: 'Terms of use', body: TERMS_SUMMARY },
  { title: 'Activity waiver', body: WAIVER_TEXT },
  { title: 'Location & identity', body: PRIVACY_LOCATION_TEXT },
] as const;
