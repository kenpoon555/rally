import firebaseApp from '@react-native-firebase/app';
import { PermissionsAndroid, Platform } from 'react-native';
import { supabase } from './api/supabase';

// Lazy load messaging to avoid errors if Firebase isn't configured
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('Firebase Messaging not available:', error);
}

/**
 * Check if Firebase is initialized
 */
const isFirebaseInitialized = (): boolean => {
  try {
    return firebaseApp.apps.length > 0 && messaging !== null;
  } catch {
    return false;
  }
};

export interface NotificationPayload {
  data?: Record<string, string>;
  notification?: {
    title?: string;
    body?: string;
  };
}

const isAndroid13OrAbove = (): boolean =>
  Platform.OS === 'android' && Number(Platform.Version) >= 33;

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isFirebaseInitialized()) {
    console.warn('Firebase not initialized. Cannot request notification permission.');
    return false;
  }

  if (Platform.OS === 'ios') {
    try {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  if (!isAndroid13OrAbove()) {
    return true;
  }

  try {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (alreadyGranted) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting Android notification permission:', error);
    return false;
  }
};

function isExpectedPushTokenFailure(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    message.includes('simulator') ||
    message.includes('unregistered') ||
    message.includes('apns') ||
    message.includes('entitlement') ||
    message.includes('messaging/') ||
    message.includes('not registered')
  );
}

/**
 * Get device token (FCM). Returns null on simulator / missing APNs — not a fatal app error.
 */
export const getDeviceToken = async (): Promise<string | null> => {
  if (!isFirebaseInitialized()) {
    if (__DEV__) {
      console.warn('Firebase not initialized. Push token skipped.');
    }
    return null;
  }

  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    // console.error triggers a red LogBox toast; simulator lacks APNs/FCM.
    if (__DEV__ && isExpectedPushTokenFailure(error)) {
      console.warn(
        'Push token unavailable (normal on iOS Simulator). Use a physical device for push testing.'
      );
    } else if (__DEV__) {
      console.warn('Failed to get device token:', error);
    }
    return null;
  }
};

/**
 * Register device token with backend
 */
export const registerDeviceToken = async (
  userId: string,
  deviceToken: string
): Promise<void> => {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const { error } = await supabase
    .from('user_device_tokens')
    .upsert(
      {
        user_id: userId,
        device_token: deviceToken,
        platform,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,device_token',
      }
    );

  if (error) {
    throw new Error(`Failed to register device token: ${error.message}`);
  }
};

/**
 * Unregister device token
 */
export const unregisterDeviceToken = async (
  userId: string,
  deviceToken: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('device_token', deviceToken);

  if (error) {
    console.error('Failed to unregister device token:', error);
  }
};

/**
 * Setup notification handlers
 */
export const setupNotificationHandlers = (
  onNotification: (notification: NotificationPayload) => void,
  onNotificationOpened: (notification: NotificationPayload) => void
): (() => void) => {
  if (!isFirebaseInitialized()) {
    console.warn('Firebase not initialized. Notification handlers will not be set up.');
    // Return a no-op cleanup function
    return () => {};
  }

  try {
    // Foreground message handler
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      onNotification(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          onNotificationOpened(remoteMessage);
        }
      })
      .catch((error) => {
        console.error('Error getting initial notification:', error);
      });

    // Notification opened handler (app in background)
    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        onNotificationOpened(remoteMessage);
      }
    );

    // Return cleanup function
    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  } catch (error) {
    console.error('Error setting up notification handlers:', error);
    return () => {};
  }
};

/**
 * Register background message handler early in app bootstrap.
 */
export const registerBackgroundNotificationHandler = (): void => {
  if (!isFirebaseInitialized()) {
    return;
  }
  messaging().setBackgroundMessageHandler(async (remoteMessage: NotificationPayload) => {
    console.log('Background message:', remoteMessage);
  });
};

/**
 * Initialize push notifications for a signed-in user.
 * Returns a cleanup function that unsubscribes token refresh listener.
 */
export const initializeNotificationsForUser = async (
  userId: string
): Promise<(() => void) | null> => {
  try {
    if (!isFirebaseInitialized()) {
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const token = await getDeviceToken();
    if (token) {
      await registerDeviceToken(userId, token);
    }

    // Only subscribe to token refresh if we have messaging (avoids native crash on Android when Firebase is not fully configured).
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken: string) => {
      try {
        await registerDeviceToken(userId, newToken);
      } catch (error) {
        console.error('Failed to register refreshed device token:', error);
      }
    });

    return () => {
      try {
        unsubscribeTokenRefresh();
      } catch {
        // no-op if unsubscribe fails
      }
    };
  } catch (error) {
    console.warn(
      'Notification initialization failed:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};
