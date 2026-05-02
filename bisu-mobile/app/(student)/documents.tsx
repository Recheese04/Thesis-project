import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';
import { Download } from 'lucide-react-native';

const categoryIcon: Record<string, string> = {
  minutes: '📝', financial: '💰', general: '📄', report: '📊', other: '📁',
};

export default function StudentDocuments() {
  const { isDark, colors } = useTheme();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const catColor = isDark ? '#93c5fd' : '#2563eb';

  const fetchData = async () => {
    try {
      const res = await api.get('/student/documents');
      setDocs(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDownload = (doc: any) => {
    const url = `${API_BASE_URL.replace('/api', '')}/api/documents/${doc.id}/download`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the document.'));
  };

  if (loading) return (
    <StudentPageWrapper activeRoute="documents">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </StudentPageWrapper>
  );

  return (
    <StudentPageWrapper activeRoute="documents">
      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>Documents 📁</Text>
          <Text style={{ fontSize: 14, color: textSecondary, marginTop: 4 }}>{docs.length} files</Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {docs.length === 0
            ? <EmptyState icon="📁" message="No documents shared yet." />
            : docs.map(doc => (
              <TouchableOpacity key={doc.id} onPress={() => handleDownload(doc)} activeOpacity={0.7}
                style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: border }}
              >
                <Text style={{ fontSize: 28, marginRight: 16 }}>{categoryIcon[doc.category?.toLowerCase()] ?? '📄'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary }} numberOfLines={2}>{doc.name ?? doc.file_name}</Text>
                  <Text style={{ fontSize: 12, color: catColor, fontWeight: '600', marginTop: 4 }}>{doc.category} · {doc.organization?.name}</Text>
                  <Text style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{new Date(doc.created_at).toLocaleDateString()}</Text>
                </View>
                <Download size={20} color={colors.accent} />
              </TouchableOpacity>
            ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </StudentPageWrapper>
  );
}
