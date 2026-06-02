/** In-app copy for the LA closed beta — keep in sync with VISION.md / open_items.md */
export const BETA_COPY = {
  marketLabel: 'LA Beta',
  headline: 'Rally Beta is focused on LA badminton and pickleball.',
  body: 'Want to host games, test Rally with your group, or bring Rally to your city?',
  contactCta: 'Contact us',
  contactEmail: 'kunyupoon495@gmail.com',
} as const;

export const FOUNDER_BENEFITS_COPY =
  'Active beta testers, hosts, and city partners may receive Founding Member benefits after launch.';

export function buildBetaContactMailto(): string {
  const subject = encodeURIComponent('Rally beta — host / partner interest');
  const body = encodeURIComponent(
    'Hi Rally team,\n\nI am interested in:\n- [ ] Hosting games in LA\n- [ ] Testing with my crew\n- [ ] Bringing Rally to my city\n\n'
  );
  return `mailto:${BETA_COPY.contactEmail}?subject=${subject}&body=${body}`;
}
