import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StatusBar } from 'react-native';
import { Menu, Bell, Moon, Sun } from 'lucide-react-native';
import OfficerDrawer from './OfficerDrawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Ensure we have padding for the status bar so content doesn't overlap time/battery
  const safeTopPadding = Math.max(insets.top, StatusBar.currentHeight || 24);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <OfficerDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} activeRoute={activeRoute} />
      
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: safeTopPadding + 10, // Add explicit padding to clear the notch/status bar completely
          paddingBottom: 16,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 4 }}>
          <Menu size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image 
            source={require('../../assets/images/tapasok-icon.png')} 
            style={{ width: 28, height: 28, borderRadius: 14 }} 
          />
          <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: 16 }}>
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
          <TouchableOpacity onPress={() => router.push('/(officer)/announcements')}>
            <Bell size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

      </LinearGradient>
      {children}
    </View>
  );
}
