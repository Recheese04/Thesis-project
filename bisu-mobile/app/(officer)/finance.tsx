import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import {
  Search, Users, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Plus, RefreshCw, CheckCircle, Wallet, X, DollarSign, Settings
} from 'lucide-react-native';

export default function OfficerFinance() {
  const { membership } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const orgId = membership?.organization_id;

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#fff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';
  const tabBg = isDark ? '#0f172a' : '#f8fafc';
  const tabActiveBg = isDark ? '#334155' : '#fff';
  const tabActiveText = isDark ? '#f1f5f9' : '#0f172a';
  const tabInactiveText = isDark ? '#64748b' : '#64748b';
  const avatarBg = isDark ? '#334155' : '#475569';
  const cardPanelBg = isDark ? '#1e293b' : '#fff';
  const cardPanelBorder = isDark ? '#334155' : '#f1f5f9';
  const modalBg = isDark ? '#1e293b' : '#fff';
  const modalInputBorder = isDark ? '#475569' : '#e2e8f0';
  const modalLabelColor = isDark ? '#cbd5e1' : '#475569';

  const [fees, setFees] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Record<number, boolean>>({});
  const [filterTab, setFilterTab] = useState<'All' | 'Fully Paid' | 'Pending' | 'No Fees'>('All');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    try {
      const [feesRes, membersRes, typesRes] = await Promise.all([
        api.get(`/organizations/${orgId}/student-fees`),
        api.get(`/organizations/${orgId}/members?status=active`),
        api.get(`/fee-types`),
      ]);
      setFees(Array.isArray(feesRes.data) ? feesRes.data : (feesRes.data.fees || []));
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      setFeeTypes(typesRes.data.fees || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  let totalExpected = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let pendingCount = 0;

  fees.forEach(f => {
    const amt = parseFloat(f.fee_type?.amount || '0');
    totalExpected += amt;
    if (f.status === 'paid' || f.status === 'completed') {
      totalCollected += amt;
      paidCount++;
    } else {
      pendingCount++;
    }
  });

  const pendingAmount = totalExpected - totalCollected;
  const percentCollected = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const studentMap: Record<number, { id: number; name: string; student_number: string; items: any[]; feeStatus: 'Fully Paid' | 'Pending' | 'No Fees' }> = {};

  members.forEach((m: any) => {
    const uid = m.user_id;
    if (!studentMap[uid]) {
      studentMap[uid] = { id: uid, name: `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim() || '—', student_number: m.user?.student_number || '', items: [], feeStatus: 'No Fees' };
    }
  });

  fees.forEach(item => {
    const uid = item.user_id;
    if (!uid) return;
    if (!studentMap[uid]) {
      studentMap[uid] = { id: uid, name: item.user?.name || '—', student_number: item.user?.student_number || '', items: [], feeStatus: 'No Fees' };
    }
    studentMap[uid].items.push(item);
  });

  let fullyPaidMembersCount = 0;
  let pendingMembersCount = 0;
  let noFeesMembersCount = 0;

  const studentList = Object.values(studentMap).map(student => {
    if (student.items.length === 0) { student.feeStatus = 'No Fees'; noFeesMembersCount++; }
    else {
      const isAllPaid = student.items.every(f => f.status === 'paid' || f.status === 'completed');
      if (isAllPaid) { student.feeStatus = 'Fully Paid'; fullyPaidMembersCount++; }
      else { student.feeStatus = 'Pending'; pendingMembersCount++; }
    }
    return student;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = studentList.filter(s => {
    if (filterTab !== 'All' && s.feeStatus !== filterTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.student_number.toLowerCase().includes(q);
  });

  const toggleExpand = (id: number) => setExpandedStudents(prev => ({ ...prev, [id]: !prev[id] }));

  const handleMarkPaid = async (feeId: number) => {
    try { await api.put(`/student-fees/${feeId}/status`, { status: 'paid' }); fetchData(); }
    catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed to update.'); }
  };

  const handleUndoPaid = async (feeId: number) => {
    try { await api.put(`/student-fees/${feeId}/status`, { status: 'pending' }); fetchData(); }
    catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed to update.'); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => (n[0] || '')).join('').toUpperCase().slice(0, 2) || '??';

  const handleGenerateFees = async () => {
    if (!selectedFeeTypeId) { Alert.alert('Error', 'Please select a fee type.'); return; }
    setIsGenerating(true);
    try {
      await api.post(`/organizations/${orgId}/student-fees/bulk`, { fee_type_id: selectedFeeTypeId });
      setShowGenerateModal(false);
      setSelectedFeeTypeId(null);
      Alert.alert('Success', 'Fees generated for all active members!');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to generate fees.');
    } finally { setIsGenerating(false); }
  };

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="finance">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color="#0fa968" />
      </View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="finance">
      <View style={{ flex: 1, backgroundColor: bg }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />} showsVerticalScrollIndicator={false}>

          {/* HEADER */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 44, height: 44, backgroundColor: '#0fa968', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <DollarSign size={20} color="#fff" />
              </View>
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: textPrimary }}>Finance</Text>
                <Text style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>Membership Fees Tracker</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowGenerateModal(true)} style={{ backgroundColor: '#0fa968', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                <Plus size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Generate Fees</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(officer)/fees')} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
                <Settings size={16} color={textSecondary} />
                <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Fee Catalog</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* GREEN TOTAL CARD */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{ backgroundColor: '#0fa968', borderRadius: 16, padding: 24, elevation: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>₱</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>↗ {percentCollected}%</Text>
              </View>
              <View style={{ marginTop: 24 }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Total Collected</Text>
                <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -0.5 }}>₱{totalCollected.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24 }}>
                <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginRight: 12 }}>
                  <View style={{ width: `${percentCollected}%`, height: '100%', backgroundColor: '#fff', borderRadius: 3 } as any} />
                </View>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>of ₱{totalExpected.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* LOWER STATS */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{ backgroundColor: cardPanelBg, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: cardPanelBorder, elevation: 2 }}>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', borderRadius: 16, padding: 16, marginRight: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <CheckCircle size={14} color="#10b981" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981', marginLeft: 6 }}>Collected</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#6ee7b7' : '#047857' }}>₱{totalCollected.toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>{paidCount} payments</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', borderRadius: 16, padding: 16, marginLeft: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Clock size={14} color="#f59e0b" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b', marginLeft: 6 }}>Pending</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#fcd34d' : '#b45309' }}>₱{pendingAmount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>{pendingCount} pending</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderRadius: 16, padding: 16, marginRight: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Users size={14} color="#3b82f6" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6', marginLeft: 6 }}>Total Members</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#93c5fd' : '#1d4ed8' }}>{members.length}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(168,85,247,0.1)' : '#faf5ff', borderRadius: 16, padding: 16, marginLeft: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <CheckCircle2 size={14} color="#a855f7" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#a855f7', marginLeft: 6 }}>Fully Paid</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#d8b4fe' : '#7e22ce' }}>{fullyPaidMembersCount}</Text>
                  <Text style={{ fontSize: 10, color: '#a855f7', marginTop: 4 }}>cleared</Text>
                </View>
              </View>
            </View>
          </View>

          {/* MEMBER LIST */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ backgroundColor: cardPanelBg, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: cardPanelBorder, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Text style={{ color: '#0fa968', fontSize: 12, fontWeight: '800' }}>₱</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary }}>Member Fee Status</Text>
              </View>
              <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 16 }}>Individual payment breakdown per member</Text>

              {/* TABS */}
              <View style={{ backgroundColor: tabBg, borderRadius: 12, flexDirection: 'row', padding: 4, marginBottom: 16 }}>
                {[{ label: 'All', count: studentList.length }, { label: 'Fully Paid', count: fullyPaidMembersCount }, { label: 'Pending', count: pendingMembersCount }, { label: 'No Fees', count: noFeesMembersCount }].map((tab) => {
                  const isActive = filterTab === tab.label;
                  return (
                    <TouchableOpacity key={tab.label} onPress={() => setFilterTab(tab.label as any)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: isActive ? tabActiveBg : 'transparent', elevation: isActive ? 1 : 0 }}>
                      <Text style={{ fontSize: 11, fontWeight: isActive ? '800' : '600', color: isActive ? tabActiveText : tabInactiveText }}>{tab.label}</Text>
                      <Text style={{ fontSize: 9, fontWeight: isActive ? '800' : '600', color: isActive ? tabActiveText : tabInactiveText }}>({tab.count})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SEARCH */}
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, backgroundColor: inputBg }}>
                <Search size={16} color={textMuted} />
                <TextInput style={{ flex: 1, marginLeft: 10, fontSize: 13, color: textPrimary, padding: 0 }} placeholder="Search member..." placeholderTextColor={textMuted} value={search} onChangeText={setSearch} />
              </View>

              {/* LIST */}
              {filtered.length === 0 ? <EmptyState icon="👥" message="No members found." /> : filtered.map(student => {
                const isOpen = expandedStudents[student.id];
                return (
                  <View key={student.id} style={{ marginBottom: 10 }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(student.id)} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: border, borderRadius: 12, padding: 12, backgroundColor: cardBg }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{getInitials(student.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{student.name}</Text>
                        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>{student.student_number}</Text>
                      </View>
                      {/* Status badge */}
                      <View style={{ backgroundColor: student.feeStatus === 'Fully Paid' ? (isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7') : student.feeStatus === 'Pending' ? (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7') : (isDark ? '#334155' : '#f1f5f9'), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: student.feeStatus === 'Fully Paid' ? (isDark ? '#86efac' : '#15803d') : student.feeStatus === 'Pending' ? (isDark ? '#fcd34d' : '#d97706') : textMuted }}>{student.feeStatus}</Text>
                      </View>
                      {isOpen ? <ChevronUp size={16} color={textMuted} /> : <ChevronDown size={16} color={textMuted} />}
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={{ padding: 12, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: border, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -6, paddingTop: 16, backgroundColor: isDark ? '#0f172a' : '#fafafa' }}>
                        {student.items.length === 0 ? (
                          <Text style={{ fontSize: 12, color: textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 }}>No fees assigned</Text>
                        ) : student.items.map(item => {
                          const isPaid = item.status === 'paid' || item.status === 'completed';
                          const title = item.fee_type?.name || 'Fee';
                          const amt = item.fee_type?.amount ? parseFloat(item.fee_type.amount).toFixed(2) : '0.00';
                          return isPaid ? (
                            <View key={`fee-${item.id}`} style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4', borderWidth: 1, borderColor: isDark ? '#065f46' : '#bbf7d0', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{title}</Text>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0fa968' }}>₱{amt}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <CheckCircle size={12} color="#0fa968" />
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0fa968', marginLeft: 4 }}>Paid</Text>
                                </View>
                              </View>
                              <TouchableOpacity onPress={() => handleUndoPaid(item.id)} style={{ marginLeft: 16, backgroundColor: isDark ? '#334155' : '#fff', borderWidth: 1, borderColor: border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: textSecondary }}>Undo</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View key={`fee-${item.id}`} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{title}</Text>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>₱{amt}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Clock size={12} color="#f59e0b" />
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b', marginLeft: 4 }}>Pending</Text>
                                </View>
                              </View>
                              <TouchableOpacity onPress={() => handleMarkPaid(item.id)} style={{ marginLeft: 16, backgroundColor: '#0fa968', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Mark Paid</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* GENERATE FEES MODAL */}
      <Modal visible={showGenerateModal} transparent animationType="fade" onRequestClose={() => setShowGenerateModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: modalBg, width: '100%', borderRadius: 16, padding: 24, elevation: 10, borderWidth: isDark ? 1 : 0, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setShowGenerateModal(false)}><X size={20} color={textMuted} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary, textAlign: 'center', marginTop: -10 }}>Generate Member Fees</Text>
            <Text style={{ fontSize: 12, color: textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 18 }}>Select a fee type from your catalog to assign to all active members.</Text>
            
            <Text style={{ fontSize: 13, fontWeight: '700', color: modalLabelColor, marginBottom: 8 }}>Select Fee Type</Text>
            {feeTypes.length === 0 ? (
              <View style={{ padding: 16, borderWidth: 1, borderColor: border, borderRadius: 10, marginBottom: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Your fee catalog is empty.</Text>
                <TouchableOpacity onPress={() => { setShowGenerateModal(false); router.push('/(officer)/fees'); }} style={{ backgroundColor: '#0fa968', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Create Fee Type First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 250, marginBottom: 24 }}>
                {feeTypes.map(type => (
                  <TouchableOpacity 
                    key={type.id} 
                    onPress={() => setSelectedFeeTypeId(type.id)}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      padding: 14, 
                      borderRadius: 12, 
                      borderWidth: 1, 
                      borderColor: selectedFeeTypeId === type.id ? '#0fa968' : border, 
                      backgroundColor: selectedFeeTypeId === type.id ? (isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : cardBg,
                      marginBottom: 8
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: selectedFeeTypeId === type.id ? '#0fa968' : textPrimary }}>{type.name}</Text>
                      <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>₱{parseFloat(type.amount).toFixed(2)} • {type.type || 'Standard'}</Text>
                    </View>
                    {selectedFeeTypeId === type.id && <CheckCircle size={18} color="#0fa968" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity onPress={handleGenerateFees} disabled={isGenerating || !selectedFeeTypeId} style={{ backgroundColor: '#0fa968', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 8, opacity: (isGenerating || !selectedFeeTypeId) ? 0.7 : 1 }}>
              {isGenerating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Bill All Members</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGenerateModal(false)} style={{ backgroundColor: isDark ? '#334155' : '#fff', borderWidth: 1, borderColor: border, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </OfficerPageWrapper>
  );
}
