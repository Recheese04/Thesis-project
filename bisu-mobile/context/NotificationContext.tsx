import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamically import expo-notifications only when NOT in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('[NotificationContext] expo-notifications not available');
  }
}

interface NotificationContextType {
  unreadCount: number;
  markAllRead: () => void;
  incrementUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  markAllRead: () => {},
  incrementUnread: () => {},
});

const UNREAD_KEY = 'notification_unread_count';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Load persisted unread count on mount
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(UNREAD_KEY);
        if (stored) setUnreadCount(parseInt(stored, 10) || 0);
      } catch (_) {}
    })();
  }, [user?.id]);

  // Listen for incoming notifications and increment the badge
  useEffect(() => {
    if (!user || !Notifications) return;

    const subscription = Notifications.addNotificationReceivedListener((_notification) => {
      setUnreadCount((prev) => {
        const next = prev + 1;
        SecureStore.setItemAsync(UNREAD_KEY, String(next)).catch(() => {});
        return next;
      });
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    SecureStore.setItemAsync(UNREAD_KEY, '0').catch(() => {});
    // Also dismiss any OS-level badge
    if (Notifications) {
      Notifications.setBadgeCountAsync(0).catch(() => {});
    }
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((prev) => {
      const next = prev + 1;
      SecureStore.setItemAsync(UNREAD_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead, incrementUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationBadge = () => useContext(NotificationContext);
