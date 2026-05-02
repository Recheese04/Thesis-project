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
  LayoutDashboard, Users, Calendar, ClipboardList, Bell,
  MessageSquare, Wallet, QrCode, FileText, X, ChevronRight,
  ClipboardCheck, Bookmark, TrendingUp, AlertTriangle, DollarSign,
  CreditCard, Repeat, CheckCircle2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

interface OfficerDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeRoute?: string;
  unreadMessages?: number;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  active?: boolean;
  badge?: number | React.ReactNode;
  activeColor?: string;
  textColor?: string;
}

export default function OfficerDrawer({ visible, onClose, activeRoute = 'index', unreadMessages = 2 }: OfficerDrawerProps) {
  const router = useRouter();
  const { user, membership, officerDesignations, switchOrg } = useAuth();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [modalMounted, setModalMounted] = useState(false);
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dark mode colors
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
  const nameColor = isDark ? '#f1f5f9' : '#1e293b';
  const chevronColor = isDark ? '#64748b' : '#94a3b8';
  const onlineBorder = isDark ? '#1e293b' : '#fff';

  useEffect(() => {
    if (visible) {
      setModalMounted(true);
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0.5, duration: 260, useNativeDriver: true }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setModalMounted(false);
      });
    }
  }, [visible]);

  const navigate = useCallback((route: any) => {
    onClose();
    setTimeout(() => router.push(route), 240);
  }, [onClose, router]);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();
  const designation = membership?.designation?.toLowerCase() || '';
  const isTreasurer = designation.includes('treasurer');

  const ic = (route: string) => activeRoute === route ? 'white' : (isDark ? '#94a3b8' : '#64748b');

  const MenuSection = ({ label }: { label: string }) => (
    <Text style={{
      fontSize: 10, fontWeight: '700', color: sectionColor,
      letterSpacing: 1.2, textTransform: 'uppercase',
      paddingHorizontal: 16, marginTop: 20, marginBottom: 4,
    }}>{label}</Text>
  );

  const MenuItem = ({ icon, label, onPress, active = false, badge, activeColor = '#2563eb', textColor: tc }: MenuItemProps) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        marginHorizontal: 8, borderRadius: 12, marginBottom: 2,
        backgroundColor: active ? activeColor : 'transparent',
      }}
    >
      <View style={{ marginRight: 12, opacity: active ? 1 : 0.6 }}>{icon}</View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: active ? '#fff' : (tc || menuTextColor) }}>{label}</Text>
      {badge ? (
        typeof badge === 'number' ? (
          <View style={{ backgroundColor: '#10b981', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
          </View>
        ) : (
          badge
        )
      ) : null}
      {active && <ChevronRight size={14} color="white" />}
    </TouchableOpacity>
  );

  const ScanBadge = () => (
    <View style={{ backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Scan</Text>
    </View>
  );

  const handleSwitchOrg = async (orgId: number) => {
    await switchOrg(orgId);
    setShowOrgSwitcher(false);
    onClose();
  };

  if (!modalMounted) return null;

  return (
    <Modal transparent visible={modalMounted} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', opacity: fadeAnim }}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: DRAWER_WIDTH,
          transform: [{ translateX: slideAnim }],
          backgroundColor: drawerBg,
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24,
          shadowOffset: { width: 4, height: 0 },
          elevation: 24,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} style={{ flex: 1 }}>
          {/* Header */}
          <LinearGradient
            colors={['#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 16, paddingTop: Math.max(insets.top, 24) + 12, paddingBottom: 16,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{membership?.organization?.name?.[0] || 'B'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: 15, lineHeight: 18 }} numberOfLines={1}>{membership?.organization?.name || 'TAPasok'}</Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11 }}>Officer Portal</Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
              {(officerDesignations && officerDesignations.length > 1) && (
                <TouchableOpacity onPress={() => setShowOrgSwitcher(true)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Repeat size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {isTreasurer ? (
            <>
              <MenuSection label="Overview" />
              <MenuItem icon={<LayoutDashboard size={18} color={ic('index')} />} label="Dashboard" active={activeRoute === 'index'} onPress={() => navigate('/(officer)/')} />

              <MenuSection label="Organization" />
              <MenuItem icon={<Calendar size={18} color={ic('events')} />} label="Events" active={activeRoute === 'events'} onPress={() => navigate('/(officer)/events')} />
              <MenuItem icon={<FileText size={18} color={ic('documents')} />} label="Documents" active={activeRoute === 'documents'} onPress={() => navigate('/(officer)/documents')} />

              <MenuSection label="Treasury" />
              <MenuItem 
                icon={<DollarSign size={18} color={ic('finance')} />} 
                label="Finance" 
                active={activeRoute === 'finance'} 
                activeColor="#0fa968"
                onPress={() => navigate('/(officer)/finance')} 
              />

              <MenuSection label="Communication" />
              <MenuItem icon={<Bell size={18} color={ic('announcements')} />} label="Announcements" active={activeRoute === 'announcements'} onPress={() => navigate('/(officer)/announcements')} />

              <MenuSection label="My Student" />
              <MenuItem 
                icon={<QrCode size={18} color={ic('my-checkin')} />} 
                label="Check In" 
                active={activeRoute === 'my-checkin'} 
                onPress={() => navigate('/(officer)/my-checkin')} 
                badge={<ScanBadge />}
              />
              <MenuItem icon={<Calendar size={18} color={ic('my-events')} />} label="My Events" active={activeRoute === 'my-events'} onPress={() => navigate('/(officer)/my-events')} />
              <MenuItem icon={<ClipboardList size={18} color={ic('my-attendance')} />} label="My Attendance" active={activeRoute === 'my-attendance'} onPress={() => navigate('/(officer)/my-attendance')} />
              <MenuItem icon={<Bookmark size={18} color={ic('my-obligations')} />} label="Obligations" active={activeRoute === 'my-obligations'} onPress={() => navigate('/(officer)/my-obligations')} />
            </>
          ) : (
            <>
              <MenuSection label="Overview" />
              <MenuItem icon={<LayoutDashboard size={18} color={ic('index')} />} label="Dashboard" active={activeRoute === 'index'} onPress={() => navigate('/(officer)/')} />

              <MenuSection label="Organization" />
              <MenuItem icon={<Users size={18} color={ic('members')} />} label="Members" active={activeRoute === 'members'} onPress={() => navigate('/(officer)/members')} />
              <MenuItem icon={<Calendar size={18} color={ic('events')} />} label="Events" active={activeRoute === 'events'} onPress={() => navigate('/(officer)/events')} />
              <MenuItem icon={<ClipboardList size={18} color={ic('attendance')} />} label="Attendance" active={activeRoute === 'attendance'} onPress={() => navigate('/(officer)/attendance')} />
              <MenuItem 
                icon={<CreditCard size={18} color={ic('rfid')} />} 
                label="RFID Scanner" 
                active={activeRoute === 'rfid'} 
                onPress={() => navigate('/(officer)/rfid')} 
                badge={<ScanBadge />}
              />
              <MenuItem icon={<ClipboardCheck size={18} color={ic('evaluations')} />} label="Evaluations" active={activeRoute === 'evaluations'} onPress={() => navigate('/(officer)/evaluations')} />
              <MenuItem icon={<FileText size={18} color={ic('documents')} />} label="Documents" active={activeRoute === 'documents'} onPress={() => navigate('/(officer)/documents')} />

              <MenuSection label="Communication" />
              <MenuItem icon={<Bell size={18} color={ic('announcements')} />} label="Announcements" active={activeRoute === 'announcements'} onPress={() => navigate('/(officer)/announcements')} />

              <MenuSection label="Compliance" />
              <MenuItem icon={<AlertTriangle size={18} color={ic('consequences')} />} label="Consequence Rules" active={activeRoute === 'consequences'} onPress={() => navigate('/(officer)/consequences')} />
              <MenuItem icon={<Wallet size={18} color={ic('obligations')} />} label="Obligations" active={activeRoute === 'obligations'} activeColor="#8b5cf6" onPress={() => navigate('/(officer)/obligations')} />

              <MenuSection label="My Student" />
              <MenuItem 
                icon={<QrCode size={18} color={ic('my-checkin')} />} 
                label="Check In" 
                active={activeRoute === 'my-checkin'} 
                onPress={() => navigate('/(officer)/my-checkin')} 
                badge={<ScanBadge />}
              />
              <MenuItem icon={<Calendar size={18} color={ic('my-events')} />} label="My Events" active={activeRoute === 'my-events'} onPress={() => navigate('/(officer)/my-events')} />
              <MenuItem icon={<ClipboardList size={18} color={ic('my-attendance')} />} label="My Attendance" active={activeRoute === 'my-attendance'} onPress={() => navigate('/(officer)/my-attendance')} />
              <MenuItem icon={<Bookmark size={18} color={ic('my-obligations')} />} label="My Obligations" active={activeRoute === 'my-obligations'} onPress={() => navigate('/(officer)/my-obligations')} />
            </>
          )}

        </ScrollView>

        {/* Footer Profile */}
        <TouchableOpacity
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingTop: 14,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            borderTopWidth: 1, borderTopColor: footerBorder,
            backgroundColor: footerBg,
          }}
          onPress={() => navigate('/(officer)/profile')}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 12, position: 'relative' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{initials}</Text>
            <View style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, backgroundColor: '#34d399', borderRadius: 6, borderWidth: 2, borderColor: onlineBorder }} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: nameColor, fontSize: 13 }} numberOfLines={1}>{user?.first_name} {user?.last_name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <TrendingUp size={12} color={subtitleColor} />
              <View style={{ backgroundColor: '#2563eb', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'capitalize' }} numberOfLines={1}>{membership?.designation || 'Officer'}</Text>
              </View>
            </View>
          </View>
          <ChevronRight size={16} color={chevronColor} />
        </TouchableOpacity>
      </Animated.View>

      {/* Org Switcher Overlay (No Nested Modals) */}
      {showOrgSwitcher && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowOrgSwitcher(false)} />
          <View style={{ position: 'absolute', top: '25%', left: 20, right: 20, backgroundColor: drawerBg, borderRadius: 20, overflow: 'hidden', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: titleColor }}>Switch Organization</Text>
              <TouchableOpacity onPress={() => setShowOrgSwitcher(false)}>
                <X size={20} color={subtitleColor} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {officerDesignations?.map((des) => {
                const isCurrent = des.organization_id === membership?.organization_id;
                return (
                  <TouchableOpacity
                    key={des.id}
                    onPress={() => !isCurrent && handleSwitchOrg(des.organization_id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      padding: 16, borderRadius: 12, marginBottom: 8,
                      backgroundColor: isCurrent ? (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : (isDark ? '#334155' : '#f8fafc'),
                      borderWidth: 1, borderColor: isCurrent ? '#3b82f6' : 'transparent',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: isCurrent ? '#3b82f6' : titleColor }} numberOfLines={1}>
                        {des.organization?.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: subtitleColor, marginTop: 2 }}>{des.designation}</Text>
                    </View>
                    {isCurrent && <CheckCircle2 size={20} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
}
