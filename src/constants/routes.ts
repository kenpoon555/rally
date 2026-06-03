export const ROUTES = {
  AUTH: {
    WELCOME: 'Welcome',
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
} as const;
