import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Bell, Moon, Sun } from 'lucide-react-native';
import StudentDrawer from './StudentDrawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';

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
  
  const STORAGE_BASE = API_BASE_URL.replace('/api', '/storage');
  const avatarUri = user?.profile_picture ? `${STORAGE_BASE}/${user.profile_picture}` : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.navBar} />
      <StudentDrawer 
        visible={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        activeRoute={activeRoute} 
        unreadAnnouncements={unreadAnnouncements}
      />

      {!hideNav && (
        <View style={{
          backgroundColor: colors.navBar,
          paddingTop: insets.top,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.navBarBorder,
          shadowColor: colors.shadow,
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: colors.accentSoft,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Menu size={20} color={colors.iconDefault} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {avatarUri ? (
              <Image 
                source={{ uri: avatarUri }} 
                style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.border }} 
              />
            ) : (
              <View style={{
                width: 28, height: 28, borderRadius: 8,
                backgroundColor: isDark ? '#6366f1' : '#4f46e5',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>
                  {user?.first_name?.charAt(0) || 'S'}
                </Text>
              </View>
            )}
            <Text style={{ fontWeight: '800', color: colors.textPrimary, fontSize: 17, letterSpacing: -0.3 }}>
              {title || 'TAPasok'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={toggleTheme}>
              {isDark ? (
                <Sun size={20} color="#fbbf24" />
              ) : (
                <Moon size={20} color="#6366f1" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(student)/announcements')}
              style={{
                width: 38, height: 38, borderRadius: 12,
                backgroundColor: colors.accentSoft,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Bell size={18} color={colors.iconDefault} strokeWidth={2} />
              {unreadAnnouncements > 0 && (
                <View style={{
                  position: 'absolute', top: 8, right: 10,
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: '#ef4444',
                  borderWidth: 1.5, borderColor: colors.accentSoft,
                }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {children}
    </View>
  );
}
