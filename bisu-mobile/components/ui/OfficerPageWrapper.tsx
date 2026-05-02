import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Menu, Bell, Moon, Sun } from 'lucide-react-native';
import OfficerDrawer from './OfficerDrawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  activeRoute: string;
  title?: string;
}

export default function OfficerPageWrapper({ children, activeRoute, title }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const STORAGE_BASE = API_BASE_URL.replace('/api', '/storage');
  const avatarUri = user?.profile_picture ? `${STORAGE_BASE}/${user.profile_picture}` : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <OfficerDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} activeRoute={activeRoute} />
      
      <View style={{
        backgroundColor: colors.navBar,
        borderBottomWidth: 1,
        borderBottomColor: colors.navBarBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: insets.top + 4,
        paddingBottom: 12,
      }}>
        
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 4 }}>
          <Menu size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {avatarUri ? (
            <Image 
              source={{ uri: avatarUri }} 
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border }} 
            />
          ) : (
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: isDark ? '#3b82f6' : '#2563eb',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>
                {user?.first_name?.charAt(0) || 'O'}
              </Text>
            </View>
          )}
          <Text style={{ fontWeight: '800', color: colors.textPrimary, fontSize: 16 }}>
            {title || 'TAPasok'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity onPress={toggleTheme}>
            {isDark ? (
              <Sun size={20} color="#fbbf24" />
            ) : (
              <Moon size={20} color="#64748b" />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(officer)/announcements')}>
            <Bell size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

      </View>
      {children}
    </View>
  );
}
