import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Image, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { router } from 'expo-router';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import { Lock, Users, Camera, GraduationCap, Mail, LogOut, X, Trash2, Building2, BookOpen, Phone, Info, ChevronDown, ChevronUp, QrCode, Key } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

export default function StudentProfile() {
  const { user, logout, updateUser } = useAuth();
  const { isDark, colors } = useTheme();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [showPwd3, setShowPwd3] = useState(false);

  // Derive the storage base from the API base (strip /api)
  const STORAGE_BASE = API_BASE_URL.replace('/api', '/storage');

  // Load avatar from user on mount only (don't override if already set locally)
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

      // Build URL using local STORAGE_BASE (avoids APP_URL localhost issue)
      const path = res.data.path;
      const fullUrl = `${STORAGE_BASE}/${path}`;
      setAvatarUri(fullUrl);

      // Persist to AuthContext + SecureStore so it survives navigation
      await updateUser({ profile_picture: path });

      Alert.alert('\u2713 Updated', 'Profile picture updated!');
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
      console.log("FETCHED ORGS DATA:", res.data);
      setOrgs(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("ERROR FETCHING ORGS:", err.response?.data || err.message);
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
      Alert.alert('Error', err.response?.data?.message || 'Failed to join.');
    }
    setJoining(false);
  };

  const handleChangePassword = async () => {
    Alert.alert('Coming Soon', 'Password update functionality is coming soon.');
  };

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  if (loading && !refreshing) return (
    <StudentPageWrapper activeRoute="profile">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f0f4ff' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </StudentPageWrapper>
  );

  const bg = isDark ? '#0f172a' : '#f0f4ff';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#1e1b4b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#ffffff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';

  return (
    <StudentPageWrapper activeRoute="profile">
      <ScrollView 
        style={{ flex: 1, backgroundColor: bg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrgs(); }} />}
      >
        
        {/* ═══════════════════════════════════════════
            DIGITAL STUDENT ID CARD
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }}>
          <LinearGradient
            colors={isDark ? ['#1e1b4b', '#2e1065'] : ['#1e40af', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              shadowColor: isDark ? '#000' : '#4f46e5',
              shadowOpacity: isDark ? 0.3 : 0.25,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative chip (like a real ID card) */}
            <View style={{
              width: 32, height: 24, borderRadius: 6,
              backgroundColor: 'rgba(255, 215, 0, 0.4)',
              borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)',
              marginBottom: 16,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              <TouchableOpacity 
                onPress={avatarUri ? () => setLightboxOpen(true) : handlePickAvatar} 
                activeOpacity={0.85} 
                style={{ marginRight: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
              >
                <View style={{
                  width: 76, height: 76, borderRadius: 38,
                  borderWidth: 3, borderColor: '#ffffff',
                  overflow: 'hidden',
                  backgroundColor: isDark ? '#4c1d95' : '#6d28d9',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatarUri
                    ? <Image source={{ uri: avatarUri }} style={{ width: 76, height: 76 }} resizeMode="cover" />
                    : <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{initials}</Text>
                  }
                </View>
                <View style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: isDark ? '#2e1065' : '#1e40af',
                }}>
                  {uploading
                    ? <ActivityIndicator size={8} color="#4f46e5" />
                    : <Camera size={10} color="#4f46e5" />
                  }
                </View>
              </TouchableOpacity>

              {/* ID Details */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 }}>STUDENT ID</Text>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 2 }}>
                  {user?.first_name} {user?.last_name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                  {user?.student_number || '—'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500' }} numberOfLines={1}>
                  {user?.course?.name || '—'}
                </Text>
              </View>
            </View>

            {/* QR / barcode decoration */}
            <View style={{ position: 'absolute', bottom: 14, right: 20, alignItems: 'center', opacity: 0.2 }}>
              <QrCode size={30} color="#fff" />
              <View style={{ flexDirection: 'row', marginTop: 4, gap: 1.5 }}>
                {[1, 2, 4, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                  <View key={idx} style={{ width: w, height: 8, backgroundColor: '#fff' }} />
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* LIGHTBOX */}
        <Modal visible={lightboxOpen} transparent animationType="fade" onRequestClose={() => setLightboxOpen(false)} statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}>
            {avatarUri && (
              <Image source={{ uri: avatarUri }} style={{ width: 320, height: 320, borderRadius: 20 }} resizeMode="cover" />
            )}
            <View style={{ flexDirection: 'row', marginTop: 32, gap: 16 }}>
              <TouchableOpacity
                onPress={() => { setLightboxOpen(false); handlePickAvatar(); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
              >
                <Camera size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setLightboxOpen(false); handleRemoveAvatar(); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' }}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '700', marginLeft: 8 }}>Remove</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setLightboxOpen(false)}
              style={{ position: 'absolute', top: 56, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>

        {/* ═══════════════════════════════════════════
            ACADEMIC & PERSONAL INFO GRID (2-col)
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            <View style={{ width: '50%', padding: 6 }}>
              <GridTile label="College" value={user?.college?.name || '—'} icon={<Building2 size={16} color={isDark ? '#818cf8' : '#4f46e5'} />} isDark={isDark} cardBg={cardBg} border={border} />
            </View>
            <View style={{ width: '50%', padding: 6 }}>
              <GridTile label="Year Level" value={user?.year_level || '—'} icon={<BookOpen size={16} color={isDark ? '#818cf8' : '#4f46e5'} />} isDark={isDark} cardBg={cardBg} border={border} />
            </View>
            <View style={{ width: '100%', padding: 6 }}>
              <GridTile label="Email Address" value={user?.email || '—'} icon={<Mail size={16} color={isDark ? '#818cf8' : '#4f46e5'} />} isDark={isDark} cardBg={cardBg} border={border} />
            </View>
            <View style={{ width: '100%', padding: 6 }}>
              <GridTile label="Contact Number" value={user?.contact_number || '—'} icon={<Phone size={16} color={isDark ? '#818cf8' : '#4f46e5'} />} isDark={isDark} cardBg={cardBg} border={border} />
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            ORGANIZATIONS HORIZONTAL SLIDER
            ═══════════════════════════════════════════ */}
        <View style={{ paddingBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1.2, marginLeft: 20, marginBottom: 10, textTransform: 'uppercase' }}>
            My Organizations
          </Text>
          {orgs.length === 0 ? (
            <View style={{ marginHorizontal: 16, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 24, alignItems: 'center' }}>
              <Text style={{ color: textMuted, fontSize: 12, fontStyle: 'italic' }}>Not a member of any organization yet.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {orgs.map(o => (
                <View key={o.id} style={{
                  backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 20,
                  padding: 16, width: 240,
                  shadowColor: '#4f46e5', shadowOpacity: isDark ? 0 : 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(79,70,229,0.06)',
                      alignItems: 'center', justifyContent: 'center', marginRight: 10,
                    }}>
                      <Users size={14} color={isDark ? '#818cf8' : '#4f46e5'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }} numberOfLines={1}>{o.organization?.name}</Text>
                      <Text style={{ fontSize: 9, color: textSecondary }}>{o.organization?.acronym || 'Student Org'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <View style={{ backgroundColor: isDark ? 'rgba(79,70,229,0.15)' : '#eff6ff', borderWidth: 1, borderColor: isDark ? 'rgba(79,70,229,0.3)' : '#bfdbfe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#a5b4fc' : '#2563eb' }}>{o.designation || 'Member'}</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleLeave(o.organization_id, o.organization?.name)}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca' }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#ef4444' }}>Leave</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ═══════════════════════════════════════════
            JOIN ORGANIZATION
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border, padding: 20, shadowColor: '#4f46e5', shadowOpacity: isDark ? 0 : 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1.2, marginBottom: 6, textTransform: 'uppercase' }}>Join an Organization</Text>
            <Text style={{ fontSize: 11, color: textSecondary, lineHeight: 16, marginBottom: 14 }}>
              Enter the 6-character invite code from your organization officer below to join.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, height: 44, justifyContent: 'center', paddingHorizontal: 16 }}>
                <TextInput
                  style={{ fontSize: 13, color: textPrimary, fontWeight: '600', fontFamily: 'monospace' }}
                  placeholder="E.G. AB12CD"
                  placeholderTextColor={textMuted}
                  value={inviteCode}
                  onChangeText={(v) => setInviteCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.8} disabled={joining} onPress={handleJoinOrganization}
                style={{ backgroundColor: '#4f46e5', height: 44, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                {joining ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            SECURITY ACCORDION (collapsible)
            ═══════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border, overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: isDark ? 0 : 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setSecurityOpen(!securityOpen)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(79,70,229,0.06)',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Key size={14} color={isDark ? '#818cf8' : '#4f46e5'} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>Security & Password</Text>
              </View>
              {securityOpen ? <ChevronUp size={16} color={textSecondary} /> : <ChevronDown size={16} color={textSecondary} />}
            </TouchableOpacity>

            {securityOpen && (
              <View style={{ paddingHorizontal: 20, paddingBottom: 20, borderTopWidth: 1, borderColor: border, paddingTop: 16 }}>
                <PwdField label="Current Password" val={currentPassword} setVal={setCurrentPassword} show={showPwd1} toggle={() => setShowPwd1(!showPwd1)} isDark={isDark} />
                <PwdField label="New Password" val={newPassword} setVal={setNewPassword} show={showPwd2} toggle={() => setShowPwd2(!showPwd2)} isDark={isDark} />
                <PwdField label="Confirm New Password" val={confirmPassword} setVal={setConfirmPassword} show={showPwd3} toggle={() => setShowPwd3(!showPwd3)} isDark={isDark} />

                <View style={{
                  backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : '#f5f3ff',
                  borderWidth: 1, borderColor: isDark ? 'rgba(79,70,229,0.3)' : '#ddd6fe',
                  borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16,
                }}>
                  <Info size={12} color="#6d28d9" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 10, color: isDark ? '#a5b4fc' : '#5b21b6', flex: 1, fontWeight: '500' }}>Password must be at least 8 characters long.</Text>
                </View>

                <TouchableOpacity 
                  onPress={handleChangePassword} activeOpacity={0.8}
                  style={{ backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
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
    </StudentPageWrapper>
  );
}

/* ─── Sub-components ─── */

function GridTile({ label, value, icon, isDark, cardBg, border }: { label: string; value: string; icon: React.ReactNode; isDark: boolean; cardBg: string; border: string }) {
  return (
    <View style={{
      backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16,
      padding: 14, flexDirection: 'row', alignItems: 'center',
      shadowColor: isDark ? '#000' : '#4f46e5', shadowOpacity: isDark ? 0 : 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(79,70,229,0.06)',
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, color: isDark ? '#64748b' : '#94a3b8', fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#1e1b4b', fontWeight: '600' }} numberOfLines={1}>{value}</Text>
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
          <Text style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#cbd5e1' : '#4f46e5' }}>{show ? 'HIDE' : 'SHOW'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
