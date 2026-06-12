/** User-facing product name and taglines — keep copy consistent across auth, empty states, and store listings. */

export const APP_NAME = 'Rally';

/** Primary tagline — welcome, login card, store listings. */
export const APP_TAGLINE = 'Play more. Together.';

/** Auth welcome carousel — slide 1 matches designer onboarding. */
export const WELCOME_SLIDES = [
  {
    title: 'Play together',
    body: 'Find local games, fill open slots, meet sport lovers near you',
  },
  {
    title: 'Fill the court',
    body: 'Browse open games near you. Tap I\'m in when you can make it.',
  },
  {
    title: 'Find your crew',
    body: 'Start a Rally with friends or join one nearby — chat, play, show up.',
  },
] as const;
