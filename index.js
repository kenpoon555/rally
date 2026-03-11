/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';

// #region agent log — earliest possible: detect if JS bundle runs at all; use emulator host on Android so ingest receives logs
const _debugHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const _debugUrl = `http://${_debugHost}:7244/ingest/6b58671e-eb23-45d8-a6fe-a7768139a3fc`;
const _debugPayload = (loc, msg, data = {}, hyp = 'H') => JSON.stringify({ sessionId: '3d9462', location: loc, message: msg, data, timestamp: Date.now(), hypothesisId: hyp });
fetch(_debugUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3d9462' }, body: _debugPayload('index.js:firstLine', 'Bundle started', { platform: Platform.OS }) }).catch(() => {});
// #endregion

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
// #region agent log
fetch(_debugUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3d9462' }, body: _debugPayload('index.js:postFirebase', 'After Firebase/notification init', { platform: Platform.OS }, 'H4') }).catch(() => {});
// #endregion

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
