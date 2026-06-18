export const ROUTES = {
  AUTH: {
    WELCOME: 'Welcome',
    AGE_GATE: 'AgeGate',
    UNDER_13_BLOCKED: 'Under13Blocked',
    LOGIN: 'Login',
    SIGNUP: 'Signup',
  },
  HOME: {
    DYNAMIC: 'DynamicHome',
    MAIN: 'Home',
    MAP: 'Map',
  },
  HOST: {
    TAB: 'Host',
  },
  ACTIVITY: {
    DETAIL: 'ActivityDetail',
    CREATE: 'CreateActivity',
    POST_GAME_ATTENDANCE: 'PostGameAttendance',
  },
  REGULAR_GROUP: {
    CREW: 'RegularsCrew',
  },
  FRIENDS: {
    LIST: 'Friends',
  },
  PROFILE: {
    MAIN: 'Profile',
  },
  MY_GAMES: {
    TAB: 'MyGames',
  },
  CHAT: {
    TAB: 'Chats',
    LIST: 'ChatList',
    THREAD: 'ChatThread',
  },
  TOURNAMENT: {
    MINI: 'MiniTournament',
  },
  ADMIN: {
    MAIN: 'Admin',
  },
  FEEDBACK: {
    BETA: 'BetaFeedback',
  },
  LANDING: {
    SPORT: 'SportLanding',
  },
  COACH_PARENT: {
    FAMILY_PROFILES: 'FamilyProfiles',
    ADD_CHILD_PROFILE: 'AddChildProfile',
    GUARDIAN_CONSENT: 'GuardianConsent',
    CLASS_DETAIL: 'ClassDetail',
    CHILD_PICKER: 'ChildProfilePicker',
    COACH_PROFILE: 'CoachProfile',
    PARENT_CLASS_INVITE: 'ParentClassInvite',
    ENROLLMENT_CONFIRMATION: 'EnrollmentConfirmation',
  },
} as const;
