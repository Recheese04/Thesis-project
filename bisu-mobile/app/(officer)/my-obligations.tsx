import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Pressable, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import PaymentModal from '../../components/ui/PaymentModal';
import { useTheme } from '../../context/ThemeContext';
import { Clock, CheckCircle, DollarSign, AlertTriangle, Calendar as CalendarIcon, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerMyObligations() {
  const { isDark, colors } = useTheme();
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'awaiting' | 'completed'>('pending');

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const [selectedFeeAmount, setSelectedFeeAmount] = useState<string | null>(null);
  const [selectedFeeTitle, setSelectedFeeTitle] = useState<string>('');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('');
  const [selectedFeeRef, setSelectedFeeRef] = useState<string>('');
  const [selectedFeeProof, setSelectedFeeProof] = useState<string>('');

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

  const openPaymentModal = (fee: any, amountStr: string) => {
    setSelectedFeeId(fee.id);
    setSelectedFeeTitle(fee.title || 'Fee');
    setSelectedFeeAmount(amountStr);
    setSelectedFeeStatus(fee.status);
    setSelectedFeeRef(fee.reference_number || '');
    setSelectedFeeProof(fee.proof || '');
    setPaymentModalVisible(true);
  };

  const pending = obligations.filter(o => o.status === 'pending');
  const awaiting = obligations.filter(o => o.status === 'submitted');
  const completed = obligations.filter(o => o.status === 'paid' || o.status === 'completed');
  
  const total = obligations.length;
  const compCount = completed.length;
  const awaitCount = awaiting.length;
  const pendCount = pending.length;
  const completionRate = total > 0 ? Math.round((compCount / total) * 100) : 0;

  // Dark mode colors
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const progressBg = isDark ? '#334155' : '#e2e8f0';
  const progressFill = isDark ? colors.accent || '#818cf8' : '#0f172a';
  const tabActiveBg = isDark ? '#334155' : '#fff';
  const tabActiveBorder = isDark ? '#475569' : '#e2e8f0';
  const tabActiveText = isDark ? '#f1f5f9' : '#0f172a';
  const tabInactiveText = isDark ? '#64748b' : '#64748b';
  const tabSep = isDark ? '#334155' : '#f1f5f9';

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="my-obligations">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </OfficerPageWrapper>
  );

  const activeList = activeTab === 'pending' ? pending : activeTab === 'awaiting' ? awaiting : completed;

  return (
    <OfficerPageWrapper activeRoute="my-obligations">
      <View style={{ flex: 1, backgroundColor: bg }}>
        
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
              <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                My Requirements
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                My Obligations
              </Text>
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
              message={pendCount > 0 
                ? `You have ${pendCount} pending requirements to settle. Review them below.` 
                : awaitCount > 0 ? `You have ${awaitCount} payments awaiting verification. Please be patient!` : "Awesome! You have cleared all your obligations."} 
            />
          </View>
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
                 <View style={{ height: 6, backgroundColor: progressBg, borderRadius: 3, overflow: 'hidden' }}>
                     <View style={{ width: `${completionRate}%`, height: '100%', backgroundColor: progressFill, borderRadius: 3 }} />
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
                  <CheckCircle size={20} color="#16a34a" />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>{compCount}</Text>
                </View>
              </View>

              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: border }}>
                <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Awaiting</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock size={20} color="#3b82f6" />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>{awaitCount}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* TABS */}
          <View style={{ marginBottom: 20, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: tabSep, paddingBottom: 10 }}>
            <Pressable 
              onPress={() => setActiveTab('pending')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
                backgroundColor: activeTab === 'pending' ? tabActiveBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'pending' ? tabActiveBorder : 'transparent',
                marginRight: 4
              }}
            >
               <Text style={{ fontSize: 11, fontWeight: '700', color: activeTab === 'pending' ? tabActiveText : tabInactiveText }}>
                 Pending
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, marginLeft: 4 }}>
                 <Text style={{ fontSize: 9, fontWeight: '700', color: '#d97706' }}>{pendCount}</Text>
               </View>
            </Pressable>

            <Pressable 
              onPress={() => setActiveTab('awaiting')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
                backgroundColor: activeTab === 'awaiting' ? tabActiveBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'awaiting' ? tabActiveBorder : 'transparent',
                marginRight: 4
              }}
            >
               <Text style={{ fontSize: 11, fontWeight: '700', color: activeTab === 'awaiting' ? tabActiveText : tabInactiveText }}>
                 Awaiting
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, marginLeft: 4 }}>
                 <Text style={{ fontSize: 9, fontWeight: '700', color: '#2563eb' }}>{awaitCount}</Text>
               </View>
            </Pressable>

            <Pressable 
              onPress={() => setActiveTab('completed')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
                backgroundColor: activeTab === 'completed' ? tabActiveBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'completed' ? tabActiveBorder : 'transparent',
              }}
            >
               <Text style={{ fontSize: 11, fontWeight: '700', color: activeTab === 'completed' ? tabActiveText : tabInactiveText }}>
                 Paid
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, marginLeft: 4 }}>
                 <Text style={{ fontSize: 9, fontWeight: '700', color: '#16a34a' }}>{compCount}</Text>
               </View>
            </Pressable>
          </View>

          {activeList.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <EmptyState 
                  icon={activeTab === 'pending' ? '🕒' : activeTab === 'awaiting' ? '⌛' : '✅'} 
                  message={
                    activeTab === 'pending' ? 'No pending requirements.' : 
                    activeTab === 'awaiting' ? 'No fees awaiting verification.' : 
                    'You have no completed obligations.'
                  } 
                />
            </View>
          ) : activeList.map((o) => {
            const isFee = o.type === 'fee';
            const title = o.title || 'Obligation';
            const subtitle = o.organization || '—';
            const amountStr = o.amount ? `₱${parseFloat(o.amount).toFixed(2)}` : null;
            
            const iconBg = isFee 
              ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') 
              : (isDark ? 'rgba(234,88,12,0.15)' : '#ffedd5');
            const typeBadgeBg = isFee
              ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
              : (isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff');

            const isClickable = isFee && (o.status === 'pending' || o.status === 'submitted');
            const Wrapper = isClickable ? TouchableOpacity : View;

            return (
               <Wrapper 
                 key={`${o.type}-${o.id}`} 
                 style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: o.status === 'submitted' ? (isDark ? '#3b82f6' : '#bfdbfe') : border, flexDirection: 'row', alignItems: 'center' }}
                 onPress={isClickable ? () => openPaymentModal(o, amountStr!) : undefined}
               >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                     {isFee ? <DollarSign size={20} color="#16a34a" /> : <AlertTriangle size={20} color="#ea580c" />}
                  </View>
                  
                  <View style={{ flex: 1 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginRight: 8, marginBottom: 4 }}>{title}</Text>
                        
                        <View style={{ backgroundColor: typeBadgeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6, marginBottom: 4 }}>
                           <Text style={{ fontSize: 9, fontWeight: '700', color: isFee ? '#15803d' : '#9333ea' }}>{isFee ? (o.category || 'Fee') : 'Consequence'}</Text>
                        </View>
                        
                        <View style={{ backgroundColor: o.status === 'submitted' ? (isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe') : o.status === 'pending' ? (isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7') : (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 }}>
                           <Text style={{ fontSize: 9, fontWeight: '700', color: o.status === 'submitted' ? '#2563eb' : (o.status === 'pending' ? '#d97706' : '#15803d'), textTransform: 'capitalize' }}>{o.status === 'submitted' ? 'Awaiting Verification' : o.status}</Text>
                        </View>
                     </View>

                     <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 12 }}>{subtitle}</Text>

                     <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        {o.due_date && (
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
                              <CalendarIcon size={12} color={textSecondary} />
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
                  
                  {isFee && amountStr && (
                     <View style={{ justifyContent: 'center', alignItems: 'flex-end', marginLeft: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>{amountStr}</Text>
                        {o.status === 'submitted' ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: '700' }}>View Details</Text>
                            <ChevronRight size={14} color="#2563eb" />
                          </View>
                        ) : activeTab === 'pending' ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 10, color: colors.accent, fontWeight: '700' }}>Pay Now</Text>
                            <ChevronRight size={14} color={colors.accent} />
                          </View>
                        ) : null}
                     </View>
                  )}
               </Wrapper>
            );
          })}
          
          <View style={{ height: 32 }} />
        </ScrollView>

        <PaymentModal 
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          feeId={selectedFeeId}
          amountStr={selectedFeeAmount}
          title={selectedFeeTitle}
          status={selectedFeeStatus}
          initialReference={selectedFeeRef}
          initialProof={selectedFeeProof}
          onSuccess={() => {
            fetchData();
          }}
        />
      </View>
    </OfficerPageWrapper>
  );
}
