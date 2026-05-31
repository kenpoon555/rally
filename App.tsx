import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { CONFIG } from './src/constants/config';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import type { NotificationPayload } from './src/services/notificationService';
import 'react-native-gesture-handler';

if (CONFIG.SENTRY_DSN) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 0 : 0.15,
  });
}

function handleForegroundNotification(notification: NotificationPayload): void {
  const title = notification.notification?.title || 'Rally';
  const body = notification.notification?.body || '';
  Alert.alert(title, body, [
    { text: 'Dismiss', style: 'cancel' },
    {
      text: 'Open',
      onPress: () => {
        const { navigateFromNotificationData } = require('./src/navigation/navigationRef');
        navigateFromNotificationData(notification.data);
      },
    },
  ]);
}

function handleNotificationOpened(notification: NotificationPayload): void {
  const { navigateFromNotificationData } = require('./src/navigation/navigationRef');
  navigateFromNotificationData(notification.data);
}

function AppContent(): React.JSX.Element {
  useEffect(() => {
    const { setupNotificationHandlers } = require('./src/services/notificationService');
    const cleanup = setupNotificationHandlers(
      handleForegroundNotification,
      handleNotificationOpened
    );
    return cleanup;
  }, []);

  return <AppNavigator />;
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default CONFIG.SENTRY_DSN ? Sentry.wrap(App) : App;
