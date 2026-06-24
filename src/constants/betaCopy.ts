/** LA market copy — production-safe (no beta / tester recruitment / closed-market wedge). */
export const MARKET_COPY = {
  regionLabel: 'Los Angeles',
  headline: 'Pickup sports and recurring crews near you.',
  body: 'Host games, invite your crew, and find players when you can play.',
  contactCta: 'Contact support',
  contactEmail: 'kunyupoon495@gmail.com',
  playEmptyFootnote: 'Try another sport using the filters above.',
  playEmptyRegion: '',
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
