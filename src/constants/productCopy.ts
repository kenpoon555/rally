/**
 * User-facing product language (Track A / A1 signed off).
 * Internal code may still use crew_group, regular_group, join_crew_game.
 */
export const PRODUCT_COPY = {
  /** One persistent group */
  rally: 'Rally',
  rallys: 'Rallys',
  yourRallys: 'Your Rallys',
  startARally: 'Start a Rally',
  joinThisRally: 'Join this Rally',

  /** Chat */
  rallyChat: 'Rally chat',
  rallyChatTitle: (name: string) => `${name} chat`,
  openRallyChat: 'Open Rally chat',
  rallyChatEmpty:
    "Rally chat — say hi and tap I'm in on the game card when you can make it.",
  tapImInInRallyChat: "Tap I'm in in your Rally chat to confirm you're playing.",

  /** Games */
  publicGame: 'Looking for a game',
  publicGameShort: 'Public game',
  rallyGame: 'Game for this Rally',
  gameSession: 'Game',
  joinGame: 'Join game',
  imIn: "I'm in",
  imInConfirm: "You're in ✓",
  lockRoster: 'Lock roster',
  rosterLocked: 'Roster locked',

  /** Save group from a game */
  saveAsRally: 'Save as a Rally?',
  saveAsRallyAction: 'Save as a Rally',
  rallySaved: 'Rally saved',
  rallyLabel: (name: string) => `Rally: ${name}`,

  /** Home / discover */
  homeExplorerSubtitle: 'Find a game in LA, host one, or start a Rally.',
  homeRegularSubtitle: 'Next up, your Rallys, and active game rooms.',
  needsImInHint: "Rally game — tap I'm in in Chats",
  confirmPlayingTitle: "Confirm you're playing",
  confirmPlayingBody:
    "Your Rally game is coming up. Open Chats and tap I'm in on the game card.",
  shareRallyLink: 'Share Rally link',
  bringRallyCta: 'Bring Rally to your group',
  guest: 'Guest',

  /** Host home — lock roster CTA */
  hostLockReady: 'Ready to lock roster',
  hostLockWaitingImIn: (ready: number, roster: number) =>
    `Waiting on I'm in · ${ready}/${roster} ready`,
  hostLockNeedsPlayers: (roster: number, target: number) =>
    `${roster}/${target} on roster · need more players or I'm in`,
  hostLockTapToOpen: 'Tap to open Game Room and lock roster',

  /** Glossary (COPY-01 — tooltips / future FAQ) */
  glossary: {
    join:
      'Join claims a spot on the roster. Tap I\'m in when you commit to showing up.',
    imIn:
      'I\'m in means you commit to showing up if you are on the final roster after lock.',
    lockRoster:
      'Lock roster finalizes who is playing. Reliability counts only after lock.',
    publicGame:
      'A one-off game open to discovery — find players, then play.',
    rallyGame:
      'A scheduled game for members of your Rally (and invited guests).',
  },
} as const;
