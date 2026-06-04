/**
 * @format
 */

import { AppRegistry } from 'react-native';

// Initialize Firebase before anything else
// Note: Firebase is auto-initialized from GoogleService-Info.plist (iOS) 
// and google-services.json (Android) on the native side
import firebaseApp from '@react-native-firebase/app';
import { registerBackgroundNotificationHandler } from './src/services/notificationService';

// Ensure Firebase is initialized
if (!firebaseApp.apps.length) {
  console.warn('Firebase not initialized. Make sure GoogleService-Info.plist (iOS) and google-services.json (Android) are configured.');
} else {
  registerBackgroundNotificationHandler();
}

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
