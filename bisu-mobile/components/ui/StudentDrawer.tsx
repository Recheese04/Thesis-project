import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  Dimensions, ScrollView, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, QrCode, User, Calendar, Activity,
  ClipboardList, Bell, MessageSquare, Wallet, X, ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;
const DURATION_OPEN = 260;
const DURATION_CLOSE = 220;

interface StudentDrawerProps {
  visible: boolean;
  onClose: () => void;
  unreadAnnouncements?: number;
  unreadMessages?: number;
  activeRoute?: string;
}

const MenuSection = ({ label, color }: { label: string; color?: string }) => (
  <Text style={{
    fontSize: 10, fontWeight: '700', color: color || '#94a3b8',
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 4,
  }}>{label}</Text>
);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  active?: boolean;
  badge?: number;
  rightLabel?: string;
  textColor?: string;
}

const MenuItem = ({ icon, label, onPress, active = false, badge, rightLabel, textColor }: MenuItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      marginHorizontal: 8, borderRadius: 12, marginBottom: 2,
      backgroundColor: active ? '#2563eb' : 'transparent',
    }}
  >
    <View style={{ marginRight: 12, opacity: active ? 1 : 0.6 }}>{icon}</View>
    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: active ? '#fff' : (textColor || '#334155') }}>{label}</Text>
    {badge ? (
      <View style={{ backgroundColor: '#10b981', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
      </View>
    ) : null}
    {rightLabel ? (
      <View style={{ backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{rightLabel}</Text>
      </View>
    ) : null}
    {active && <ChevronRight size={14} color="white" />}
  </TouchableOpacity>
);

export default function StudentDrawer({
  visible, onClose,
  unreadAnnouncements = 0, unreadMessages = 0,
  activeRoute = 'index',
}: StudentDrawerProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const drawerBg = isDark ? '#1e293b' : '#fff';
  const headerBorder = isDark ? '#334155' : '#f1f5f9';
  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const subtitleColor = isDark ? '#64748b' : '#94a3b8';
  const closeBtnBg = isDark ? '#334155' : '#f1f5f9';
  const closeBtnIcon = isDark ? '#94a3b8' : '#64748b';
  const sectionColor = isDark ? '#64748b' : '#94a3b8';
  const menuTextColor = isDark ? '#e2e8f0' : '#334155';
  const footerBg = isDark ? '#1e293b' : '#fff';
  const footerBorder = isDark ? '#334155' : '#f1f5f9';
  const nameColor = isDark ? '#f1f5f9' : '#0f172a';
  const chevronColor = isDark ? '#64748b' : '#94a3b8';

  // Keep modal mounted; only unmount AFTER close animation finishes
  const [modalMounted, setModalMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animating = useRef(false);

  useEffect(() => {
    if (visible) {
      // Mount first, then animate in
      setModalMounted(true);
      // Reset position before animating in (in case it wasn't fully reset)
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);

      requestAnimationFrame(() => {
        animating.current = true;
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: DURATION_OPEN,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: DURATION_OPEN,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          animating.current = false;
        });
      });
    } else {
      // Animate out, THEN unmount
      animating.current = true;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: DURATION_CLOSE,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: DURATION_CLOSE,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        animating.current = false;
        if (finished) setModalMounted(false);
      });
    }
  }, [visible]);

  const navigate = useCallback((route: any) => {
    onClose();
    setTimeout(() => router.push(route), DURATION_CLOSE + 20);
  }, [onClose, router]);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();
  const iconColor = (route: string) => activeRoute === route ? 'white' : (isDark ? '#94a3b8' : '#64748b');

  if (!modalMounted) return null;

  return (
    <Modal
      transparent
      visible={modalMounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#000',
          opacity: fadeAnim,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: DRAWER_WIDTH,
          transform: [{ translateX: slideAnim }],
          backgroundColor: drawerBg,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 24,
          shadowOffset: { width: 4, height: 0 },
          elevation: 24,
        }}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>B</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: 15, lineHeight: 18 }}>TAPasok</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11 }}>Student Portal</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Nav Items */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
        >
          <MenuSection label="Overview" color={sectionColor} />
          <MenuItem icon={<LayoutDashboard size={18} color={iconColor('index')} />} label="Dashboard" active={activeRoute === 'index'} onPress={() => navigate('/(student)/')} textColor={menuTextColor} />
          <MenuItem icon={<QrCode size={18} color={iconColor('checkin')} />} label="Check In" active={activeRoute === 'checkin'} rightLabel="Scan" onPress={() => navigate('/(student)/checkin')} textColor={menuTextColor} />
          <MenuItem icon={<User size={18} color={iconColor('profile')} />} label="My Profile" active={activeRoute === 'profile'} onPress={() => navigate('/(student)/profile')} textColor={menuTextColor} />

          <MenuSection label="My Activities" color={sectionColor} />
          <MenuItem icon={<Calendar size={18} color={iconColor('events')} />} label="Events" active={activeRoute === 'events'} onPress={() => navigate('/(student)/events')} textColor={menuTextColor} />
          <MenuItem icon={<Activity size={18} color={iconColor('attendance')} />} label="My Attendance" active={activeRoute === 'attendance'} onPress={() => navigate('/(student)/attendance')} textColor={menuTextColor} />
          <MenuItem icon={<ClipboardList size={18} color={iconColor('evaluations')} />} label="Evaluations" active={activeRoute === 'evaluations'} onPress={() => navigate('/(student)/evaluations')} textColor={menuTextColor} />

          <MenuSection label="Communication" color={sectionColor} />
          <MenuItem icon={<Bell size={18} color={iconColor('announcements')} />} label="Announcements" active={activeRoute === 'announcements'} badge={unreadAnnouncements || undefined} onPress={() => navigate('/(student)/announcements')} textColor={menuTextColor} />

          <MenuSection label="Requirements" color={sectionColor} />
          <MenuItem icon={<Wallet size={18} color={iconColor('obligations')} />} label="Obligations" active={activeRoute === 'obligations'} onPress={() => navigate('/(student)/obligations')} textColor={menuTextColor} />
        </ScrollView>

        {/* Footer Profile */}
        <TouchableOpacity
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            borderTopWidth: 1, borderTopColor: footerBorder,
            backgroundColor: footerBg,
          }}
          onPress={() => navigate('/(student)/profile')}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: nameColor, fontSize: 13 }}>{user?.first_name} {user?.last_name}</Text>
            <Text style={{ color: subtitleColor, fontSize: 11 }}>{user?.student_number}</Text>
          </View>
          <ChevronRight size={16} color={chevronColor} />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
