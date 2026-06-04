/**
 * User-facing product language (Track A / A1 signed off).
 * Internal code may still use crew_group, regular_group, join_crew_game.
 */
export const PRODUCT_COPY = {
  /** One persistent group */
  rally: 'Rally',
  rallies: 'Rallies',
  yourRallies: 'Your Rallies',
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
  gameCard: 'Game card',
  gameRoomCoordinateHint: "Say hi here — tap I'm in when you can make it.",
  publicGame: 'Looking for a game',
  publicGameShort: 'Public game',
  rallyGame: 'Game for this Rally',
  gameSession: 'Game',
  joinGame: 'Join game',
  imIn: "I'm in",
  imInConfirm: "You're in ✓",
  undoImIn: 'Not in',
  undoImInTitle: "Undo I'm in?",
  undoImInBody:
    'You are no longer committed for this session. Tap I\'m in again anytime before the host locks the roster.',
  leaveBeforeLockTitle: 'Leave game?',
  leaveBeforeLockBody:
    'You will leave the roster. No reliability impact until the host locks the roster. You can re-join if spots open.',
  leaveBeforeLockCommittedBody:
    'You will leave the roster and clear your I\'m in. No reliability impact until the host locks the roster.',
  afterLockCantLeave:
    'Roster is locked. Message the host in chat if you cannot make it. Reliability is set at post-game attendance.',
  backToChats: 'Back to chats',
  postLockRoomHint:
    'Roster is locked — chat stays open for coordination. Need a sub? Ask in chat; host can note attendance after the game.',
  archivedRoomHint:
    'This game chat is archived (48h after play). Open it from My Games → Past or the game card.',
  viewArchivedChat: 'View archived chat',
  lockRoster: 'Lock roster',
  rosterLocked: 'Roster locked',
  gameFull: 'Full',
  joinWaitlist: 'Join waitlist',
  onWaitlist: 'On waitlist',
  onWaitlistHint: "We'll notify you in Chats if a spot opens. You can keep browsing other games.",
  waitlistSectionTitle: 'Waitlist',
  addFriends: 'Add friends',
  addFriendsHint: 'Find players by username to message and fill games faster',

  /** Game room exit */
  exitGameRoom: 'Exit',
  leaveGame: 'Leave game',
  hostExitTitle: 'Exit game room?',
  hostExitTransferBody: (username: string) =>
    `Host will pass to @${username} (I'm in first, then join order). You will leave this game.`,
  hostExitCancelBody:
    'No other players on the roster. The game will be cancelled.',
  hostExitDoneTransfer: (username: string) => `Host passed to @${username}.`,
  hostExitDoneCancel: 'Game cancelled — no other players were on the roster.',
  nextHostBadge: 'Next host',
  feedbackTitle: 'Beta feedback',
  feedbackHint:
    'Short notes help us fix bugs and shape Rally. When we launch v1, we plan to grant Founding Member access to at least two especially helpful beta contributors (extended Plus, host perks, or badges — not every note qualifies).',
  feedbackPlaceholder: 'What worked? What confused you? What should we build next?',
  feedbackThanks: 'Thanks — we read every note.',
  feedbackSubmit: 'Send feedback',

  /** Save group from a game */
  saveAsRally: 'Save as a Rally?',
  saveAsRallyAction: 'Save as a Rally',
  rallySaved: 'Rally saved',
  rallyLabel: (name: string) => `Rally: ${name}`,

  /** Home / discover */
  homeExplorerSubtitle: 'Find a game in LA, host one, or start a Rally.',
  homeRegularSubtitle: 'Next up, your Rallies, and active game rooms.',
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
