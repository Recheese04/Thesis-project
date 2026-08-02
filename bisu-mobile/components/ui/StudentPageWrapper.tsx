import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Bell, Moon, Sun } from 'lucide-react-native';
import StudentDrawer from './StudentDrawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationBadge } from '../../context/NotificationContext';
import { API_BASE_URL } from '../../constants/Config';

import { LinearGradient } from 'expo-linear-gradient';
interface Props {
  children: React.ReactNode;
  activeRoute: string;
  title?: string;
  hideNav?: boolean;
  unreadAnnouncements?: number;
}

export default function StudentPageWrapper({ children, activeRoute, title, hideNav, unreadAnnouncements = 0 }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { unreadCount, markAllRead } = useNotificationBadge();
  
  const STORAGE_BASE = API_BASE_URL.replace('/api', '/storage');
  const avatarUri = user?.profile_picture ? `${STORAGE_BASE}/${user.profile_picture}` : null;

  // Ensure we have padding for the status bar so content doesn't overlap time/battery
  const safeTopPadding = Math.max(insets.top, StatusBar.currentHeight || 24);

  // Use the global notification count (from push notifications)
  // Fall back to unreadAnnouncements prop for backward compatibility
  const badgeCount = unreadCount > 0 ? unreadCount : unreadAnnouncements;

  const handleBellPress = () => {
    markAllRead(); // Clear the badge — Facebook style
    router.push('/(student)/announcements');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <StudentDrawer 
        visible={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        activeRoute={activeRoute} 
        unreadAnnouncements={badgeCount}
      />

      {!hideNav && (
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: safeTopPadding + 10, // Add explicit padding to clear the notch/status bar completely
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Menu size={20} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: 28, height: 28, borderRadius: 8 }} 
            />
            <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: 17, letterSpacing: -0.3 }}>
              {title || 'TAPasok'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={toggleTheme}>
              {isDark ? (
                <Sun size={20} color="#fbbf24" />
              ) : (
                <Moon size={20} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleBellPress}
              style={{
                width: 38, height: 38, borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Bell size={18} color="#ffffff" strokeWidth={2} />
              {badgeCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 4, right: 4,
                  minWidth: 18, height: 18,
                  borderRadius: 9,
                  backgroundColor: '#ef4444',
                  borderWidth: 2, borderColor: '#3b82f6',
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: '900',
                    lineHeight: 12,
                  }}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {children}
    </View>
  );
}
