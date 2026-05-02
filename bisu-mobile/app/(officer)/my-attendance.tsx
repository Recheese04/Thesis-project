import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerMyAttendance() {
  const { isDark, colors } = useTheme();
  // Dark mode colors
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
  const footerBg = isDark ? '#0f172a' : '#f8fafc';
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance/my');
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAttendance(); }, []);

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="my-attendance">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color="#2563eb" /></View>
    </OfficerPageWrapper>
  );

  const total = attendance.length;
  // For now, assume all fetched records are check-ins since the API only returns actual attendances
  const checkedIn = attendance.length;
  const missed = 0; // Missed events require querying student_consequences or cross-referencing total past events
  const rate = total > 0 ? 100 : 0;

  const formatTimeStr = (isoString: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const formatDateStr = (isoString: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <OfficerPageWrapper activeRoute="my-attendance">
      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAttendance(); }} />}
        showsVerticalScrollIndicator={false}
      >
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
                My Records
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                My Attendance
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} color={isDark ? '#94a3b8' : '#2563eb'} />
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
                source={require('../../tarsier-mascot/tar-attendance-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={attendance.length > 0 
                ? `You have attended ${attendance.length} events so far. Excellent work!` 
                : "You haven't attended any events yet. Check the events tab!"} 
            />
          </View>
        </View>

        {/* STATS GRID 2x2 */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          
          {/* Rate */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, width: '48%', padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: textSecondary, marginBottom: 8 }}>Attendance Rate</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary, marginBottom: 12 }}>{rate}%</Text>
            <View style={{ height: 6, width: '100%', backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
               <View style={{ height: '100%', backgroundColor: '#2563eb', borderRadius: 3 }} style={{ width: `${rate}%` }} />
            </View>
          </View>

          {/* Total */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, width: '48%', padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: textSecondary, marginBottom: 8 }}>Total Records</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary }}>{total}</Text>
          </View>

          {/* Checked In */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, width: '48%', padding: 16, borderWidth: 1, borderColor: border }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: textSecondary, marginBottom: 8 }}>Checked In</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <CheckCircle2 size={18} color="#16a34a" style={{ marginRight: 6 }} />
               <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary }}>{checkedIn}</Text>
            </View>
          </View>

          {/* Missed */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, width: '48%', padding: 16, borderWidth: 1, borderColor: border }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: textSecondary, marginBottom: 8 }}>Missed Events</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <XCircle size={18} color="#dc2626" style={{ marginRight: 6 }} />
               <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary }}>{missed}</Text>
            </View>
          </View>

        </View>

        {/* LIST SECTION */}
        <View style={{ backgroundColor: cardBg, marginHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: border, paddingTop: 24, paddingBottom: 8, marginBottom: 32 }}>
           
           <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary }}>Attendance Records</Text>
              <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>Your complete attendance history</Text>
           </View>

           <View style={{ paddingHorizontal: 20 }}>
              {attendance.length === 0 ? (
                 <View style={{ paddingVertical: 24 }}>
                    <EmptyState icon="📝" message="No attendance records found." />
                 </View>
              ) : attendance.map((record, index) => {
                 let duration = '—';
                 if (record.formatted_duration) {
                     duration = record.formatted_duration;
                 } else if (record.time_in && record.time_out) {
                     const ms = new Date(record.time_out).getTime() - new Date(record.time_in).getTime();
                     if (!isNaN(ms) && ms > 0) {
                         const mins = Math.floor(ms / 60000);
                         duration = `${mins}m`;
                     }
                 }

                 return (
                    <View key={record.id || index} style={{ marginBottom: 16, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16, backgroundColor: cardBg, marginTop: 4 }}>
                       
                       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <View style={{ flex: 1, paddingRight: 12 }}>
                             <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary, marginBottom: 2 }} numberOfLines={1}>
                               {record.event?.title || 'Unknown Event'}
                             </Text>
                             <Text style={{ fontSize: 11, color: '#3b82f6', marginBottom: 8 }} numberOfLines={1}>
                                {record.event?.organization?.name || 'Organization'}
                             </Text>
                             
                             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Calendar size={11} color="#94a3b8" />
                                <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 6, flex: 1 }} numberOfLines={1}>
                                   {formatDateStr(record.time_in)}
                                </Text>
                             </View>
                          </View>
                          
                          <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                             <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#6ee7b7' : '#15803d' }}>Checked In</Text>
                          </View>
                       </View>

                       {/* 3 Columns Footer */}
                       <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderLight }}>
                          <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 10, color: textMuted, fontWeight: '500', marginBottom: 2 }}>Check In</Text>
                             <Text style={{ fontSize: 11, fontWeight: '700', color: textPrimary }}>{formatTimeStr(record.time_in)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 10, color: textMuted, fontWeight: '500', marginBottom: 2 }}>Check Out</Text>
                             <Text style={{ fontSize: 11, fontWeight: '700', color: textPrimary }}>{formatTimeStr(record.time_out)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                             <Text style={{ fontSize: 10, color: textMuted, fontWeight: '500', marginBottom: 2 }}>Duration</Text>
                             <Text style={{ fontSize: 11, fontWeight: '700', color: textPrimary }}>{duration}</Text>
                          </View>
                       </View>

                    </View>
                 );
              })}
           </View>

        </View>
      </ScrollView>
    </OfficerPageWrapper>
  );
}
