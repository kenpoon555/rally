/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-config', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  GOOGLE_PLACES_API_KEY: '',
  GOOGLE_PLACES_API_KEY_IOS: '',
  GOOGLE_PLACES_API_KEY_ANDROID: '',
  GEOFENCE_RADIUS: '50',
  LOCATION_UPDATE_INTERVAL: '10000',
  LOCATION_DISTANCE_FILTER: '50',
  SENTRY_DSN: '',
}));

jest.mock('@react-native-firebase/app', () => ({
  apps: [],
}));

jest.mock('@react-native-firebase/messaging', () => {
  const mock = () => ({
    requestPermission: jest.fn(async () => 1),
    getToken: jest.fn(async () => 'mock-token'),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(async () => null),
    setBackgroundMessageHandler: jest.fn(),
  });

  mock.AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };

  return {
    __esModule: true,
    default: mock,
  };
});

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (Component: unknown) => Component,
}));
