import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native';
import api from '../../services/api';
import { API_BASE_URL } from '../../constants/Config';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import {
  Search, Users, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Plus, CheckCircle, Wallet, X, Settings, Edit2, FileText, Printer,
  Calendar, Filter, AlertTriangle, History
} from 'lucide-react-native';
import LinearGradient from '../../components/ui/SafeLinearGradient';
import * as Print from 'expo-print';

const METHOD_LOGOS: Record<string, any> = {
  gcash: require('../../assets/images/gcash.png'),
  paymaya: require('../../assets/images/paymaya.jpg'),
  maya: require('../../assets/images/paymaya.jpg'),
};

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
  const [filterTab, setFilterTab] = useState<'All' | 'Fully Paid' | 'Pending' | 'No Fees' | 'Prior Debts'>('All');

  // Year Filtering States
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('All');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewingFee, setReviewingFee] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [editAccountNum, setEditAccountNum] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [savingMethod, setSavingMethod] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const [showYearModal, setShowYearModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    try {
      const [feesRes, membersRes, typesRes, methodsRes] = await Promise.allSettled([
        api.get(`/organizations/${orgId}/student-fees`),
        api.get(`/organizations/${orgId}/members?status=active`),
        api.get(`/fee-types`),
        api.get(`/payment-methods`),
      ]);

      if (feesRes.status === 'fulfilled') {
        const data = feesRes.value.data;
        setFees(Array.isArray(data) ? data : (data.fees || []));
      }
      if (membersRes.status === 'fulfilled') {
        setMembers(Array.isArray(membersRes.value.data) ? membersRes.value.data : []);
      }
      if (typesRes.status === 'fulfilled') {
        setFeeTypes(typesRes.value.data.fees || []);
      }
      if (methodsRes.status === 'fulfilled') {
        setPaymentMethods(Array.isArray(methodsRes.value.data) ? methodsRes.value.data : []);
      }
    } catch (_) { }
    setLoading(false);
    setRefreshing(false);
  }, [orgId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSavePaymentMethod = async () => {
    if (!editingMethod) return;
    setSavingMethod(true);
    try {
      await api.put(`/payment-methods/${editingMethod.id}`, {
        account_number: editAccountNum,
        account_name: editAccountName,
      });
      setPaymentMethods(prev => prev.map(m => m.id === editingMethod.id ? { ...m, account_number: editAccountNum, account_name: editAccountName } : m));
      setEditingMethod(null);
      Alert.alert('Saved!', 'Payment method info updated.');
    } catch { Alert.alert('Error', 'Failed to save.'); }
    finally { setSavingMethod(false); }
  };

  const currentYearStr = new Date().getFullYear().toString();

  // Extract all distinct fee years from database
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(currentYearStr);
    fees.forEach(f => {
      if (f.created_at) {
        const y = new Date(f.created_at).getFullYear().toString();
        if (y && !isNaN(Number(y))) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [fees, currentYearStr]);

  // Filter fees according to selected fiscal/academic year
  const displayedFees = useMemo(() => {
    if (selectedYear === 'All') return fees;
    return fees.filter(f => {
      if (!f.created_at) return true;
      const y = new Date(f.created_at).getFullYear().toString();
      return y === selectedYear;
    });
  }, [fees, selectedYear]);

  let totalExpected = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let pendingCount = 0;

  displayedFees.forEach(f => {
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

  const studentMap: Record<number, {
    id: number;
    name: string;
    student_number: string;
    year_level: string;
    items: any[];
    feeStatus: 'Fully Paid' | 'Pending' | 'No Fees';
    hasPriorYearDebt: boolean;
    priorYearDebts: string[];
  }> = {};

  members.forEach((m: any) => {
    const uid = m.user_id;
    if (!studentMap[uid]) {
      studentMap[uid] = {
        id: uid,
        name: `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim() || '—',
        student_number: m.user?.student_number || '',
        year_level: m.user?.year_level || m.year_level || '',
        items: [],
        feeStatus: 'No Fees',
        hasPriorYearDebt: false,
        priorYearDebts: [],
      };
    }
  });

  // Track all fees globally to detect prior year unpaid balances
  fees.forEach(item => {
    const uid = item.user_id;
    if (!uid) return;
    if (!studentMap[uid]) {
      studentMap[uid] = {
        id: uid,
        name: item.user?.name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || '—',
        student_number: item.user?.student_number || '',
        year_level: item.user?.year_level || '',
        items: [],
        feeStatus: 'No Fees',
        hasPriorYearDebt: false,
        priorYearDebts: [],
      };
    }

    const itemYear = item.created_at ? new Date(item.created_at).getFullYear().toString() : currentYearStr;
    const isPaid = item.status === 'paid' || item.status === 'completed';
    if (!isPaid && itemYear < currentYearStr) {
      studentMap[uid].hasPriorYearDebt = true;
      if (!studentMap[uid].priorYearDebts.includes(itemYear)) {
        studentMap[uid].priorYearDebts.push(itemYear);
      }
    }
  });

  // Populate student items from displayed (filtered) fees
  displayedFees.forEach(item => {
    const uid = item.user_id;
    if (!uid || !studentMap[uid]) return;
    studentMap[uid].items.push(item);
  });

  let fullyPaidMembersCount = 0;
  let pendingMembersCount = 0;
  let noFeesMembersCount = 0;
  let priorDebtsMembersCount = 0;

  const studentList = Object.values(studentMap).map(student => {
    if (student.hasPriorYearDebt) {
      priorDebtsMembersCount++;
    }

    if (student.items.length === 0) {
      student.feeStatus = 'No Fees';
      noFeesMembersCount++;
    } else {
      const isAllPaid = student.items.every(f => f.status === 'paid' || f.status === 'completed');
      if (isAllPaid) {
        student.feeStatus = 'Fully Paid';
        fullyPaidMembersCount++;
      } else {
        student.feeStatus = 'Pending';
        pendingMembersCount++;
      }
    }
    return student;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = studentList.filter(s => {
    // 1. Fee Status Tab Filter
    if (filterTab === 'Prior Debts') {
      if (!s.hasPriorYearDebt) return false;
    } else if (filterTab !== 'All' && s.feeStatus !== filterTab) {
      return false;
    }

    // 2. Student Year Level Filter
    if (selectedYearLevel !== 'All') {
      const yl = (s.year_level || '').toLowerCase();
      const target = selectedYearLevel.toLowerCase();
      if (!yl.includes(target) && !yl.includes(target.replace(' year', ''))) {
        return false;
      }
    }

    // 3. Search Query Filter
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

  const handlePrintReport = async () => {
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const feeTypeMap: Record<string, { name: string; amount: number; paid: number; pending: number }> = {};
    displayedFees.forEach(f => {
      const ftName = f.fee_type?.name || 'Unknown';
      const amt = parseFloat(f.fee_type?.amount || '0');
      if (!feeTypeMap[ftName]) feeTypeMap[ftName] = { name: ftName, amount: amt, paid: 0, pending: 0 };
      if (f.status === 'paid' || f.status === 'completed') feeTypeMap[ftName].paid++;
      else feeTypeMap[ftName].pending++;
    });
    const feeTypeRows = Object.values(feeTypeMap).map(ft =>
      `<tr><td>${ft.name}</td><td style="text-align:right">₱${ft.amount.toFixed(2)}</td><td style="text-align:center">${ft.paid}</td><td style="text-align:center">${ft.pending}</td><td style="text-align:right">₱${(ft.amount * ft.paid).toFixed(2)}</td></tr>`
    ).join('');
    const studentRows = studentList.map(s => {
      const badge = s.feeStatus === 'Fully Paid' ? '<span style="color:#16a34a;font-weight:700">✓ Paid</span>'
        : s.feeStatus === 'Pending' ? '<span style="color:#ea580c;font-weight:700">⏳ Pending</span>'
          : '<span style="color:#94a3b8">No Fees</span>';
      const priorDebtBadge = s.hasPriorYearDebt ? ` <span style="color:#dc2626;font-weight:700;font-size:10px">[Prior Balance: ${s.priorYearDebts.join(', ')}]</span>` : '';
      const itemDetails = s.items.map(i => {
        const itemYear = i.created_at ? new Date(i.created_at).getFullYear() : '';
        return `${i.fee_type?.name || 'Fee'} (${itemYear}): ${i.status === 'paid' || i.status === 'completed' ? '✓' : '✗'}`;
      }).join(', ');
      return `<tr><td>${s.name}${priorDebtBadge}</td><td>${s.student_number}</td><td>${s.year_level || '—'}</td><td style="text-align:center">${badge}</td><td style="font-size:10px">${itemDetails || '—'}</td></tr>`;
    }).join('');
    const html = `<html><head><style>
      body{font-family:Helvetica,Arial,sans-serif;padding:30px;color:#1e293b}
      h1{font-size:22px;margin-bottom:4px;color:#0f172a} h2{font-size:16px;margin-top:24px;margin-bottom:8px;color:#334155;border-bottom:2px solid #e2e8f0;padding-bottom:4px}
      .meta{font-size:12px;color:#64748b;margin-bottom:20px}
      .summary{display:flex;gap:16px;margin-bottom:20px}
      .stat{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
      .stat .val{font-size:22px;font-weight:800;color:#0f172a} .stat .lbl{font-size:11px;color:#64748b;margin-top:2px}
      .green .val{color:#16a34a} .orange .val{color:#ea580c} .blue .val{color:#2563eb}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
      th{background:#f1f5f9;padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid #e2e8f0}
      td{padding:6px;border-bottom:1px solid #f1f5f9}
      tr:nth-child(even){background:#fafafa}
      .footer{margin-top:30px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px}
    </style></head><body>
      <h1>📊 Finance Report</h1>
      <div class="meta">Period: <strong>${selectedYear === 'All' ? 'All Fiscal Years' : `Year ${selectedYear}`}</strong> • Generated on ${today}</div>
      <div class="summary">
        <div class="stat green"><div class="val">₱${totalCollected.toFixed(2)}</div><div class="lbl">Collected</div></div>
        <div class="stat orange"><div class="val">₱${pendingAmount.toFixed(2)}</div><div class="lbl">Pending</div></div>
        <div class="stat blue"><div class="val">${percentCollected}%</div><div class="lbl">Completion</div></div>
      </div>
      <div class="summary">
        <div class="stat"><div class="val">${fullyPaidMembersCount}</div><div class="lbl">Fully Paid</div></div>
        <div class="stat"><div class="val">${pendingMembersCount}</div><div class="lbl">Pending</div></div>
        <div class="stat"><div class="val">${noFeesMembersCount}</div><div class="lbl">No Fees</div></div>
        <div class="stat"><div class="val">${priorDebtsMembersCount}</div><div class="lbl">Prior Year Debts</div></div>
      </div>
      <h2>Fee Type Breakdown (${selectedYear === 'All' ? 'All Years' : selectedYear})</h2>
      <table><thead><tr><th>Fee Type</th><th style="text-align:right">Amount</th><th style="text-align:center">Paid</th><th style="text-align:center">Pending</th><th style="text-align:right">Collected</th></tr></thead><tbody>${feeTypeRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No fee types yet</td></tr>'}</tbody></table>
      <h2>Student Payment Status</h2>
      <table><thead><tr><th>Name</th><th>Student #</th><th>Year Level</th><th style="text-align:center">Status</th><th>Details</th></tr></thead><tbody>${studentRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No students yet</td></tr>'}</tbody></table>
      <div class="footer">Organization Finance Report • TapaSok App</div>
    </body></html>`;
    try {
      await Print.printAsync({ html });
    } catch (e: any) {
      Alert.alert('Print Error', e.message || 'Could not open print dialog.');
    }
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

          {/* Header Area with Tarsi */}
          <View style={{ position: 'relative', overflow: 'hidden' }}>

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
                <TouchableOpacity
                  onPress={() => setShowYearModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                    borderWidth: 1.5,
                    borderColor: '#0fa968',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    alignSelf: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <Calendar size={13} color="#0fa968" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#0fa968', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {selectedYear === 'All' ? 'S.Y. ALL YEARS' : `S.Y. ${selectedYear}`}
                  </Text>
                  <ChevronDown size={13} color="#0fa968" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                  Finance
                </Text>
              </View>

              {/* Quick Actions moved to the right */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity onPress={() => setShowReports(true)} style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color={isDark ? '#94a3b8' : '#ea580c'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPaymentSettings(true)} style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={16} color={isDark ? '#94a3b8' : '#7c3aed'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(officer)/fees')} style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={16} color={isDark ? '#94a3b8' : '#2563eb'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowGenerateModal(true)} style={{ width: 40, height: 40, backgroundColor: '#0fa968', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} color="#ffffff" />
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
                  source={require('../../tarsier-mascot/tar-money-nobg.png')}
                  style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }}
                  resizeMode="contain"
                />
              </View>

              {/* Chat Bubble */}
              <TarsiChatBubble
                message={totalCollected > 0
                  ? `You've collected ₱${totalCollected.toFixed(2)} so far! We're at ${percentCollected}% completion.`
                  : "Time to start collecting! Generate and manage membership fees here."}
              />
            </View>
          </View>

          {/* MAIN BODY CONTENT WITH EXPLICIT PADDING */}
          <View style={{ paddingTop: 16 }}>

            {/* ACADEMIC / FISCAL YEAR FILTER CARD */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={{
                backgroundColor: cardPanelBg,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: cardPanelBorder,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar size={14} color="#0fa968" />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary, marginLeft: 6 }}>
                      Select School / Fiscal Year
                    </Text>
                  </View>
                  {selectedYear !== 'All' && (
                    <TouchableOpacity onPress={() => setSelectedYear('All')} style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, color: '#0fa968', fontWeight: '800' }}>Reset to All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => setSelectedYear('All')}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selectedYear === 'All' ? '#0fa968' : border,
                      backgroundColor: selectedYear === 'All' ? (isDark ? 'rgba(16,185,129,0.2)' : '#dcfce7') : cardBg,
                      marginRight: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: selectedYear === 'All' ? '#0fa968' : textPrimary }}>
                      🌐 All Fiscal Years
                    </Text>
                  </TouchableOpacity>

                  {availableYears.map(yr => {
                    const isSelected = selectedYear === yr;
                    const isCurrent = yr === currentYearStr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => setSelectedYear(yr)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#0fa968' : (isCurrent ? (isDark ? '#065f46' : '#bbf7d0') : border),
                          backgroundColor: isSelected ? (isDark ? 'rgba(16,185,129,0.2)' : '#dcfce7') : cardBg,
                          marginRight: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#0fa968' : textPrimary }}>
                          {isCurrent ? `📅 S.Y. ${yr} (Current)` : `⏳ S.Y. ${yr} (Prior Year)`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* PRIOR YEAR DEBT ALERT BANNER */}
            {priorDebtsMembersCount > 0 && filterTab !== 'Prior Debts' && (
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setFilterTab('Prior Debts')}
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                    borderWidth: 1.5,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
                    borderRadius: 14,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                    <AlertTriangle size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#b91c1c' }}>
                        {priorDebtsMembersCount} Member{priorDebtsMembersCount > 1 ? 's have' : ' has'} unpaid fees from prior years!
                      </Text>
                      <Text style={{ fontSize: 10, color: textSecondary, marginTop: 1 }}>
                        Tap to filter students with carrying balances from previous years.
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#ef4444' }}>View →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* GREEN TOTAL CARD */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={{ backgroundColor: '#0fa968', borderRadius: 16, padding: 24, elevation: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>₱</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>↗ {percentCollected}%</Text>
                    {selectedYear !== 'All' && (
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', marginTop: 2 }}>Year {selectedYear}</Text>
                    )}
                  </View>
                </View>
                <View style={{ marginTop: 24 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                    {selectedYear === 'All' ? 'Total Collected (All Years)' : `Total Collected (${selectedYear})`}
                  </Text>
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
                <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 16 }}>
                  {selectedYear === 'All' ? 'Showing all fiscal years' : `Filtered to Year ${selectedYear}`} • Individual breakdown per member
                </Text>

                {/* TABS (STATUS) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ backgroundColor: tabBg, borderRadius: 12, flexDirection: 'row', padding: 4 }}>
                    {[
                      { label: 'All', count: studentList.length },
                      { label: 'Fully Paid', count: fullyPaidMembersCount },
                      { label: 'Pending', count: pendingMembersCount },
                      { label: 'Prior Debts', count: priorDebtsMembersCount },
                      { label: 'No Fees', count: noFeesMembersCount },
                    ].map((tab) => {
                      const isActive = filterTab === tab.label;
                      return (
                        <TouchableOpacity
                          key={tab.label}
                          onPress={() => setFilterTab(tab.label as any)}
                          style={{
                            paddingHorizontal: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: isActive ? tabActiveBg : 'transparent',
                            elevation: isActive ? 1 : 0,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: isActive ? '800' : '600', color: isActive ? tabActiveText : tabInactiveText }}>
                            {tab.label === 'Prior Debts' ? `⚠️ Prior Debts (${tab.count})` : `${tab.label} (${tab.count})`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* STUDENT YEAR LEVEL CHIPS FILTER */}
                <View style={{ marginBottom: 16 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((level) => {
                      const isLActive = selectedYearLevel === level;
                      return (
                        <TouchableOpacity
                          key={level}
                          onPress={() => setSelectedYearLevel(level)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isLActive ? '#2563eb' : border,
                            backgroundColor: isLActive ? (isDark ? '#1e3a8a' : '#eff6ff') : cardBg,
                            marginRight: 6,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: isLActive ? '800' : '600', color: isLActive ? '#2563eb' : textSecondary }}>
                            🎓 {level === 'All' ? 'All Year Levels' : level}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* SEARCH */}
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, backgroundColor: inputBg }}>
                  <Search size={16} color={textMuted} />
                  <TextInput style={{ flex: 1, marginLeft: 10, fontSize: 13, color: textPrimary, padding: 0 }} placeholder="Search member by name or student #..." placeholderTextColor={textMuted} value={search} onChangeText={setSearch} />
                </View>

                {/* LIST */}
                {filtered.length === 0 ? <EmptyState icon="👥" message="No members found matching filter." /> : filtered.map(student => {
                  const isOpen = expandedStudents[student.id];
                  return (
                    <View key={student.id} style={{ marginBottom: 10 }}>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(student.id)} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: border, borderRadius: 12, padding: 12, backgroundColor: cardBg }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{getInitials(student.name)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{student.name}</Text>
                            {student.hasPriorYearDebt && (
                              <View style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: '800', color: '#dc2626' }}>
                                  ⚠️ Past Unpaid ({student.priorYearDebts.join(',')})
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                            {student.student_number || 'No ID'} {student.year_level ? `• 🎓 ${student.year_level}` : ''}
                          </Text>
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
                            <Text style={{ fontSize: 12, color: textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 }}>
                              No fees assigned for {selectedYear === 'All' ? 'this student' : `year ${selectedYear}`}
                            </Text>
                          ) : student.items.map(item => {
                            const isPaid = item.status === 'paid' || item.status === 'completed';
                            const title = item.fee_type?.name || 'Fee';
                            const isSubmitted = item.status === 'submitted';
                            const amt = item.fee_type?.amount ? parseFloat(item.fee_type.amount).toFixed(2) : '0.00';
                            const itemYear = item.created_at ? new Date(item.created_at).getFullYear().toString() : currentYearStr;
                            const isPriorYear = itemYear < currentYearStr;
                            const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                            return isPaid ? (
                              <View key={`fee-${item.id}`} style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4', borderWidth: 1, borderColor: isDark ? '#065f46' : '#bbf7d0', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{title}</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0fa968' }}>₱{amt}</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <CheckCircle size={12} color="#0fa968" />
                                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0fa968', marginLeft: 4 }}>Paid</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: textSecondary }}>
                                      • S.Y. {itemYear} {formattedDate ? `(${formattedDate})` : ''}
                                    </Text>
                                  </View>
                                </View>
                                <TouchableOpacity onPress={() => handleUndoPaid(item.id)} style={{ marginLeft: 16, backgroundColor: isDark ? '#334155' : '#fff', borderWidth: 1, borderColor: border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: textSecondary }}>Undo</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View key={`fee-${item.id}`} style={{ backgroundColor: isSubmitted ? (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : (isPriorYear ? (isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff1f2') : cardBg), borderWidth: 1, borderColor: isSubmitted ? (isDark ? '#1e40af' : '#bfdbfe') : (isPriorYear ? (isDark ? '#991b1b' : '#fecdd3') : border), borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{title}</Text>
                                      {isPriorYear && (
                                        <View style={{ backgroundColor: isDark ? '#7f1d1d' : '#ffe4e6', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 6 }}>
                                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#e11d48' }}>Prior Year ({itemYear})</Text>
                                        </View>
                                      )}
                                    </View>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: isPriorYear ? '#e11d48' : textPrimary }}>₱{amt}</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                    {isSubmitted ? (
                                      <>
                                        <Clock size={12} color="#3b82f6" />
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6', marginLeft: 4 }}>Review Needed</Text>
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={12} color={isPriorYear ? '#e11d48' : '#f59e0b'} />
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: isPriorYear ? '#e11d48' : '#f59e0b', marginLeft: 4 }}>
                                          {isPriorYear ? 'Unpaid from Past Year' : 'Pending'}
                                        </Text>
                                      </>
                                    )}
                                    <Text style={{ fontSize: 10, color: textSecondary }}>
                                      • S.Y. {itemYear} {formattedDate ? `(${formattedDate})` : ''}
                                    </Text>
                                  </View>
                                </View>
                                <TouchableOpacity onPress={() => setReviewingFee(item)} style={{ marginLeft: 16, backgroundColor: isSubmitted ? '#2563eb' : '#0fa968', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{isSubmitted ? 'Review' : 'Mark Paid'}</Text>
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
          </View>
        </ScrollView>
      </View>

      {/* YEAR PICKER MODAL */}
      <Modal visible={showYearModal} transparent animationType="fade" onRequestClose={() => setShowYearModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: modalBg, width: '100%', borderRadius: 16, padding: 24, elevation: 10, borderWidth: isDark ? 1 : 0, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar size={18} color="#0fa968" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Select School Year</Text>
              </View>
              <TouchableOpacity onPress={() => setShowYearModal(false)}><X size={20} color={textMuted} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 18, lineHeight: 18 }}>
              Filter all fee collections, member statuses, and reports by academic / fiscal year.
            </Text>

            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => { setSelectedYear('All'); setShowYearModal(false); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selectedYear === 'All' ? '#0fa968' : border,
                  backgroundColor: selectedYear === 'All' ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : cardBg,
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: selectedYear === 'All' ? '#0fa968' : textPrimary }}>
                    🌐 All Fiscal Years
                  </Text>
                  <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                    Show lifetime fees and records across all years
                  </Text>
                </View>
                {selectedYear === 'All' && <CheckCircle size={18} color="#0fa968" />}
              </TouchableOpacity>

              {availableYears.map(yr => {
                const isSelected = selectedYear === yr;
                const isCurrent = yr === currentYearStr;
                return (
                  <TouchableOpacity
                    key={yr}
                    onPress={() => { setSelectedYear(yr); setShowYearModal(false); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#0fa968' : border,
                      backgroundColor: isSelected ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : cardBg,
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? '#0fa968' : textPrimary }}>
                        {isCurrent ? `📅 School Year ${yr} (Current)` : `⏳ School Year ${yr} (Prior Year)`}
                      </Text>
                      <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                        {isCurrent ? 'Current active school year records' : 'Past year records & carrying balances'}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle size={18} color="#0fa968" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowYearModal(false)}
              style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
      {/* REVIEW PAYMENT MODAL */}
      <Modal visible={!!reviewingFee} transparent animationType="fade" onRequestClose={() => setReviewingFee(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: modalBg, width: '100%', borderRadius: 16, padding: 20, elevation: 10, borderWidth: isDark ? 1 : 0, borderColor: '#334155', maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Review Payment</Text>
              <TouchableOpacity onPress={() => setReviewingFee(null)}><X size={24} color={textSecondary} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 4 }}>Fee</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: textPrimary }}>{reviewingFee?.fee_type?.name || 'Fee'}</Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 4 }}>Amount Paid</Text>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#0fa968' }}>
                  ₱{reviewingFee?.fee_type?.amount ? parseFloat(reviewingFee.fee_type.amount).toFixed(2) : '0.00'}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 4 }}>Reference Number</Text>
                <View style={{ backgroundColor: inputBg, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: inputBorder }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: textPrimary }}>
                    {reviewingFee?.reference_number || 'No reference provided'}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 8 }}>Proof of Payment</Text>
                {reviewingFee?.proof ? (
                  <Image
                    source={{ uri: `${API_BASE_URL.replace('/api', '')}/storage/${reviewingFee.proof}` }}
                    style={{ width: '100%', height: 300, borderRadius: 12, backgroundColor: inputBg }}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: inputBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: inputBorder, borderStyle: 'dashed' }}>
                    <Text style={{ color: textSecondary }}>No receipt uploaded</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: isDark ? '#334155' : '#e2e8f0', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                onPress={() => setReviewingFee(null)}
              >
                <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#0fa968', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                onPress={() => {
                  handleMarkPaid(reviewingFee.id);
                  setReviewingFee(null);
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Approve Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PAYMENT SETTINGS MODAL */}
      <Modal visible={showPaymentSettings} transparent animationType="fade" onRequestClose={() => { setShowPaymentSettings(false); setEditingMethod(null); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: modalBg, width: '100%', borderRadius: 16, padding: 24, elevation: 10, borderWidth: isDark ? 1 : 0, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Payment Settings</Text>
              <TouchableOpacity onPress={() => { setShowPaymentSettings(false); setEditingMethod(null); }}><X size={20} color={textSecondary} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 20 }}>Set the account number & name students will see when paying.</Text>

            {paymentMethods.map(method => {
              const isEditing = editingMethod?.id === method.id;
              const methodLabel = method.name === 'gcash' ? 'GCash' : method.name === 'paymaya' ? 'Maya' : method.name;
              return (
                <View key={method.id} style={{ borderWidth: 1, borderColor: isEditing ? '#0fa968' : border, borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: isEditing ? (isDark ? 'rgba(16,185,129,0.05)' : '#f0fdf4') : cardBg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {METHOD_LOGOS[method.name] && (
                        <Image
                          source={METHOD_LOGOS[method.name]}
                          style={{ width: 28, height: 28, borderRadius: 6 }}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary }}>{methodLabel}</Text>
                    </View>
                    {!isEditing && (
                      <TouchableOpacity onPress={() => { setEditingMethod(method); setEditAccountNum(method.account_number || ''); setEditAccountName(method.account_name || ''); }}>
                        <Edit2 size={16} color={isDark ? '#94a3b8' : '#2563eb'} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {isEditing ? (
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: modalLabelColor, marginBottom: 4 }}>Account Number</Text>
                      <TextInput style={{ borderWidth: 1, borderColor: modalInputBorder, borderRadius: 10, padding: 12, fontSize: 14, color: textPrimary, backgroundColor: inputBg, marginBottom: 12 }} value={editAccountNum} onChangeText={setEditAccountNum} placeholder="e.g. 09123456789" placeholderTextColor={textMuted} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: modalLabelColor, marginBottom: 4 }}>Account Name</Text>
                      <TextInput style={{ borderWidth: 1, borderColor: modalInputBorder, borderRadius: 10, padding: 12, fontSize: 14, color: textPrimary, backgroundColor: inputBg, marginBottom: 16 }} value={editAccountName} onChangeText={setEditAccountName} placeholder="e.g. Juan D. Cruz" placeholderTextColor={textMuted} />
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => setEditingMethod(null)} style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#e2e8f0', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: textPrimary }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSavePaymentMethod} disabled={savingMethod} style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#0fa968', alignItems: 'center', opacity: savingMethod ? 0.7 : 1 }}>
                          {savingMethod ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Save</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={{ fontSize: 12, color: textSecondary }}>Number: <Text style={{ fontWeight: '700', color: textPrimary }}>{method.account_number || '—'}</Text></Text>
                      <Text style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}>Name: <Text style={{ fontWeight: '700', color: textPrimary }}>{method.account_name || '—'}</Text></Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* REPORTS MODAL */}
      <Modal visible={showReports} transparent animationType="fade" onRequestClose={() => setShowReports(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: modalBg, width: '100%', borderRadius: 16, padding: 24, elevation: 10, borderWidth: isDark ? 1 : 0, borderColor: '#334155', maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>📊 Finance Report</Text>
              <TouchableOpacity onPress={() => setShowReports(false)}><X size={20} color={textSecondary} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Summary Cards */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#16a34a' }}>₱{totalCollected.toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: textSecondary, marginTop: 2 }}>Collected</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? '#431407' : '#fff7ed', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#ea580c' }}>₱{pendingAmount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: textSecondary, marginTop: 2 }}>Pending</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#16a34a' }}>{fullyPaidMembersCount}</Text>
                  <Text style={{ fontSize: 9, color: textSecondary }}>Fully Paid</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#ea580c' }}>{pendingMembersCount}</Text>
                  <Text style={{ fontSize: 9, color: textSecondary }}>Pending</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: textMuted }}>{noFeesMembersCount}</Text>
                  <Text style={{ fontSize: 9, color: textSecondary }}>No Fees</Text>
                </View>
              </View>

              {/* Completion Bar */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary }}>Collection Progress</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0fa968' }}>{percentCollected}%</Text>
                </View>
                <View style={{ height: 10, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${percentCollected}%`, backgroundColor: '#0fa968', borderRadius: 5 }} />
                </View>
              </View>

              {/* Fee Type Breakdown */}
              <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 10 }}>Fee Type Breakdown</Text>
              {feeTypes.length === 0 ? (
                <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', paddingVertical: 12 }}>No fee types created yet</Text>
              ) : (
                feeTypes.map((ft: any) => {
                  const ftFees = fees.filter(f => f.fee_type_id === ft.id);
                  const ftPaid = ftFees.filter(f => f.status === 'paid' || f.status === 'completed').length;
                  const ftPending = ftFees.length - ftPaid;
                  const ftCollected = ftPaid * parseFloat(ft.amount || '0');
                  return (
                    <View key={ft.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: textPrimary }}>{ft.name}</Text>
                        <Text style={{ fontSize: 11, color: textSecondary }}>₱{parseFloat(ft.amount || '0').toFixed(2)} each</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>₱{ftCollected.toFixed(2)}</Text>
                        <Text style={{ fontSize: 10, color: textSecondary }}>{ftPaid} paid · {ftPending} pending</Text>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Student List */}
              <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginTop: 20, marginBottom: 10 }}>Student Status</Text>
              {studentList.slice(0, 50).map(s => (
                <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary }} numberOfLines={1}>{s.name}</Text>
                    <Text style={{ fontSize: 10, color: textSecondary }}>{s.student_number || '—'}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: s.feeStatus === 'Fully Paid' ? (isDark ? '#064e3b' : '#dcfce7') : s.feeStatus === 'Pending' ? (isDark ? '#431407' : '#ffedd5') : (isDark ? '#1e293b' : '#f1f5f9') }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: s.feeStatus === 'Fully Paid' ? '#16a34a' : s.feeStatus === 'Pending' ? '#ea580c' : textMuted }}>{s.feeStatus}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Print Button */}
            <TouchableOpacity onPress={handlePrintReport} style={{ marginTop: 16, backgroundColor: '#0fa968', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Printer size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Print / Save as PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </OfficerPageWrapper>
  );
}
