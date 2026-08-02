import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Image, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { router } from 'expo-router';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { Lock, Users, Camera, GraduationCap, Mail, Shield, LogOut, X, Trash2, Building2, BookOpen, Phone, Info, ChevronDown, ChevronUp, Key } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerProfile() {
  const { user, logout, updateUser, membership } = useAuth();
  const { isDark, colors } = useTheme();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Join Org state
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [showPwd3, setShowPwd3] = useState(false);

  const STORAGE_BASE = API_BASE_URL.replace('/api', '/storage');

  useEffect(() => {
    if (user?.profile_picture && !avatarUri) {
      setAvatarUri(`${STORAGE_BASE}/${user.profile_picture}`);
    }
  }, []);

  const handlePickAvatar = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Camera', onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return Alert.alert('Permission needed', 'Camera access is required.');
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!result.canceled) uploadAvatar(result.assets[0].uri);
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return Alert.alert('Permission needed', 'Gallery access is required.');
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!result.canceled) uploadAvatar(result.assets[0].uri);
        }
      },
      ...(avatarUri ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: handleRemoveAvatar }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop() ?? 'avatar.jpg';
      const match = /\.([\w\d]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('avatar', { uri, name: filename, type } as any);

      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const path = res.data.path;
      const fullUrl = `${STORAGE_BASE}/${path}`;
      setAvatarUri(fullUrl);
      await updateUser({ profile_picture: path });
      Alert.alert('\u2713 Success', 'Profile picture updated!');
    } catch (e: any) {
      Alert.alert('Upload failed', e.response?.data?.message ?? 'Could not upload image.');
    }
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/profile/avatar');
      setAvatarUri(null);
      await updateUser({ profile_picture: undefined });
    } catch (_) {
      Alert.alert('Error', 'Could not remove photo.');
    }
  };

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/profile/my-organizations');
      setOrgs(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("[OFFICER] ERROR FETCHING ORGS:", err.response?.status, err.response?.data || err.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const handleLeave = (orgId: number, orgName: string) => {
    Alert.alert('Leave Organization', `Leave ${orgName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/profile/organizations/${orgId}/leave`);
            Alert.alert('Success', `You have left ${orgName}.`);
            fetchOrgs();
          } catch (_) {
            Alert.alert('Error', 'Could not leave organization.');
          }
        }
      },
    ]);
  };

  const handleJoinOrganization = async () => {
    if (!inviteCode.trim()) return Alert.alert('Error', 'Please enter an invite code.');
    setJoining(true);
    try {
      await api.post('/profile/organizations/join', { invite_code: inviteCode.trim() });
      Alert.alert('Success', 'Successfully joined organization!');
      setInviteCode('');
      fetchOrgs();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to join organization. Invalid code or already a member.');
    }
    setJoining(false);
  };

  const handleChangePassword = async () => {
    Alert.alert('Coming Soon', 'Password update functionality is coming soon.');
  };

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  const bg = isDark ? '#0f172a' : '#f5f3ff';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#1e1b4b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#ffffff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="profile">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </OfficerPageWrapper>
  );

  // Find the active/current org for the banner
  const activeOrg = orgs.find(o => o.organization_id === membership?.organization_id) || orgs[0];

  return (
    <OfficerPageWrapper activeRoute="profile">
      <ScrollView 
        style={{ flex: 1, backgroundColor: bg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrgs(); }} />}
      >

        {/* ═══════════════════════════════════════════
            ADMIN PROFILE HEADER (split layout)
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <View style={{
            backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border,
            padding: 20,
            shadowColor: isDark ? '#000' : '#7c3aed', shadowOpacity: isDark ? 0.1 : 0.06,
            shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Large avatar */}
              <TouchableOpacity 
                onPress={avatarUri ? () => setLightboxOpen(true) : handlePickAvatar} 
                activeOpacity={0.85} 
                style={{ marginRight: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}
              >
                <View style={{
                  width: 72, height: 72, borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: isDark ? '#4c1d95' : '#7c3aed',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatarUri
                    ? <Image source={{ uri: avatarUri }} style={{ width: 72, height: 72 }} resizeMode="cover" />
                    : <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{initials}</Text>
                  }
                </View>
                <View style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: cardBg,
                  shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
                }}>
                  {uploading
                    ? <ActivityIndicator size={8} color="#7c3aed" />
                    : <Camera size={10} color="#7c3aed" />
                  }
                </View>
              </TouchableOpacity>

              {/* Name, email, badge */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 2 }}>
                  {user?.first_name} {user?.last_name}
                </Text>
                <Text style={{ color: textSecondary, fontSize: 11, marginBottom: 8 }}>{user?.email}</Text>
                <View style={{
                  backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : '#f3e8ff',
                  borderWidth: 1, borderColor: isDark ? 'rgba(124,58,237,0.3)' : '#e9d5ff',
                  paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start',
                  flexDirection: 'row', alignItems: 'center',
                }}>
                  <Shield size={10} color={isDark ? '#c084fc' : '#7c3aed'} />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#c084fc' : '#7c3aed', marginLeft: 4 }}>Active Administrator</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* LIGHTBOX */}
        <Modal visible={lightboxOpen} transparent animationType="fade" onRequestClose={() => setLightboxOpen(false)} statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}>
            {avatarUri && (
              <Image source={{ uri: avatarUri }} style={{ width: 320, height: 320, borderRadius: 20 }} resizeMode="cover" />
            )}
            <View style={{ flexDirection: 'row', marginTop: 32, gap: 16 }}>
              <TouchableOpacity onPress={() => { setLightboxOpen(false); handlePickAvatar(); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
                <Camera size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setLightboxOpen(false); handleRemoveAvatar(); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' }}>
                <Trash2 size={16} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '700', marginLeft: 8 }}>Remove</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setLightboxOpen(false)} style={{ position: 'absolute', top: 56, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════
            ACTIVE ORGANIZATION BANNER
            ═══════════════════════════════════════════ */}
        {activeOrg && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <LinearGradient
              colors={isDark ? ['#3b0764', '#581c87'] : ['#6d28d9', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 16,
                shadowColor: isDark ? '#000' : '#7c3aed',
                shadowOpacity: isDark ? 0.2 : 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 }}>CURRENTLY MANAGING</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>
                {activeOrg.organization?.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{activeOrg.designation || 'Officer'}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#a7f3d0' }}>✓ Active</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ═══════════════════════════════════════════
            OFFICER DETAILS CARDS
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' }}>Officer Details</Text>
          <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
            <DetailRow icon={<GraduationCap size={14} color={isDark ? '#c084fc' : '#7c3aed'} />} label="Student Number" value={user?.student_number || '—'} isDark={isDark} border={border} />
            <DetailRow icon={<Building2 size={14} color={isDark ? '#c084fc' : '#7c3aed'} />} label="College" value={user?.college?.name || '—'} isDark={isDark} border={border} />
            <DetailRow icon={<BookOpen size={14} color={isDark ? '#c084fc' : '#7c3aed'} />} label="Course / Program" value={user?.course?.name || '—'} isDark={isDark} border={border} />
            <DetailRow icon={<Mail size={14} color={isDark ? '#c084fc' : '#7c3aed'} />} label="Email" value={user?.email || '—'} isDark={isDark} border={border} />
            <DetailRow icon={<Phone size={14} color={isDark ? '#c084fc' : '#7c3aed'} />} label="Contact" value={user?.contact_number || '—'} isDark={isDark} border={border} last />
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            ORGANIZATION SWITCHER (horizontal slider)
            ═══════════════════════════════════════════ */}
        <View style={{ paddingBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1.2, marginLeft: 20, marginBottom: 10, textTransform: 'uppercase' }}>My Organizations</Text>
          {orgs.length === 0 ? (
            <View style={{ marginHorizontal: 16, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 24, alignItems: 'center' }}>
              <Text style={{ color: textMuted, fontSize: 12, fontStyle: 'italic' }}>No organizations found.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {orgs.map(o => {
                const isActive = activeOrg?.id === o.id;
                return (
                  <View key={o.id} style={{
                    backgroundColor: isActive ? (isDark ? '#2e1065' : '#f3e8ff') : cardBg,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? (isDark ? '#7c3aed' : '#c084fc') : border,
                    borderRadius: 16, padding: 14, width: 200,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 7,
                        backgroundColor: isDark ? 'rgba(192,132,252,0.12)' : 'rgba(124,58,237,0.06)',
                        alignItems: 'center', justifyContent: 'center', marginRight: 8,
                      }}>
                        <Users size={12} color={isDark ? '#c084fc' : '#7c3aed'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary }} numberOfLines={1}>{o.organization?.name}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff', borderWidth: 1, borderColor: isDark ? 'rgba(147,51,234,0.3)' : '#e9d5ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 8, fontWeight: '700', color: isDark ? '#c084fc' : '#7c3aed' }}>{o.designation || 'Member'}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleLeave(o.organization_id, o.organization?.name)}
                        style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca' }}
                      >
                        <Text style={{ fontSize: 8, fontWeight: '700', color: '#ef4444' }}>Leave</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ═══════════════════════════════════════════
            JOIN ORGANIZATION
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 18 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1.2, marginBottom: 6, textTransform: 'uppercase' }}>Join an Organization</Text>
            <Text style={{ fontSize: 10, color: textSecondary, lineHeight: 16, marginBottom: 12 }}>
              Enter the 6-character invite code to join a new organization.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 10, height: 42, justifyContent: 'center', paddingHorizontal: 14 }}>
                <TextInput
                  style={{ fontSize: 12, color: textPrimary, fontWeight: '600', fontFamily: 'monospace' }}
                  placeholder="AB12CD"
                  placeholderTextColor={textMuted}
                  value={inviteCode}
                  onChangeText={v => setInviteCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.8} disabled={joining} onPress={handleJoinOrganization}
                style={{ backgroundColor: '#7c3aed', height: 42, paddingHorizontal: 18, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                {joining ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            SECURITY ACCORDION
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setSecurityOpen(!securityOpen)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(192,132,252,0.1)' : 'rgba(124,58,237,0.06)',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Key size={14} color={isDark ? '#c084fc' : '#7c3aed'} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>Security & Password</Text>
              </View>
              {securityOpen ? <ChevronUp size={16} color={textSecondary} /> : <ChevronDown size={16} color={textSecondary} />}
            </TouchableOpacity>

            {securityOpen && (
              <View style={{ paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderColor: border, paddingTop: 16 }}>
                <PwdField label="Current Password" val={currentPassword} setVal={setCurrentPassword} show={showPwd1} toggle={() => setShowPwd1(!showPwd1)} isDark={isDark} />
                <PwdField label="New Password" val={newPassword} setVal={setNewPassword} show={showPwd2} toggle={() => setShowPwd2(!showPwd2)} isDark={isDark} />
                <PwdField label="Confirm New Password" val={confirmPassword} setVal={setConfirmPassword} show={showPwd3} toggle={() => setShowPwd3(!showPwd3)} isDark={isDark} />

                <View style={{
                  backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : '#f5f3ff',
                  borderWidth: 1, borderColor: isDark ? 'rgba(124,58,237,0.3)' : '#ddd6fe',
                  borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16,
                }}>
                  <Info size={12} color="#7c3aed" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 10, color: isDark ? '#c084fc' : '#6d28d9', flex: 1, fontWeight: '500' }}>Password must be at least 8 characters long.</Text>
                </View>

                <TouchableOpacity 
                  onPress={handleChangePassword} activeOpacity={0.8}
                  style={{ backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Lock size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 }}>Update Password</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* LOGOUT */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <TouchableOpacity
            activeOpacity={0.8} onPress={handleLogout}
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
              paddingVertical: 14, borderRadius: 14, borderWidth: 1,
              borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca',
              flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
            }}
          >
            <LogOut size={16} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '800', marginLeft: 8, letterSpacing: 0.5 }}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </OfficerPageWrapper>
  );
}

/* ─── Sub-components ─── */

function DetailRow({ icon, label, value, isDark, border, last }: { icon: React.ReactNode; label: string; value: string; isDark: boolean; border: string; last?: boolean }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1, borderColor: border,
    }}>
      <View style={{
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: isDark ? 'rgba(192,132,252,0.1)' : 'rgba(124,58,237,0.06)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 1 }}>{label}</Text>
        <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#1e1b4b', fontWeight: '600' }} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function PwdField({ label, val, setVal, show, toggle, isDark }: { label: string; val: string; setVal: (v: string) => void; show: boolean; toggle: () => void; isDark?: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 9, color: isDark ? '#64748b' : '#475569', fontWeight: '700', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 10, paddingHorizontal: 10, height: 42 }}>
        <Lock size={12} color={isDark ? '#64748b' : '#94a3b8'} />
        <TextInput 
          style={{ flex: 1, marginLeft: 6, fontSize: 12, color: isDark ? '#f1f5f9' : '#1e1b4b', fontWeight: '600' }}
          value={val} onChangeText={setVal} secureTextEntry={!show}
          placeholder="••••••••" placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
        />
        <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#cbd5e1' : '#7c3aed' }}>{show ? 'HIDE' : 'SHOW'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
