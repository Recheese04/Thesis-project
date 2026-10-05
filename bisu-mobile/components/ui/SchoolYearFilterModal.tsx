import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Calendar, CheckCircle2, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

interface SchoolYearFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedYear: string;
  onSelectYear: (yearName: string, yearId: number | string) => void;
  title?: string;
  allowAll?: boolean;
}

export default function SchoolYearFilterModal({
  visible,
  onClose,
  selectedYear,
  onSelectYear,
  title = 'Select School Year',
  allowAll = true,
}: SchoolYearFilterModalProps) {
  const { isDark } = useTheme();

  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const [schoolYears, setSchoolYears] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      api.get('/school-years')
        .then(res => {
          if (Array.isArray(res.data)) {
            setSchoolYears(res.data);
          }
        })
        .catch(() => {});
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: cardBg,
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : '#f5f3ff', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color="#7c3aed" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textPrimary }}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {allowAll && (
              <TouchableOpacity
                onPress={() => {
                  onSelectYear('All', 'all');
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selectedYear === 'All' ? '#7c3aed' : border,
                  backgroundColor: selectedYear === 'All' ? (isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff') : cardBg,
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: selectedYear === 'All' ? '#7c3aed' : textPrimary }}>
                    All School Years
                  </Text>
                  <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                    Show all records across all academic years
                  </Text>
                </View>
                {selectedYear === 'All' && <CheckCircle2 size={18} color="#7c3aed" />}
              </TouchableOpacity>
            )}

            {schoolYears.map((sy) => {
              const isSelected = String(selectedYear) === String(sy.name) || String(selectedYear) === String(sy.id);
              return (
                <TouchableOpacity
                  key={sy.id}
                  onPress={() => {
                    onSelectYear(sy.name, sy.id);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#7c3aed' : border,
                    backgroundColor: isSelected ? (isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff') : cardBg,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#7c3aed' : textPrimary }}>
                        S.Y. {sy.name}
                      </Text>
                      {sy.is_active && (
                        <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#10b981' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                      {sy.is_active ? 'Current active academic year' : 'Archived academic year records'}
                    </Text>
                  </View>
                  {isSelected && <CheckCircle2 size={18} color="#7c3aed" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
