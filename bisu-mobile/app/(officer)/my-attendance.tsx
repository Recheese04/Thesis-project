import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react-native';

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
        {/* HEADER */}
        <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary }}>My Attendance</Text>
          <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }}>View your attendance records</Text>
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
