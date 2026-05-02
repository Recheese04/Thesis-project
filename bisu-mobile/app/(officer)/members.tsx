import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Alert, Modal, Pressable, Image } from 'react-native';
import api from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Mail, Phone, MoreVertical, Copy, Plus, ArrowUpCircle, X } from 'lucide-react-native';

export default function OfficerMembers() {
  const { isDark, colors } = useTheme();
  const { membership } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMember, setActionMember] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const borderLight = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#fff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';
  const modalBg = isDark ? '#1e293b' : '#fff';
  const modalActionBg = isDark ? '#0f172a' : '#f8fafc';

  const orgId = membership?.organization_id;

  const fetchData = async () => {
    try {
      if (orgId) {
        const [orgInfoRes, membersRes] = await Promise.all([
          api.get(`/organizations/${orgId}`),
          api.get(`/organizations/${orgId}/members`),
        ]);
        setOrgDetails(orgInfoRes.data);
        const list = Array.isArray(membersRes.data) ? membersRes.data : [];
        setMembers(list);
        setFiltered(list);
      }
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const handleRemoveMember = (member: any) => {
    setActionMember(null);
    Alert.alert('Remove Member', `Are you sure you want to remove ${member.user?.first_name} from the organization?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
         try {
           await api.delete(`/organizations/${orgDetails.id}/members/${member.id}`);
           setMembers(prev => prev.filter(m => m.id !== member.id));
         } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const handleUpdateRole = async (member: any, newRole: string) => {
    setShowRolePicker(false);
    setActionMember(null);
    try {
      await api.put(`/organizations/${orgDetails.id}/members/${member.id}`, { designation: newRole });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, designation: newRole } : m));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(members.filter(m => {
      const name = `${m.user?.first_name ?? ''} ${m.user?.last_name ?? ''}`.toLowerCase();
      const stNum = String(m.user?.student_number ?? '').toLowerCase();
      return name.includes(q) || stNum.includes(q) || (m.designation ?? '').toLowerCase().includes(q);
    }));
  }, [search, members]);

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="members">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color={colors.accent} /></View>
    </OfficerPageWrapper>
  );

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    officers: members.filter(m => m.designation !== 'Member').length,
    avgAttendance: members.length ? Math.round(members.reduce((sum, m) => sum + (m.attendance_rate || 0), 0) / members.length) : 0
  };

  const getInitials = (fName: string, lName: string) => `${(fName || '?')[0].toUpperCase()}${(lName || '')[0]?.toUpperCase() || ''}`;

  const StatCard = ({ label, value }: { label: string, value: string | number }) => (
    <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 12, padding: 12, flex: 1, margin: 4 }}>
      <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary }}>{value}</Text>
    </View>
  );

  return (
    <OfficerPageWrapper activeRoute="members">
      <View style={{ backgroundColor: bg, flex: 1 }}>
        
        {/* Header Area with Tarsi */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative Background Circles */}
          <View style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#4ade80', opacity: 0.1, zIndex: 0
          }} />
          <View style={{
            position: 'absolute', top: 60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#22c55e', opacity: 0.08, zIndex: 0
          }} />

          {/* Title & Subtitle */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                Members Directory
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                {orgDetails?.name || 'Loading...'}
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               {orgDetails?.invite_code ? (
                  <TouchableOpacity 
                     style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(147,51,234,0.1)' : '#faf5ff', borderWidth: 1, borderColor: isDark ? 'rgba(147,51,234,0.3)' : '#e9d5ff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, marginRight: 8 }}
                     onPress={() => Alert.alert('Invite Code', orgDetails?.invite_code)}
                  >
                     <Copy size={14} color={isDark ? '#c084fc' : '#9333ea'} />
                  </TouchableOpacity>
               ) : null}

               <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                  onPress={() => Alert.alert('Add Member', 'Search & Add UI could open here.')}
               >
                  <Plus size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Add</Text>
               </TouchableOpacity>
            </View>
          </View>

          {/* Mascot & Chat Area */}
          <View style={{ position: 'relative', minHeight: 120, justifyContent: 'flex-end', paddingBottom: 10, marginTop: 10 }}>
            
            {/* Flat Green Bar Background (Gradient) */}
            <LinearGradient
              colors={['#4ade80', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, zIndex: 0 }}
            />

            {/* Mascot Image Wrapper */}
            <View style={{ 
              position: 'absolute', left: -20, bottom: 0, width: 210, height: 180, overflow: 'hidden', zIndex: 10 
            }}>
              <Image 
                source={require('../../tarsier-mascot/tar-lookingdown-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={`You have ${stats.total} members in ${orgDetails?.name || 'this organization'}, with ${stats.active} marked as active!`} 
            />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <StatCard label="Total Members" value={stats.total} />
              <StatCard label="Active Members" value={stats.active} />
            </View>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <StatCard label="Officers / Advisers" value={stats.officers} />
              <StatCard label="Avg. Attendance" value={`${stats.avgAttendance}%`} />
            </View>
          </View>

          <View style={{ backgroundColor: inputBg, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: inputBorder, marginBottom: 24 }}>
            <Search size={16} color={textMuted} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: textPrimary }}
              placeholder="Search by name or student number..."
              placeholderTextColor={textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary }}>Member List</Text>
            <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>All active organization members</Text>
          </View>

          {filtered.length === 0
            ? <EmptyState icon="👥" message="No members found." />
            : filtered.map(m => {
              const avatarBg = m.designation === 'President' ? '#9333ea' : '#f43f5e';
              const isOfficer = ['President', 'Vice President', 'Officer'].includes(m.designation);
              const badgeBg = isOfficer ? (isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff') : (isDark ? 'rgba(37,99,235,0.15)' : '#dbeafe');
              const badgeText = isOfficer ? (isDark ? '#c084fc' : '#7c3aed') : (isDark ? '#93c5fd' : '#2563eb');
              const courseName = typeof m.user?.course === 'object' ? m.user?.course?.name : m.user?.course;

              return (
                <Pressable 
                  key={m.id} 
                  onPress={() => { setSelectedMember(m); setProfileModalVisible(true); }}
                  style={({ pressed }) => [
                    { backgroundColor: cardBg, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 45, height: 45, borderRadius: 16, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{getInitials(m.user?.first_name, m.user?.last_name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary }}>{m.user?.first_name} {m.user?.last_name}</Text>
                        <Text style={{ fontSize: 11, color: textSecondary, fontFamily: 'monospace', marginTop: 2 }}>{m.user?.student_number}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                      <View style={{ backgroundColor: badgeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: badgeText }}>{m.designation || 'Member'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setActionMember(m)} style={{ padding: 8, marginRight: -8 }}>
                         <MoreVertical size={16} color={textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ marginBottom: 12, paddingHorizontal: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Mail size={12} color={textMuted} />
                      <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 8 }}>{m.user?.email}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Phone size={12} color={textMuted} />
                      <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 8 }}>{m.user?.contact_number ?? 'No contact'}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 10, color: textSecondary, flex: 1, paddingRight: 8, lineHeight: 14 }} numberOfLines={2}>
                      {courseName ?? 'No Course'} {(m.user?.year_level && courseName) ? '-' : ''} {m.user?.year_level}
                    </Text>
                    <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#6ee7b7' : '#15803d', fontWeight: '800' }}>{m.status || 'active'}</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
                    <View style={{ flex: 1, height: 3, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ height: '100%', backgroundColor: isDark ? '#64748b' : '#cbd5e1', borderRadius: 2, width: `${m.attendance_rate || 0}%` }} />
                    </View>
                    <Text style={{ fontSize: 10, color: textPrimary, fontWeight: '800', marginLeft: 12 }}>{m.attendance_rate || 0}%</Text>
                  </View>
                </Pressable>
              );
            })}
          <View style={{ height: 32 }} />
        </ScrollView>
        
        {/* Actions Modal */}
        <Modal transparent visible={!!actionMember && !showRolePicker} animationType="fade" onRequestClose={() => setActionMember(null)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setActionMember(null)}>
            <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }} onStartShouldSetResponder={() => true}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 48, height: 6, backgroundColor: isDark ? '#475569' : '#e2e8f0', borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 16, paddingHorizontal: 8 }}>Member Actions</Text>
              
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, backgroundColor: modalActionBg, borderRadius: 12 }} onPress={() => setShowRolePicker(true)}>
                <ArrowUpCircle size={18} color="#9333ea" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: textPrimary }}>Change Designation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderRadius: 12 }} onPress={() => handleRemoveMember(actionMember)}>
                <X size={18} color="#dc2626" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: '#dc2626' }}>Remove Member</Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </View>
          </Pressable>
        </Modal>

        {/* Role Picker Modal */}
        <Modal transparent visible={showRolePicker} animationType="slide" onRequestClose={() => setShowRolePicker(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShowRolePicker(false)}>
            <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' }} onStartShouldSetResponder={() => true}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary }}>Select New Role</Text>
                <TouchableOpacity onPress={() => setShowRolePicker(false)}><X size={20} color={textMuted} /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.R.O.', 'Officer', 'Member'].map(role => (
                  <TouchableOpacity 
                    key={role} 
                    style={{ padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8, backgroundColor: actionMember?.designation === role ? (isDark ? 'rgba(147,51,234,0.1)' : '#faf5ff') : cardBg, borderColor: actionMember?.designation === role ? (isDark ? 'rgba(147,51,234,0.3)' : '#e9d5ff') : border }}
                    onPress={() => handleUpdateRole(actionMember, role)}
                  >
                    <Text style={{ fontWeight: '600', color: actionMember?.designation === role ? (isDark ? '#c084fc' : '#7c3aed') : textPrimary }}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Profile Modal */}
        <Modal visible={profileModalVisible} transparent animationType="slide" onRequestClose={() => setProfileModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '85%' }}>
              
              <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} color={textPrimary} />
                </TouchableOpacity>
              </View>

              {selectedMember && (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ 
                      width: 180, 
                      height: 180, 
                      borderRadius: 90, 
                      backgroundColor: selectedMember.designation === 'President' ? '#9333ea' : '#f43f5e', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginBottom: 16, 
                      borderWidth: 4,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#fff',
                      shadowColor: '#000', 
                      shadowOffset: { width: 0, height: 15 }, 
                      shadowOpacity: 0.2, 
                      shadowRadius: 25,
                      elevation: 10
                    }}>
                      <Text style={{ color: '#fff', fontSize: 68, fontWeight: '800' }}>{getInitials(selectedMember.user?.first_name, selectedMember.user?.last_name)}</Text>
                    </View>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: textPrimary, textAlign: 'center' }}>{selectedMember.user?.first_name} {selectedMember.user?.last_name}</Text>
                    <View style={{ backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#c084fc' : '#7c3aed' }}>{selectedMember.designation || 'Member'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: border }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Contact Details</Text>
                    <View style={{ gap: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Mail size={16} color={colors.accent} />
                        <View style={{ marginLeft: 16 }}>
                          <Text style={{ fontSize: 10, color: textSecondary }}>Email Address</Text>
                          <Text style={{ fontSize: 14, color: textPrimary, fontWeight: '600' }}>{selectedMember.user?.email}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Phone size={16} color={colors.accent} />
                        <View style={{ marginLeft: 16 }}>
                          <Text style={{ fontSize: 10, color: textSecondary }}>Phone Number</Text>
                          <Text style={{ fontSize: 14, color: textPrimary, fontWeight: '600' }}>{selectedMember.user?.contact_number ?? 'Not provided'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: border }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Academic Profile</Text>
                    <View style={{ gap: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? '#334155' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 14 }}>🆔</Text>
                        </View>
                        <View style={{ marginLeft: 16 }}>
                          <Text style={{ fontSize: 10, color: textSecondary }}>Student Number</Text>
                          <Text style={{ fontSize: 14, color: textPrimary, fontWeight: '800', fontFamily: 'monospace' }}>{selectedMember.user?.student_number}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? '#334155' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 14 }}>🎓</Text>
                        </View>
                        <View style={{ marginLeft: 16, flex: 1 }}>
                          <Text style={{ fontSize: 10, color: textSecondary }}>Course & Year</Text>
                          <Text style={{ fontSize: 14, color: textPrimary, fontWeight: '600' }}>
                            {typeof selectedMember.user?.course === 'object' ? selectedMember.user?.course?.name : selectedMember.user?.course}
                            {selectedMember.user?.year_level ? ` · ${selectedMember.user?.year_level}` : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#bbf7d0' }}>
                      <Text style={{ fontSize: 10, color: isDark ? '#6ee7b7' : '#15803d', fontWeight: '800', marginBottom: 4 }}>Attendance</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#6ee7b7' : '#15803d' }}>{selectedMember.attendance_rate || 0}%</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' }}>
                      <Text style={{ fontSize: 10, color: isDark ? '#60a5fa' : '#2563eb', fontWeight: '800', marginBottom: 4 }}>Status</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#60a5fa' : '#2563eb', textTransform: 'capitalize' }}>{selectedMember.status || 'Active'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, marginTop: 24, alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }}
                    onPress={() => setProfileModalVisible(false)}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Close Profile</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

      </View>
    </OfficerPageWrapper>
  );
}
