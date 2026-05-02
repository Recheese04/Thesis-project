import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
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
        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>Announcements 📢</Text>
          <Text style={{ fontSize: 14, color: textSecondary, marginTop: 4 }}>{announcements.length} posts</Text>
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
