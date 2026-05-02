import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Image, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { router } from 'expo-router';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { User, Lock, Users, Camera, GraduationCap, Mail, Shield, LogOut, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../../constants/Config';

export default function OfficerProfile() {
  const { user, logout, updateUser } = useAuth();
  const { isDark, colors } = useTheme();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'organizations'>('info');

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
      console.log("[OFFICER] FETCHED ORGS:", JSON.stringify(res.data));
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

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const sectionBorder = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const iconBg = isDark ? '#334155' : '#f1f5f9';
  const tabBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBg = isDark ? '#334155' : '#fff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="profile">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color={colors.accent} /></View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="profile">
      <ScrollView 
        style={{ flex: 1, backgroundColor: bg }}
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrgs(); }} />}
      >
        
        {/* HERO CARD Wrapper */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <View style={{ backgroundColor: '#1e40af', borderRadius: 24, padding: 20, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={avatarUri ? () => setLightboxOpen(true) : handlePickAvatar} activeOpacity={0.85} style={{ marginRight: 16 }}>
                <View style={{ width: 72, height: 72, backgroundColor: '#a855f7', borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {avatarUri
                    ? <Image source={{ uri: avatarUri }} style={{ width: 72, height: 72 }} resizeMode="cover" />
                    : <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{initials}</Text>
                  }
                </View>
                <TouchableOpacity onPress={handlePickAvatar} style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: '#2563eb', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1e40af' }}>
                  {uploading ? <ActivityIndicator size={10} color="#fff" /> : <Camera size={10} color="#fff" />}
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 2 }}>{user?.first_name} {user?.last_name}</Text>
                <Text style={{ color: '#93c5fd', fontSize: 11, marginBottom: 8 }}>{user?.email}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{user?.student_number || 'No ID'}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{user?.year_level || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* LIGHTBOX */}
        <Modal visible={lightboxOpen} transparent animationType="fade" onRequestClose={() => setLightboxOpen(false)} statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}>
            {avatarUri && (
              <Image source={{ uri: avatarUri }} style={{ width: 300, height: 300, borderRadius: 16 }} resizeMode="cover" />
            )}
            <View style={{ flexDirection: 'row', marginTop: 32, gap: 16 }}>
              <TouchableOpacity
                onPress={() => { setLightboxOpen(false); handlePickAvatar(); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
              >
                <Camera size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setLightboxOpen(false); handleRemoveAvatar(); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef444420', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' }}
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

        {/* TABS HEADER */}
        <View style={{ backgroundColor: tabBg, padding: 4, borderRadius: 16, flexDirection: 'row', marginTop: 16, marginBottom: 8, marginHorizontal: 16 }}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveTab('info')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === 'info' ? '#0f2d5e' : 'transparent' }}
          >
            <User size={14} color={activeTab === 'info' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 6, color: activeTab === 'info' ? '#fff' : '#64748b' }}>My Info</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveTab('password')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === 'password' ? '#0f2d5e' : 'transparent' }}
          >
            <Lock size={14} color={activeTab === 'password' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 6, color: activeTab === 'password' ? '#fff' : '#64748b' }}>Password</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveTab('organizations')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === 'organizations' ? '#0f2d5e' : 'transparent' }}
          >
            <Users size={14} color={activeTab === 'organizations' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 6, color: activeTab === 'organizations' ? '#fff' : '#64748b' }}>Orgs</Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT (Hidden via Display None) */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          
          {/* MY INFO TAB */}
          <View style={{ display: activeTab === 'info' ? 'flex' : 'none' }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border, padding: 20, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: sectionBorder, paddingBottom: 12, marginBottom: 16 }}>
                <View style={{ backgroundColor: iconBg, padding: 6, borderRadius: 8, marginRight: 8 }}><GraduationCap size={14} color={textSecondary} /></View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1 }}>OFFICER INFORMATION</Text>
              </View>
              
              <InfoField label="STUDENT NUMBER" value={user?.student_number || '—'} icon={<Shield size={14} color={textMuted} />} isDark={isDark} />
              <InfoField label="COLLEGE" value={user?.college?.name || '—'} icon={<User size={14} color={textMuted} />} isDark={isDark} />
              <InfoField label="COURSE / PROGRAM" value={user?.course?.name || '—'} icon={<User size={14} color={textMuted} />} isDark={isDark} />
              <InfoField label="YEAR LEVEL" value={user?.year_level || '—'} icon={<GraduationCap size={14} color={textMuted} />} isDark={isDark} />

              <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: sectionBorder, paddingBottom: 12, marginBottom: 16, marginTop: 16 }}>
                <View style={{ backgroundColor: iconBg, padding: 6, borderRadius: 8, marginRight: 8 }}><Mail size={14} color={textSecondary} /></View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1 }}>EDITABLE INFORMATION</Text>
              </View>

              <InfoField label="Email" value={user?.email || '—'} icon={<Mail size={14} color={textMuted} />} editable isDark={isDark} />
              <InfoField label="Contact Number" value={user?.contact_number || '—'} icon={<User size={14} color={textMuted} />} editable isDark={isDark} />
            </View>
          </View>

          {/* PASSWORD TAB */}
          <View style={{ display: activeTab === 'password' ? 'flex' : 'none' }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border, padding: 20, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: sectionBorder, paddingBottom: 12, marginBottom: 16 }}>
                <View style={{ backgroundColor: iconBg, padding: 6, borderRadius: 8, marginRight: 8 }}><Lock size={14} color={textSecondary} /></View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1 }}>CHANGE PASSWORD</Text>
              </View>

              <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showPwd1} toggle={() => setShowPwd1(!showPwd1)} isDark={isDark} />
              <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} show={showPwd2} toggle={() => setShowPwd2(!showPwd2)} isDark={isDark} />
              <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showPwd3} toggle={() => setShowPwd3(!showPwd3)} isDark={isDark} />

              <View style={{ backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff', borderWidth: 1, borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#dbeafe', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ marginRight: 8 }}><Shield size={14} color="#2563eb" /></View>
                <Text style={{ fontSize: 11, color: isDark ? '#93c5fd' : '#1e40af' }}>Password must be at least 8 characters long.</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleChangePassword}
                style={{ backgroundColor: '#0f2d5e', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Lock size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 8 }}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ORGANIZATIONS TAB */}
          <View style={{ display: activeTab === 'organizations' ? 'flex' : 'none' }}>
            <View style={{ marginTop: 8 }}>
              <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border, padding: 20, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: sectionBorder, paddingBottom: 12, marginBottom: 16 }}>
                  <View style={{ backgroundColor: iconBg, padding: 6, borderRadius: 8, marginRight: 8 }}><Users size={14} color={textSecondary} /></View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1 }}>MY ORGANIZATIONS</Text>
                </View>

                {orgs.length === 0 ? (
                  <Text style={{ color: textMuted, textAlign: 'center', fontSize: 12, fontStyle: 'italic', paddingVertical: 12 }}>Not a member of any organization.</Text>
                ) : orgs.map(o => (
                  <View key={o.id} style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Users size={18} color={textSecondary} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }} numberOfLines={1}>{o.organization?.name}</Text>
                      <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <View style={{ backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff', borderWidth: 1, borderColor: isDark ? 'rgba(147,51,234,0.3)' : '#e9d5ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#c084fc' : '#7c3aed' }}>{o.designation || 'Member'}</Text>
                        </View>
                        <View style={{ backgroundColor: isDark ? 'rgba(5,150,105,0.15)' : '#d1fae5', borderWidth: 1, borderColor: isDark ? 'rgba(5,150,105,0.3)' : '#a7f3d0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#059669' }}>✓ Active</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => handleLeave(o.organization_id, o.organization?.name)}
                    >
                      <LogOut size={12} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={{ backgroundColor: cardBg, borderRadius: 24, borderWidth: 1, borderColor: border, padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: sectionBorder, paddingBottom: 12, marginBottom: 16 }}>
                  <View style={{ backgroundColor: iconBg, padding: 6, borderRadius: 8, marginRight: 8 }}><Users size={14} color={textSecondary} /></View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, letterSpacing: 1 }}>JOIN AN ORGANIZATION</Text>
                </View>
                
                <Text style={{ fontSize: 12, color: textSecondary, lineHeight: 18, marginBottom: 16 }}>
                  Ask your organization officer for their unique 6-character invite code and enter it below to join instantly.
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, height: 44, justifyContent: 'center', paddingHorizontal: 16 }}>
                    <TextInput
                      style={{ fontSize: 13, color: textPrimary, fontFamily: 'monospace' }}
                      placeholder="E.G. AB12CD"
                      placeholderTextColor={textMuted}
                      value={inviteCode}
                      onChangeText={v => setInviteCode(v.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={joining}
                    onPress={handleJoinOrganization}
                    style={{ backgroundColor: '#64748b', height: 44, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {joining ? <ActivityIndicator size="small" color="#fff" /> : (
                      <>
                        <Users size={14} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 8 }}>Join</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* LOGOUT BUTTON */}
          <View style={{ marginTop: 32, marginBottom: 16 }}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleLogout}
              style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
            >
              <LogOut size={16} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '800', marginLeft: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 16 }} />
        </View>

      </ScrollView>
    </OfficerPageWrapper>
  );
}


function InfoField({ label, value, icon, editable, isDark }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', marginBottom: 6, paddingLeft: 4 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
        <View style={{ marginRight: 8 }}>{icon}</View>
        <Text style={{ fontSize: 12, flex: 1, color: editable ? (isDark ? '#f1f5f9' : '#1e293b') : (isDark ? '#cbd5e1' : '#475569') }}>{value}</Text>
      </View>
    </View>
  );
}

function PasswordField({ label, value, onChange, show, toggle, isDark }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#475569', fontWeight: '700', marginBottom: 6, paddingLeft: 4 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#334155' : '#fff', borderWidth: 1, borderColor: isDark ? '#475569' : '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 44 }}>
        <Lock size={14} color={isDark ? '#64748b' : '#94a3b8'} />
        <TextInput 
          style={{ flex: 1, marginLeft: 8, fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b' }}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
        />
        <TouchableOpacity onPress={toggle} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b' }}>{show ? 'HIDE' : 'SHOW'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
