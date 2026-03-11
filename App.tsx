import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

function AppContent(): React.JSX.Element {
  useEffect(() => {
    if (Platform.OS === 'android') {
      return;
    }
    const { setupNotificationHandlers } = require('./src/services/notificationService');
    const cleanup = setupNotificationHandlers(
      (notification: { data?: Record<string, string>; notification?: { title?: string; body?: string } }) => {
        console.log('Foreground notification:', notification);
      },
      (notification: { data?: Record<string, string>; notification?: { title?: string; body?: string } }) => {
        console.log('Notification opened:', notification);
      }
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

export default App;
