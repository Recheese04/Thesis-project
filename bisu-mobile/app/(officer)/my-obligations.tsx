import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Clock, CheckCircle, DollarSign, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react-native';

export default function OfficerMyObligations() {
  const { isDark, colors } = useTheme();
  // Dark mode colors
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const borderLight = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const fetchData = async () => {
    try {
      const res = await api.get('/student/obligations');
      const data = res.data || {};
      const fees = Array.isArray(data.fees) ? data.fees : [];
      const consequences = Array.isArray(data.consequences) ? data.consequences : [];
      setObligations([...fees, ...consequences]);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pending = obligations.filter(o => o.status === 'pending');
  const completed = obligations.filter(o => o.status === 'paid' || o.status === 'completed');
  
  const total = obligations.length;
  const compCount = completed.length;
  const pendCount = pending.length;
  const completionRate = total > 0 ? Math.round((compCount / total) * 100) : 0;

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="my-obligations">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    </OfficerPageWrapper>
  );

  const activeList = activeTab === 'pending' ? pending : completed;

  return (
    <OfficerPageWrapper activeRoute="my-obligations">
      <View style={{ flex: 1, backgroundColor: bg }}>
        
        {/* Header */}
        <View style={{ backgroundColor: bg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
           <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary }}>My Obligations</Text>
           <Text style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}>Track your fees and assigned tasks as a student</Text>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stat Cards 2x2 Grid */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
               <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, marginRight: 8, borderWidth: 1, borderColor: border }}>
                 <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Completion</Text>
                 <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginBottom: 8 }}>{completionRate}%</Text>
                 <View style={{ height: 6, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                     <View style={{ width: `${completionRate}%`, height: '100%', backgroundColor: isDark ? '#60a5fa' : '#0f172a', borderRadius: 3 } as any} />
                 </View>
               </View>

               <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: border }}>
                 <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Total</Text>
                 <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>{total}</Text>
               </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
               <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, marginRight: 8, borderWidth: 1, borderColor: border }}>
                 <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Completed</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <CheckCircle size={20} color={isDark ? '#86efac' : '#16a34a'} />
                   <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>{compCount}</Text>
                 </View>
               </View>

               <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: border }}>
                 <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Pending</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Clock size={20} color={isDark ? '#fdba74' : '#ea580c'} />
                   <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>{pendCount}</Text>
                 </View>
               </View>
            </View>
          </View>

          {/* TABS CONTAINER */}
          <View style={{ marginBottom: 20, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: borderLight, paddingBottom: 10 }}>
            <Pressable 
              onPress={() => setActiveTab('pending')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
                backgroundColor: activeTab === 'pending' ? cardBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'pending' ? border : 'transparent',
                marginRight: 8
              }}
            >
               <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'pending' ? textPrimary : textSecondary }}>
                  Pending
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#fbbf24' : '#d97706' }}>{pendCount}</Text>
               </View>
            </Pressable>

            <Pressable 
              onPress={() => setActiveTab('completed')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
                backgroundColor: activeTab === 'completed' ? cardBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'completed' ? border : 'transparent',
              }}
            >
               <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'completed' ? textPrimary : textSecondary }}>
                  Completed
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#86efac' : '#16a34a' }}>{compCount}</Text>
               </View>
            </Pressable>
          </View>

          {activeList.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
               <EmptyState icon="✅" message={`No ${activeTab} obligations.`} />
            </View>
          ) : activeList.map((o) => {
            const isFee = o.type === 'fee';
            const title = o.title || 'Obligation';
            const subtitle = o.organization || '—';
            const amountStr = o.amount ? `₱${parseFloat(o.amount).toFixed(2)}` : null;
            
            return (
               <View key={`${o.type}-${o.id}`} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row' }}>
                  
                  {/* Left Icon */}
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isFee ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? 'rgba(234,88,12,0.15)' : '#ffedd5'), alignItems: 'center', justifyContent: 'center', marginRight: 16, marginTop: 2 }}>
                     {isFee ? <DollarSign size={20} color={isDark ? '#86efac' : '#16a34a'} /> : <AlertTriangle size={20} color={isDark ? '#fdba74' : '#ea580c'} />}
                  </View>
                  
                  {/* Content */}
                  <View style={{ flex: 1 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginRight: 8, marginBottom: 4 }}>{title}</Text>
                        
                        <View style={{ backgroundColor: isFee ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6, marginBottom: 4 }}>
                           <Text style={{ fontSize: 9, fontWeight: '700', color: isFee ? (isDark ? '#86efac' : '#15803d') : (isDark ? '#c084fc' : '#9333ea') }}>{isFee ? 'Fee' : 'Consequence'}</Text>
                        </View>
                        
                        <View style={{ backgroundColor: activeTab === 'pending' ? (isDark ? 'rgba(217,119,6,0.15)' : '#fef3c7') : (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 }}>
                           <Text style={{ fontSize: 9, fontWeight: '700', color: activeTab === 'pending' ? (isDark ? '#fbbf24' : '#d97706') : (isDark ? '#86efac' : '#15803d'), textTransform: 'capitalize' }}>{activeTab}</Text>
                        </View>
                     </View>

                     <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 12 }}>{subtitle}</Text>

                     <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        {o.due_date && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
                              <CalendarIcon size={12} color={textMuted} />
                              <Text style={{ fontSize: 10, color: textSecondary, marginLeft: 4 }}>Due {new Date(o.due_date).toLocaleDateString()}</Text>
                           </View>
                        )}
                        {o.event_title && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ fontSize: 10, color: textSecondary }}>Event: {o.event_title}</Text>
                           </View>
                        )}
                     </View>
                     
                     {o.notes && (
                       <Text style={{ fontSize: 10, color: textSecondary, marginTop: 4 }}>{o.notes}</Text>
                     )}
                     
                     </View>
                  
                  {/* Right Action / Amount */}
                  {isFee && amountStr && (
                     <View style={{ justifyContent: 'center', alignItems: 'flex-end', marginLeft: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{amountStr}</Text>
                     </View>
                  )}
               </View>
            );
          })}
          
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </OfficerPageWrapper>
  );
}
