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
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import Badge from '../../components/ui/Badge';
import {
  Users, CalendarRange, TrendingUp, ClipboardList,
  Plus, Bell, ChevronRight, DollarSign
} from 'lucide-react-native';

export default function OfficerDashboard() {
  const router = useRouter();
  const { user, membership } = useAuth();
  const { isDark, colors } = useTheme();
  const [stats, setStats] = useState<any>({
    totalMembers: 0, totalEvents: 0, upcomingEvents: 0,
    totalAttendance: 0, pendingTasks: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/dashboard/officer-stats'),
        api.get('/events?role=officer'),
      ]);
      const s = statsRes.data;
      const events = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      setStats({
        totalMembers: s.total_members || 0,
        totalEvents: s.total_events || 0,
        upcomingEvents: events.filter((e: any) => e.status === 'upcoming').length,
        totalAttendance: s.total_attendance || 0,
        pendingTasks: s.pending_obligations || 0,
      });
      setRecentEvents(events.slice(0, 5));
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  const orgId = membership?.organization_id;

  useEffect(() => { fetchData(); }, [orgId]);

  // Dark mode colors
  const bg = colors.background;
  const cardBg = isDark ? '#1e293b' : '#fff';
  const statBg = isDark ? '#0f172a' : '#f8fafc';
  const statBorder = isDark ? '#334155' : '#f1f5f9';
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textMuted;
  const border = isDark ? '#334155' : '#f1f5f9';
  const actionBg = isDark ? '#1e293b' : '#fff';
  const actionBorder = isDark ? '#334155' : '#e2e8f0';
  const actionIconColor = isDark ? '#94a3b8' : '#64748b';
  const actionTextColor = isDark ? '#cbd5e1' : '#475569';

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers, sub: 'Active memberships', icon: <Users size={20} color="#2563eb" />, iconBg: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' },
    { label: 'Events (S.Y.)', value: stats.totalEvents, sub: `${stats.upcomingEvents} upcoming`, subColor: '#2563eb', icon: <CalendarRange size={20} color="#7c3aed" />, iconBg: isDark ? 'rgba(124,58,237,0.15)' : '#faf5ff' },
    { label: 'Attendances', value: stats.totalAttendance, sub: 'Yearly scan records', icon: <TrendingUp size={20} color="#059669" />, iconBg: isDark ? 'rgba(5,150,105,0.15)' : '#ecfdf5' },
    { label: 'Pending Actions', value: stats.pendingTasks, sub: 'Needs attention', subColor: '#d97706', icon: <ClipboardList size={20} color="#d97706" />, iconBg: isDark ? 'rgba(217,119,6,0.15)' : '#fffbeb' },
  ];

  return (
    <OfficerPageWrapper activeRoute="index">
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
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
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.first_name || 'Officer'}!
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
              message={`Your organization is looking great! You have ${stats.upcomingEvents} upcoming events and ${stats.pendingTasks} pending tasks.`} 
            />
          </View>
        </View>

        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingBottom: 20 }}>

          {/* Stats Grid */}
          <View style={{ marginTop: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {statCards.slice(0, 2).map((card, idx) => (
                <View key={idx} style={{ flex: 1, backgroundColor: statBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: statBorder }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{card.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: card.iconBg, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                      {card.icon}
                    </View>
                    <View>
                      <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>{card.value}</Text>
                      <Text style={{ fontSize: 10, color: card.subColor || textSecondary, fontWeight: '500' }}>{card.sub}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {statCards.slice(2, 4).map((card, idx) => (
                <View key={idx} style={{ flex: 1, backgroundColor: statBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: statBorder }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{card.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: card.iconBg, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                      {card.icon}
                    </View>
                    <View>
                      <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>{card.value}</Text>
                      <Text style={{ fontSize: 10, color: card.subColor || textSecondary, fontWeight: '500' }}>{card.sub}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Recent Events */}
        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Recent Events</Text>
          <Text style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Latest organization events</Text>

          {recentEvents.length === 0 ? (
            <EmptyState icon="📅" message="No events found." />
          ) : recentEvents.map(event => (
            <View key={event.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '500' }}>
                    {new Date(event.event_date || event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 20 }}>
                    {new Date(event.event_date || event.start_time).getDate()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: textPrimary, fontSize: 14 }} numberOfLines={1}>{event.title}</Text>
                  <Text style={{ fontSize: 12, color: textSecondary }}>{event.location || event.venue || 'Location TBA'}</Text>
                </View>
              </View>
              <Badge
                label={event.status || 'upcoming'}
                type={event.status === 'upcoming' ? 'pending' : event.status === 'ongoing' ? 'active' : 'default'}
              />
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={{ backgroundColor: cardBg, marginTop: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Quick Actions</Text>
          <Text style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Common tasks</Text>

          {[
            { icon: <Plus size={16} color={actionIconColor} />, label: 'Create Event', route: '/(officer)/events' },
            { icon: <Users size={16} color={actionIconColor} />, label: 'Manage Members', route: '/(officer)/members' },
            { icon: <Bell size={16} color={actionIconColor} />, label: 'Send Announcement', route: '/(officer)/announcements' },
            { icon: <ClipboardList size={16} color={actionIconColor} />, label: 'Manage Obligations', route: '/(officer)/obligations' },
            { icon: <DollarSign size={16} color={actionIconColor} />, label: 'Manage Fees', route: '/(officer)/fees' },
          ].map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: actionBorder, borderRadius: 12, marginBottom: 10 }}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              {action.icon}
              <Text style={{ marginLeft: 12, fontWeight: '600', color: actionTextColor, fontSize: 14 }}>{action.label}</Text>
              <View style={{ flex: 1 }} />
              <ChevronRight size={14} color={textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={{ backgroundColor: cardBg, marginTop: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Recent Activity</Text>
          <Text style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Latest actions in your organization</Text>

          {[
            { title: 'New member joined', sub: 'Check the members list' },
            { title: 'Event created', sub: 'New organization event' },
            { title: 'Attendance recorded', sub: 'Scan records updated' },
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: idx < 2 ? 1 : 0, borderBottomColor: border }}>
              <View>
                <Text style={{ fontWeight: '500', color: textPrimary, fontSize: 14 }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: textSecondary }}>{item.sub}</Text>
              </View>
              <Text style={{ fontSize: 12, color: textMuted }}>Recently</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </OfficerPageWrapper>
  );
}
