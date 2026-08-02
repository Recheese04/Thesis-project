import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from '../services/api';

// Check if we're running in Expo Go (notifications won't work there in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamically import expo-notifications only when NOT in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Configure how notifications appear when the app is in the foreground
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('[Notifications] expo-notifications not available:', e);
  }
}

/**
 * Hook to manage push notifications.
 * Call this once in _layout.tsx after user is authenticated.
 * Gracefully does nothing in Expo Go.
 */
export function useNotifications(userId: number | null | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!userId || !Notifications) return;

    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Send token to our backend
        api.post('/push-token/register', {
          token,
          device_type: Platform.OS,
        }).catch((err) => console.warn('[Notifications] Failed to register token:', err?.message));
      }
    });

    // Listener: notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notification Received]', notification.request.content.title);
    });

    // Listener: user tapped on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Notification Tapped]', data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId]);

  return { expoPushToken };
}

/**
 * Unregister push token on logout.
 * Safe to call in Expo Go (will just do nothing).
 */
export async function unregisterPushToken(): Promise<void> {
  if (!Notifications) return;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    if (token) {
      await api.post('/push-token/unregister', { token }).catch(() => { });
    }
  } catch (_) { }
}

/**
 * Request permissions and get the Expo push token.
 */
async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Notifications] Must use a physical device for push notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Get the token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    const token = tokenData.data;
    console.log('[Notifications] Expo push token:', token);

    // Android: set notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e4db7',
      });
    }

    return token;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }
}
