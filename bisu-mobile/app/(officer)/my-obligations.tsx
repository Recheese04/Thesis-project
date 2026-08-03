import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useTheme } from '../../context/ThemeContext';
import { Clock, CheckCircle, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerMyObligations() {
  const { isDark, colors } = useTheme();
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const fetchData = async () => {
    try {
      const res = await api.get('/student/obligations');
      const data = res.data || {};
      const consequences = Array.isArray(data.consequences) ? data.consequences : [];
      setObligations(consequences);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pending = obligations.filter(o => o.status !== 'completed');
  const completed = obligations.filter(o => o.status === 'completed');
  
  const total = obligations.length;
  const compCount = completed.length;
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

  const activeList = activeTab === 'pending' ? pending : completed;

  return (
    <OfficerPageWrapper activeRoute="my-obligations">
      <View style={{ flex: 1, backgroundColor: bg }}>
        
        {/* Header Area with Tarsi */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>
          
          <View style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#4ade80', opacity: 0.1, zIndex: 0
          }} />
          <View style={{
            position: 'absolute', top: 60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#22c55e', opacity: 0.08, zIndex: 0
          }} />

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

          <View style={{ position: 'relative', minHeight: 120, justifyContent: 'flex-end', paddingBottom: 10, marginTop: 10 }}>
            <LinearGradient
              colors={['#4ade80', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, zIndex: 0 }}
            />

            <View style={{ 
              position: 'absolute', left: -20, bottom: 0, width: 210, height: 180, overflow: 'hidden', zIndex: 10 
            }}>
              <Image 
                source={require('../../tarsier-mascot/tar-reading-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            <TarsiChatBubble 
              message={pendCount > 0 
                ? `You have ${pendCount} pending consequence task${pendCount !== 1 ? 's' : ''}. Review them below.` 
                : "Awesome! You have cleared all your obligations."} 
            />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stat Cards Grid */}
          <View style={{ marginBottom: 16, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
               <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, marginRight: 8, borderWidth: 1, borderColor: border }}>
                 <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Completion</Text>
                 <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginBottom: 8 }}>{completionRate}%</Text>
                 <View style={{ height: 6, backgroundColor: progressBg, borderRadius: 3, overflow: 'hidden' }}>
                     <View style={{ width: `${completionRate}%`, height: '100%', backgroundColor: progressFill, borderRadius: 3 }} />
                 </View>
               </View>

               <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: border }}>
                 <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Total Tasks</Text>
                 <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>{total}</Text>
               </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, marginRight: 8, borderWidth: 1, borderColor: border }}>
                <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Pending</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock size={20} color="#ea580c" />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>{pendCount}</Text>
                </View>
              </View>

              <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: border }}>
                <Text style={{ fontSize: 10, color: textSecondary, marginBottom: 4 }}>Completed</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CheckCircle size={20} color="#16a34a" />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>{compCount}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* TABS */}
          <View style={{ marginBottom: 20, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: tabSep, paddingBottom: 10 }}>
            <Pressable 
              onPress={() => setActiveTab('pending')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
                backgroundColor: activeTab === 'pending' ? tabActiveBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'pending' ? tabActiveBorder : 'transparent',
                marginRight: 8
              }}
            >
               <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'pending' ? tabActiveText : tabInactiveText }}>
                 Pending
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, marginLeft: 6 }}>
                 <Text style={{ fontSize: 10, fontWeight: '700', color: '#d97706' }}>{pendCount}</Text>
               </View>
            </Pressable>

            <Pressable 
              onPress={() => setActiveTab('completed')}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
                backgroundColor: activeTab === 'completed' ? tabActiveBg : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === 'completed' ? tabActiveBorder : 'transparent',
              }}
            >
               <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'completed' ? tabActiveText : tabInactiveText }}>
                 Completed
               </Text>
               <View style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, marginLeft: 6 }}>
                 <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>{compCount}</Text>
               </View>
            </Pressable>
          </View>

          {activeList.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <EmptyState 
                  icon={activeTab === 'pending' ? '🕒' : '✅'} 
                  message={
                    activeTab === 'pending' ? 'No pending requirements.' : 
                    'You have no completed obligations.'
                  } 
                />
            </View>
          ) : activeList.map((o) => {
            const title = o.title || 'Consequence Task';
            const subtitle = o.organization || '—';
            const isCompleted = o.status === 'completed';
            
            const iconBg = isCompleted 
              ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') 
              : (isDark ? 'rgba(234,88,12,0.15)' : '#ffedd5');

            return (
               <View 
                 key={`con-${o.id}`} 
                 style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center' }}
               >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                     {isCompleted ? <CheckCircle size={20} color="#16a34a" /> : <AlertTriangle size={20} color="#ea580c" />}
                  </View>
                  
                  <View style={{ flex: 1 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginRight: 8, marginBottom: 4 }}>{title}</Text>
                        
                        <View style={{ backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : '#f3e8ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6, marginBottom: 4 }}>
                           <Text style={{ fontSize: 9, fontWeight: '700', color: '#9333ea' }}>Consequence</Text>
                        </View>
                        
                        <View style={{ backgroundColor: isCompleted ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 }}>
                           <Text style={{ fontSize: 9, fontWeight: '700', color: isCompleted ? '#15803d' : '#d97706', textTransform: 'capitalize' }}>{isCompleted ? 'Completed' : 'Pending'}</Text>
                        </View>
                     </View>

                     <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 8 }}>{subtitle}</Text>

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
               </View>
            );
          })}
          
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </OfficerPageWrapper>
  );
}
