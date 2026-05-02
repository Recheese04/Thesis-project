import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { Bell } from 'lucide-react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import { useTheme } from '../../context/ThemeContext';

export default function StudentAnnouncements() {
  const { isDark, colors } = useTheme();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const orgBadgeBg = isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff';
  const orgBadgeText = isDark ? '#93c5fd' : '#2563eb';
  const pinnedBorder = isDark ? '#92400e' : '#fbbf24';

  const fetchData = async () => {
    try {
      const res = await api.get('/student/announcements');
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <StudentPageWrapper activeRoute="announcements">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </StudentPageWrapper>
  );

  return (
    <StudentPageWrapper activeRoute="announcements">
      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Area with Tarsi */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative Background Circles */}
          <View style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#3b82f6', opacity: 0.1, zIndex: 0
          }} />
          <View style={{
            position: 'absolute', top: 60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#2563eb', opacity: 0.08, zIndex: 0
          }} />

          {/* Title & Quick Actions */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                Stay Informed
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                Announcements
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={16} color={isDark ? '#94a3b8' : '#2563eb'} />
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
                source={require('../../tarsier-mascot/tar-announcement-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={announcements.length > 0 
                ? `You have ${announcements.length} new announcement${announcements.length !== 1 ? 's' : ''}! Stay updated with the latest news.` 
                : "No new announcements yet. Check back later for updates!"} 
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {announcements.length === 0
            ? <EmptyState icon="📢" message="No announcements from your organizations." />
            : announcements.map(a => (
              <View key={a.id} style={{ 
                backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, 
                borderWidth: 1, borderColor: border,
                borderLeftWidth: a.is_pinned ? 4 : 1, borderLeftColor: a.is_pinned ? pinnedBorder : border,
                shadowColor: '#000', shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 4, elevation: 1
              }}>
                {a.is_pinned && <Text style={{ fontSize: 12, color: '#d97706', fontWeight: '700', marginBottom: 8 }}>📌 Pinned</Text>}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ backgroundColor: orgBadgeBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: orgBadgeText }}>{a.organization?.name ?? 'Organization'}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: textMuted }}>{new Date(a.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary, marginBottom: 8 }}>{a.title}</Text>
                <Text style={{ fontSize: 14, color: textSecondary, lineHeight: 20 }}>{a.content}</Text>
              </View>
            ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </StudentPageWrapper>
  );
}
