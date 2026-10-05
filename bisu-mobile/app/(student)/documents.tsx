import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';
import { Download, Calendar } from 'lucide-react-native';
import SchoolYearFilterModal from '../../components/ui/SchoolYearFilterModal';

const categoryIcon: Record<string, string> = {
  minutes: '📝', financial: '💰', general: '📄', report: '📊', other: '📁',
};

export default function StudentDocuments() {
  const { isDark, colors } = useTheme();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // School Year Filter state
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedYearId, setSelectedYearId] = useState<number | string>('all');
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const catColor = isDark ? '#93c5fd' : '#2563eb';

  const fetchData = async () => {
    try {
      const params: any = {};
      if (selectedYearId && selectedYearId !== 'all') {
        params.school_year_id = selectedYearId;
      }
      const res = await api.get('/student/documents', { params });
      setDocs(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [selectedYearId]);

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
        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>Documents 📁</Text>
            <Text style={{ fontSize: 14, color: textSecondary, marginTop: 4 }}>{docs.length} files</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsYearModalOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: selectedYear !== 'All' ? '#7c3aed' : border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: selectedYear !== 'All' ? (isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff') : cardBg }}
          >
            <Calendar size={14} color={selectedYear !== 'All' ? '#7c3aed' : textSecondary} />
            <Text style={{ fontSize: 12, color: selectedYear !== 'All' ? '#7c3aed' : textPrimary, fontWeight: '600', marginLeft: 4 }}>
              {selectedYear === 'All' ? 'All S.Y.' : `S.Y. ${selectedYear}`}
            </Text>
          </TouchableOpacity>
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

      <SchoolYearFilterModal
        visible={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        selectedYear={selectedYear}
        onSelectYear={(name, id) => {
          setSelectedYear(name);
          setSelectedYearId(id);
        }}
      />

    </StudentPageWrapper>
  );
}
