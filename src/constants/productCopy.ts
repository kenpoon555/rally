/**
 * User-facing product language (Track A / A1 signed off).
 * Internal code may still use crew_group, regular_group, join_crew_game.
 */
export const PRODUCT_COPY = {
  /** One persistent group */
  rally: 'Rally',
  rallies: 'Rallies',
  yourRallies: 'Your Rallies',
  todayGames: "Today's games",
  noMoreGamesToday: 'No more games today',
  findOnPlay: 'Find on Play →',
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
  editGameScheduleTitle: 'Change time or court',
  editGameScheduleHint:
    'Available until someone joins or taps I\'m in. Updates post to game chat.',
  changeGameTime: 'Change start time',
  changeGameCourt: 'Court',
  gameScheduleChangePosted: 'Your crew will see this in chat.',
  gameCardBackHint: 'Swipe down or tap back to return to the game room.',
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
  nudgeRoster: 'Nudge',
  nudgeRosterSent: 'Reminder sent',
  nudgeRosterHint: 'Host is locking roster — tap I\'m in.',
  needPlayers: 'Need players',
  needPlayersHint: 'Hosts posting open spots in LA — request to join, then tap I\'m in.',
  playGamesHint: 'Find games · fill open spots nearby',
  playOpenGamesSection: 'Open games near you',
  playLockedWelcomingSection: 'Locked · still welcoming',
  playLockedWelcomingHint: 'Roster locked — spots still open',
  playPlayersNearbySection: 'Players nearby',
  playPlayersNearbyHint: 'Free to play in the next few hours',
  playRecruitingTitle: 'Recruiting now',
  playRecruitingHint: 'Request a spot — host accepts, then tap I\'m in the game room.',
  playPlayersHint: 'Players posting when they can play — hosts invite them to fill open spots.',
  postOpenSpots: 'Post on Need Players',
  postOpenSpotsDone: 'Posted on Need Players',
  partnerRally: 'Partner Rally',
  captainProgram: 'Sport captain program',
  captainProgramHint:
    'Help grow your sport in LA. Partner perks go to your whole Rally — you get the badge and a direct line to us.',
  captainApplicationSent: 'Application sent',
  freeAgents: 'Free agents',
  freeAgentsHint: 'Players posting when they can play — hosts can invite them to open games.',
  postAvailability: 'Post availability',
  availabilityPosted: 'You are on the board',
  freeAgentInviteSent: 'Invite sent',
  sportLandingShare: 'Share sport page',
  partnerVenues: 'Partner venues',
  partnerVenuesFilter: 'At partner courts',
  scheduleFirstSession: 'Schedule first session',
  scheduleFirstSessionHint:
    'Host the first game so your Rally can join, tap I\'m in, and lock the roster.',
  introSessions: 'Intro nights',
  findPlayers: 'Find players',
  findPlayersHint: 'Invite free agents and active seekers to fill open spots.',
  concierge: 'Need help finding a game?',
  conciergeHint: 'Tell us your sport and schedule — we will match you manually in beta.',
  conciergeSent: 'Request received',
  captainFeedback: 'Captain feedback',
  captainFeedbackHint: 'Friction on host tools, rotation, or onboarding — we ship from this backlog.',
  captainFeedbackSent: 'Feedback sent — thank you',
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
  homeExplorerSubtitle: 'Open games nearby. Recruiting posts are hosts actively looking for players.',
  discoverEmptyTitle: (sport: string) => `No ${sport.toLowerCase()} games nearby`,
  discoverEmptyBody:
    'LA beta is strongest for badminton, pickleball, and basketball. Host a game to get on the board — then invite your crew from the Rally.',
  discoverEmptyStepHost: 'Host a game',
  discoverEmptyStepInvite: 'After you host, open your Rally to invite friends to that game.',
  discoverEmptyOpenRally: 'Open your Rally',
  discoverEmptyTrySport: 'Try a beta sport using the filters above.',
  homeRegularSubtitle: 'Next up, your Rallies, and active game rooms.',
  /** Today tab — one-line status under the title */
  todaySubtitleNeedsConfirm: (count: number) =>
    count === 1
      ? '1 game needs your confirmation'
      : `${count} games need your confirmation`,
  todaySubtitleHostLockReady: 'Ready to lock your roster',
  todaySubtitleNextUp: (venue: string, time: string) => `Next up · ${venue} · ${time}`,
  todaySubtitleGamesToday: (count: number) =>
    count === 1 ? '1 game on your calendar' : `${count} games on your calendar`,
  todaySubtitleRallyInvite: (count: number) =>
    count === 1 ? 'You have a Rally invite' : `You have ${count} Rally invites`,
  todaySubtitleQuiet: 'Quiet day — browse open games on Play',
  todaySubtitleNew: 'Join a game or start a Rally',
  needsImInHint: 'Confirm on the game card below',
  confirmPlayingTitle: "Confirm you're playing",
  confirmPlayingBody:
    "Your Rally game is coming up. Open Chats and tap I'm in on the game card.",
  shareRallyInviteHint: 'Invite friends who are already on Rally — they get a tap-to-join invite.',
  shareRallyInviteLink: 'Share link instead',
  inviteFriendsToRally: 'Invite friends',
  inviteFriendsToRallyEmpty: 'Add friends on your Profile first, then invite them here.',
  inviteFriendsToGame: 'Invite friends',
  inviteFriendsToGameHint: 'Friends get a tap-to-join invite for this game.',
  inviteFriendsToGameRallyHint:
    'Invites them to this game only — not your whole Rally.',
  shareGameInviteLink: 'Share link instead',
  shareGameInviteLinkRally: 'Share link for this game',
  gameFriendOnRoster: 'On roster',
  rallyInviteSent: 'Invited',
  rallyInviteInCrew: 'In Rally',
  bringRallyCta: 'Bring Rally to your group',
  guest: 'Guest',

  /** Host home — lock roster CTA */
  hostLockReady: 'Ready to lock roster',
  hostLockWaitingImIn: (ready: number, roster: number) =>
    `Waiting on confirmations · ${ready}/${roster} ready`,
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
