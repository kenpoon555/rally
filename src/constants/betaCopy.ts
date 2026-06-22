/** LA market copy — production-safe (no “beta” / tester recruitment). */
export const MARKET_COPY = {
  regionLabel: 'Los Angeles',
  headline: 'Rally is available in Los Angeles for badminton, pickleball, and basketball.',
  body: 'Host games, invite your crew, or tell us about bringing Rally to your area.',
  contactCta: 'Contact support',
  contactEmail: 'kunyupoon495@gmail.com',
  playEmptyFootnote: 'Try another sport using the filters above.',
  playEmptyRegion: 'Rally is focused on LA badminton, pickleball, and basketball.',
} as const;

/** @deprecated Use MARKET_COPY — kept for import stability during migration */
export const BETA_COPY = MARKET_COPY;

export function buildSupportContactMailto(): string {
  const subject = encodeURIComponent('Rally — support');
  const body = encodeURIComponent(
    'Hi Rally team,\n\nI need help with:\n\n'
  );
  return `mailto:${MARKET_COPY.contactEmail}?subject=${subject}&body=${body}`;
}

/** @deprecated */
export const buildBetaContactMailto = buildSupportContactMailto;
