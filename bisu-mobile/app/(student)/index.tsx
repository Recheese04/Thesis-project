import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import {
  Calendar, CheckCircle2, Clock, Award,
  QrCode, CalendarDays, Activity, Bell, ChevronRight, CalendarOff, CheckCheck,
} from 'lucide-react-native';

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [obligations, setObligations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [eventsRes, oblRes, annRes, attRes] = await Promise.all([
        api.get('/events/upcoming'),
        api.get('/student/obligations'),
        api.get('/student/announcements'),
        api.get('/student/attendance').catch(() => ({ data: [] })),
      ]);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      
      const oblData = oblRes.data || {};
      const fees = Array.isArray(oblData.fees) ? oblData.fees : [];
      const consequences = Array.isArray(oblData.consequences) ? oblData.consequences : [];
      setObligations([...fees, ...consequences]);
      
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);
      const attData = Array.isArray(attRes.data) ? attRes.data : [];
      setAttendanceRecords(attData);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalEvents = events.length;
  const attended = attendanceRecords.filter((a: any) => a.status === 'present').length;
  const upcomingCount = events.filter(e => new Date(e.start_time) > new Date()).length;
  const attendancePct = totalEvents > 0 ? Math.round((attended / totalEvents) * 100) : 0;

  // Dark mode adaptive colors
  const cardBg = isDark ? '#1e293b' : '#fff';
  const cardBorder = isDark ? '#334155' : '#f1f5f9';
  const quickActionBg = isDark ? '#334155' : '#f8fafc';
  const quickActionIconBg = isDark ? '#1e293b' : '#fff';
  const dateBg = isDark ? '#1e1b4b' : '#f0f4ff';
  const dateTextMonth = isDark ? '#a5b4fc' : '#4f46e5';
  const dateTextDay = isDark ? '#c7d2fe' : '#3730a3';
  const eventTitleColor = isDark ? '#f1f5f9' : '#1e1b4b';
  const eventSubColor = isDark ? '#94a3b8' : '#64748b';
  const emptyIconColor = isDark ? '#475569' : '#cbd5e1';
  const emptyTextColor = isDark ? '#64748b' : '#94a3b8';
  const statusBg = isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  return (
    <StudentPageWrapper activeRoute="index" unreadAnnouncements={announcements.length}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Area */}
        <View style={{ paddingTop: 20, paddingBottom: 10, backgroundColor: isDark ? colors.card : '#ffffff', position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative Background Circles */}
          <View style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: '#4ade80',
            opacity: 0.1,
            zIndex: 0
          }} />
          <View style={{
            position: 'absolute',
            top: 60,
            left: -20,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#22c55e',
            opacity: 0.08,
            zIndex: 0
          }} />

          {/* Greeting & Date */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16, zIndex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 }}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.first_name || 'there'}!
            </Text>
          </View>

          {/* Mascot & Chat Area */}
          <View style={{ position: 'relative', minHeight: 120, justifyContent: 'flex-end', paddingBottom: 10, marginTop: 10 }}>
            
            {/* Flat Green Bar Background (Gradient) */}
            <LinearGradient
              colors={['#4ade80', '#16a34a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 50,
                zIndex: 0,
              }}
            />

            {/* Mascot Image Wrapper (for clipping to half-body) */}
            <View style={{ 
              position: 'absolute', 
              left: -20, 
              bottom: 0, 
              width: 210, 
              height: 180, 
              overflow: 'hidden',
              zIndex: 10 
            }}>
              <Image 
                source={require('../../tarsier-mascot/tar-wave-nobg.png')} 
                style={{ 
                  position: 'absolute', 
                  left: -60, 
                  bottom: -130, // Push his legs completely out of view
                  width: 360, 
                  height: 360, 
                }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={`You have ${upcomingCount} upcoming events. Don't forget to check in! Your current attendance rate is ${attendancePct}%.`} 
            />
          </View>
        </View>

        {/* Dynamic Stats Grid */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard 
              label="Total Events" 
              value={totalEvents} 
              desc="Events registered" 
              icon={<Calendar size={20} color="#fff" />} 
              gradient={['#6366f1', '#4f46e5']}
              isDark={isDark}
            />
            <StatCard 
              label="Attended" 
              value={attended} 
              desc="Successfully completed" 
              icon={<CheckCircle2 size={20} color="#fff" />} 
              gradient={['#10b981', '#059669']}
              isDark={isDark}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard 
              label="Upcoming" 
              value={upcomingCount} 
              desc="Events scheduled" 
              icon={<Clock size={20} color="#fff" />} 
              gradient={['#f59e0b', '#d97706']}
              isDark={isDark}
            />
            <StatCard 
              label="Attendance" 
              value={`${attendancePct}%`} 
              desc="Overall completion" 
              icon={<Award size={20} color="#fff" />} 
              gradient={['#8b5cf6', '#7c3aed']}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 }}>Quick Actions</Text>
          <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: cardBorder, shadowColor: colors.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <QuickAction 
                title="Check In" subtitle="Scan QR" 
                icon={<QrCode size={20} color={isDark ? '#a5b4fc' : '#4f46e5'} />} 
                onPress={() => router.push('/(student)/attendance')} isDark={isDark}
              />
              <QuickAction 
                title="Events" subtitle="Browse" 
                icon={<CalendarDays size={20} color={isDark ? '#6ee7b7' : '#059669'} />} 
                onPress={() => router.push('/(student)/events')} isDark={isDark}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <QuickAction 
                title="History" subtitle="Attendance" 
                icon={<Activity size={20} color={isDark ? '#fcd34d' : '#d97706'} />} 
                onPress={() => router.push('/(student)/attendance')} isDark={isDark}
              />
              <QuickAction 
                title="Alerts" subtitle="Updates" 
                icon={<Bell size={20} color={isDark ? '#fca5a5' : '#dc2626'} />} 
                onPress={() => router.push('/(student)/announcements')} isDark={isDark}
              />
            </View>
          </View>
        </View>

        {/* Bottom Lists */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 24, paddingBottom: 40, alignItems: 'flex-start' }}>
          
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: cardBorder, shadowColor: colors.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary, fontSize: 14 }}>Upcoming</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/events')}>
                <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>View All</Text>
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <CalendarOff size={24} color={emptyIconColor} />
                <Text style={{ color: emptyTextColor, fontSize: 11, textAlign: 'center', marginTop: 8 }}>No upcoming events</Text>
              </View>
            ) : events.slice(0, 3).map(ev => (
              <View key={ev.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: dateBg, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: dateTextMonth, textTransform: 'uppercase' }}>
                    {new Date(ev.start_time).toLocaleString('default', { month: 'short' })}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: dateTextDay, lineHeight: 16 }}>
                    {new Date(ev.start_time).getDate()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: eventTitleColor }} numberOfLines={1}>{ev.title}</Text>
                  <Text style={{ fontSize: 10, color: eventSubColor }} numberOfLines={1}>{ev.venue || 'TBA'}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: cardBorder, shadowColor: colors.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary, fontSize: 14 }}>Attendance</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/attendance')}>
                <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>View All</Text>
              </TouchableOpacity>
            </View>
            {attendanceRecords.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <CheckCheck size={24} color={emptyIconColor} />
                <Text style={{ color: emptyTextColor, fontSize: 11, textAlign: 'center', marginTop: 8 }}>No records found</Text>
              </View>
            ) : attendanceRecords.slice(0, 3).map((rec: any, idx: number) => (
               <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, backgroundColor: rec.status === 'present' ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : (isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2'), borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  {rec.status === 'present' ? <CheckCircle2 size={16} color="#10b981" /> : <Activity size={16} color="#ef4444" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: eventTitleColor }} numberOfLines={1}>{rec.event?.title || 'Event'}</Text>
                  <Text style={{ fontSize: 10, color: eventSubColor, textTransform: 'capitalize' }} numberOfLines={1}>{rec.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </StudentPageWrapper>
  );
}

function StatCard({ label, value, desc, icon, gradient, isDark }: any) {
  const cardBg = isDark ? '#1e293b' : '#fff';
  const labelColor = isDark ? '#64748b' : '#94a3b8';
  const valueColor = isDark ? '#f1f5f9' : '#1e1b4b';
  const descColor = isDark ? '#64748b' : '#64748b';
  const borderColor = isDark ? '#334155' : '#f1f5f9';

  return (
    <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 24, padding: 16, borderWidth: 1, borderColor, shadowColor: '#000', shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '800', color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: valueColor, letterSpacing: -0.5 }}>{value}</Text>
        </View>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </LinearGradient>
      </View>
      <Text style={{ fontSize: 11, color: descColor, fontWeight: '500' }}>{desc}</Text>
    </View>
  );
}

function QuickAction({ title, subtitle, icon, onPress, isDark }: any) {
  const bg = isDark ? '#334155' : '#f8fafc';
  const iconBg = isDark ? '#1e293b' : '#fff';
  const titleColor = isDark ? '#f1f5f9' : '#1e1b4b';
  const subColor = isDark ? '#64748b' : '#94a3b8';
  const borderColor = isDark ? '#475569' : '#f1f5f9';

  return (
    <TouchableOpacity 
      onPress={onPress} activeOpacity={0.7}
      style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor }}
    >
      <View style={{ width: 36, height: 36, backgroundColor: iconBg, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: titleColor }}>{title}</Text>
        <Text style={{ fontSize: 10, color: subColor, fontWeight: '500' }}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}
