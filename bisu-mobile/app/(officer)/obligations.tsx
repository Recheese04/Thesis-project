import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search, Users, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertTriangle, DollarSign, BookOpen
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerObligations() {
  const { membership } = useAuth();
  const { isDark } = useTheme();
  const orgId = membership?.organization_id;

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const borderLight = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#fff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';
  const tabBg = isDark ? '#0f172a' : '#f1f5f9';
  const tabActiveBg = isDark ? '#334155' : '#fff';
  const tabActiveText = isDark ? '#f1f5f9' : '#0f172a';
  const avatarBg = isDark ? '#334155' : '#475569';
  const cardPanelBg = isDark ? '#1e293b' : '#fff';
  const cardPanelBorder = isDark ? '#334155' : '#f1f5f9';

  const [fees, setFees] = useState<any[]>([]);
  const [consequences, setConsequences] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [filterTab, setFilterTab] = useState<'All' | 'Has Pending' | 'Clear'>('All');

  const fetchData = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    try {
      const [oblRes, membersRes] = await Promise.all([
        api.get(`/organizations/${orgId}/obligations`),
        api.get(`/organizations/${orgId}/members?status=active`),
      ]);
      setFees(oblRes.data.fees || []);
      setConsequences(oblRes.data.consequences || []);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkDone = async (id: number) => {
    try {
      await api.put(`/obligations/${id}`, { status: 'completed' });
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update.');
    }
  };

  const handleUndoDone = async (id: number) => {
    try {
      await api.put(`/obligations/${id}`, { status: 'pending' });
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update.');
    }
  };

  // ─── Aggregate per-member ───────────────────────────────────────────────────
  type StudentEntry = {
    id: number; name: string; student_number: string;
    fees: any[]; consequences: any[];
    status: 'Has Pending' | 'Clear' | 'No Items';
  };
  const studentMap: Record<number, StudentEntry> = {};

  members.forEach((m: any) => {
    const uid = m.user_id;
    if (!studentMap[uid]) studentMap[uid] = { id: uid, name: `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim() || '—', student_number: m.user?.student_number || '', fees: [], consequences: [], status: 'No Items' };
  });

  fees.forEach(item => {
    const uid = item.user?.id; if (!uid) return;
    if (!studentMap[uid]) studentMap[uid] = { id: uid, name: item.user?.name || '—', student_number: item.user?.student_number || '', fees: [], consequences: [], status: 'No Items' };
    studentMap[uid].fees.push(item);
  });

  consequences.forEach(item => {
    const uid = item.user?.id; if (!uid) return;
    if (!studentMap[uid]) studentMap[uid] = { id: uid, name: item.user?.name || '—', student_number: item.user?.student_number || '', fees: [], consequences: [], status: 'No Items' };
    studentMap[uid].consequences.push(item);
  });

  let hasPendingCount = 0;
  let clearCount = 0;
  let noItemsCount = 0;
  let totalFeesPending = 0;
  let totalConsequencesPending = 0;

  const studentList = Object.values(studentMap).map(s => {
    const hasPendingFee = s.fees.some(f => f.status !== 'paid' && f.status !== 'completed');
    const hasPendingConsequence = s.consequences.some(c => c.status !== 'completed');
    const hasAnyItems = s.fees.length > 0 || s.consequences.length > 0;
    if (!hasAnyItems) { s.status = 'No Items'; noItemsCount++; }
    else if (hasPendingFee || hasPendingConsequence) { s.status = 'Has Pending'; hasPendingCount++; }
    else { s.status = 'Clear'; clearCount++; }
    s.fees.forEach(f => { if (f.status !== 'paid' && f.status !== 'completed') totalFeesPending++; });
    s.consequences.forEach(c => { if (c.status !== 'completed') totalConsequencesPending++; });
    return s;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = studentList.filter(s => {
    if (filterTab === 'Has Pending' && s.status !== 'Has Pending') return false;
    if (filterTab === 'Clear' && s.status !== 'Clear') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.student_number.toLowerCase().includes(q);
  });

  const getInitials = (name: string) => name.split(' ').map(n => (n[0] || '')).join('').toUpperCase().slice(0, 2) || '??';

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="obligations">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="obligations">
      <View style={{ flex: 1, backgroundColor: bg }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />} showsVerticalScrollIndicator={false}>

        {/* Header Area with Tarsi */}
        <View style={{ position: 'relative', overflow: 'hidden', paddingBottom: 4 }}>
          
          {/* Decorative Background Circles */}
          <View style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#4ade80', opacity: 0.1, zIndex: 0
          }} />
          <View style={{
            position: 'absolute', top: 60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#22c55e', opacity: 0.08, zIndex: 0
          }} />

          {/* Title & Quick Actions */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                Member Fees & Tasks
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                Obligations
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={16} color={isDark ? '#94a3b8' : '#8b5cf6'} />
               </View>
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
                source={require('../../tarsier-mascot/tar-reading-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={`You have ${hasPendingCount} member${hasPendingCount !== 1 ? 's' : ''} with pending obligations. Keep tracking!`} 
            />
          </View>
        </View>

          {/* SUMMARY CARDS */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : '#faf5ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(139,92,246,0.3)' : '#e9d5ff' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <DollarSign size={14} color="#8b5cf6" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#8b5cf6', marginLeft: 6 }}>Pending Fees</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#c4b5fd' : '#6d28d9' }}>{totalFeesPending}</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#a78bfa' : '#7c3aed', marginTop: 4 }}>unpaid obligations</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fed7aa' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <AlertTriangle size={14} color="#f97316" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#f97316', marginLeft: 6 }}>Consequences</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#fdba74' : '#c2410c' }}>{totalConsequencesPending}</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#fb923c' : '#ea580c', marginTop: 4 }}>pending tasks</Text>
              </View>
            </View>

            {/* Member summary row */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#fcd34d' : '#d97706' }}>{hasPendingCount}</Text>
                <Text style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>Has Pending</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#86efac' : '#16a34a' }}>{clearCount}</Text>
                <Text style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>Clear</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary }}>{members.length}</Text>
                <Text style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>Total</Text>
              </View>
            </View>
          </View>

          {/* LIST PANEL */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ backgroundColor: cardPanelBg, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: cardPanelBorder, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>Member Obligations</Text>
              <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 16 }}>Fees & consequence tasks per member</Text>

              {/* TABS */}
              <View style={{ backgroundColor: tabBg, borderRadius: 12, flexDirection: 'row', padding: 4, marginBottom: 16 }}>
                {[{ label: 'All', count: studentList.length }, { label: 'Has Pending', count: hasPendingCount }, { label: 'Clear', count: clearCount }].map(tab => {
                  const isActive = filterTab === tab.label;
                  return (
                    <TouchableOpacity key={tab.label} onPress={() => setFilterTab(tab.label as any)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: isActive ? tabActiveBg : 'transparent', elevation: isActive ? 1 : 0 }}>
                      <Text style={{ fontSize: 11, fontWeight: isActive ? '800' : '600', color: isActive ? tabActiveText : textMuted }}>{tab.label}</Text>
                      <Text style={{ fontSize: 9, fontWeight: isActive ? '800' : '600', color: isActive ? tabActiveText : textMuted }}>({tab.count})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SEARCH */}
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, backgroundColor: inputBg }}>
                <Search size={16} color={textMuted} />
                <TextInput style={{ flex: 1, marginLeft: 10, fontSize: 13, color: textPrimary, padding: 0 }} placeholder="Search member..." placeholderTextColor={textMuted} value={search} onChangeText={setSearch} />
              </View>

              {/* MEMBER CARDS */}
              {filtered.length === 0 ? <EmptyState icon="📋" message="No members found." /> : filtered.map(student => {
                const isOpen = expanded[student.id];
                const hasPending = student.status === 'Has Pending';
                const statusColor = hasPending ? (isDark ? '#fcd34d' : '#d97706') : student.status === 'Clear' ? (isDark ? '#86efac' : '#16a34a') : textMuted;
                const statusBg = hasPending ? (isDark ? 'rgba(217,119,6,0.15)' : '#fef3c7') : student.status === 'Clear' ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? '#334155' : '#f1f5f9');
                const pendingFees = student.fees.filter(f => f.status !== 'paid' && f.status !== 'completed').length;
                const pendingCons = student.consequences.filter(c => c.status !== 'completed').length;

                return (
                  <View key={student.id} style={{ marginBottom: 10 }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(prev => ({ ...prev, [student.id]: !prev[student.id] }))} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: border, borderRadius: 12, padding: 12, backgroundColor: cardBg }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{getInitials(student.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{student.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                          {pendingFees > 0 && <Text style={{ fontSize: 10, color: isDark ? '#c4b5fd' : '#7c3aed' }}>💰 {pendingFees} fee{pendingFees !== 1 ? 's' : ''}</Text>}
                          {pendingCons > 0 && <Text style={{ fontSize: 10, color: isDark ? '#fdba74' : '#c2410c' }}>⚠️ {pendingCons} task{pendingCons !== 1 ? 's' : ''}</Text>}
                          {pendingFees === 0 && pendingCons === 0 && student.status === 'Clear' && <Text style={{ fontSize: 10, color: isDark ? '#86efac' : '#16a34a' }}>✓ All clear</Text>}
                          {student.status === 'No Items' && <Text style={{ fontSize: 10, color: textMuted }}>No obligations</Text>}
                        </View>
                      </View>
                      <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>{student.status === 'No Items' ? 'None' : student.status}</Text>
                      </View>
                      {isOpen ? <ChevronUp size={16} color={textMuted} /> : <ChevronDown size={16} color={textMuted} />}
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={{ borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: border, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 12, marginTop: -6, paddingTop: 16, backgroundColor: isDark ? '#0f172a' : '#fafafa' }}>
                        
                        {/* FEES SECTION */}
                        {student.fees.length > 0 && (
                          <View style={{ marginBottom: student.consequences.length > 0 ? 12 : 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderColor: borderLight }}>
                              <DollarSign size={12} color="#8b5cf6" />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#c4b5fd' : '#7c3aed', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Fees</Text>
                            </View>
                            {student.fees.map(item => {
                              const isPaid = item.status === 'paid' || item.status === 'completed';
                              const amt = item.amount ? `₱${parseFloat(item.amount).toFixed(2)}` : '';
                              return (
                                <View key={`fee-${item.id}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: borderLight, marginBottom: 2 }}>
                                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isPaid ? (isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7') : (isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff'), alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    {isPaid ? <CheckCircle size={14} color={isDark ? '#86efac' : '#16a34a'} /> : <Clock size={14} color={isDark ? '#c4b5fd' : '#7c3aed'} />}
                                  </View>
                                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: textPrimary }} numberOfLines={1}>{item.title || item.name || 'Fee'}</Text>
                                  <Text style={{ fontSize: 12, fontWeight: '800', color: isPaid ? (isDark ? '#86efac' : '#16a34a') : (isDark ? '#c4b5fd' : '#7c3aed'), marginLeft: 8 }}>{amt}</Text>
                                  <View style={{ marginLeft: 8, backgroundColor: isPaid ? (isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7') : item.status === 'submitted' ? (isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe') : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'), paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                                    <Text style={{ fontSize: 9, fontWeight: '700', color: isPaid ? (isDark ? '#86efac' : '#16a34a') : item.status === 'submitted' ? '#2563eb' : (isDark ? '#fcd34d' : '#d97706') }}>{isPaid ? 'Paid' : item.status === 'submitted' ? 'Awaiting' : 'Pending'}</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {/* CONSEQUENCES SECTION */}
                        {student.consequences.length > 0 && (
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderColor: borderLight }}>
                              <AlertTriangle size={12} color="#f97316" />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#fdba74' : '#c2410c', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Consequence Tasks</Text>
                            </View>
                            {student.consequences.map(item => {
                              const isDone = item.status === 'completed';
                              return (
                                <View key={`con-${item.id}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: borderLight, marginBottom: 2 }}>
                                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isDone ? (isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7') : (isDark ? 'rgba(239,68,68,0.1)' : '#fff7ed'), alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    {isDone ? <CheckCircle size={14} color={isDark ? '#86efac' : '#16a34a'} /> : <AlertTriangle size={14} color={isDark ? '#fdba74' : '#f97316'} />}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: textPrimary }} numberOfLines={1}>{item.consequence_title || item.title || 'Task'}</Text>
                                    {item.due_date && <Text style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>}
                                  </View>
                                  {isDone ? (
                                    <TouchableOpacity
                                      onPress={() => handleUndoDone(item.id)}
                                      style={{ marginLeft: 8, backgroundColor: isDark ? '#334155' : '#fff', borderWidth: 1, borderColor: border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                                    >
                                      <Text style={{ fontSize: 10, fontWeight: '700', color: textSecondary }}>Undo</Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <TouchableOpacity
                                      onPress={() => handleMarkDone(item.id)}
                                      style={{ marginLeft: 8, backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                                    >
                                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>Mark Done</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {student.fees.length === 0 && student.consequences.length === 0 && (
                          <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', paddingVertical: 12, fontStyle: 'italic' }}>No obligations assigned</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </OfficerPageWrapper>
  );
}
