import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useTheme } from '../../context/ThemeContext';
import { Plus, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerAnnouncements() {
  const { isDark, colors } = useTheme();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { membership } = useAuth();
  
  const orgId = membership?.organization_id;

  const bg = isDark ? '#0f172a' : '#fff';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#334155' : '#fff';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';
  const inputText = isDark ? '#f1f5f9' : '#1e293b';
  const modalBg = isDark ? '#1e293b' : '#fff';
  const modalFooterBg = isDark ? '#0f172a' : '#f8fafc';

  const fetchData = async () => {
    try {
      if (orgId) {
        const res = await api.get(`/organizations/${orgId}/announcements`);
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      }
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required.');
      return;
    }
    if (!orgId) return;
    setSubmitting(true);
    try {
      await api.post(`/organizations/${orgId}/announcements`, { title, content });
      setModalVisible(false);
      setTitle(''); setContent('');
      fetchData();
      Alert.alert('Success', 'Announcement posted successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to post announcement.');
    }
    setSubmitting(false);
  };

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="announcements">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="announcements">
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
                Organization Updates
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                Announcements
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2d5e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                  onPress={() => setModalVisible(true)}
               >
                  <Plus size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Post</Text>
               </TouchableOpacity>
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
              message={`You have ${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}. Keep everyone informed!`} 
            />
          </View>
        </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {announcements.length === 0
            ? <EmptyState icon="📢" message="No announcements yet." />
            : announcements.map(a => (
              <View key={a.id} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, borderLeftWidth: a.is_pinned ? 4 : 1, borderLeftColor: a.is_pinned ? '#f59e0b' : border }}>
                {a.is_pinned && <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: '700', marginBottom: 8 }}>📌 Pinned</Text>}
                <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary, marginBottom: 8 }}>{a.title}</Text>
                <Text style={{ fontSize: 14, color: textSecondary, lineHeight: 20 }} numberOfLines={4}>{a.content}</Text>
                <Text style={{ fontSize: 11, color: textMuted, textAlign: 'right', marginTop: 8 }}>{new Date(a.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create Announcement Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '90%' }}>
            
            <View style={{ backgroundColor: '#0f2d5e', paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                   <Plus size={20} color="#fff" />
                </View>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>New Announcement</Text>
                  <Text style={{ color: '#93c5fd', fontSize: 12, marginTop: 2 }}>Post an update to your members</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: textSecondary, marginBottom: 6, marginLeft: 4 }}>Title <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: inputText }}
                  placeholder="Title of announcement"
                  placeholderTextColor={textMuted}
                  value={title} onChangeText={setTitle}
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: textSecondary, marginBottom: 6, marginLeft: 4 }}>Content <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: inputText, minHeight: 120, textAlignVertical: 'top' }}
                  placeholder="What do you want to say?"
                  placeholderTextColor={textMuted}
                  multiline
                  value={content} onChangeText={setContent}
                />
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>
            
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: border, backgroundColor: modalFooterBg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
               <TouchableOpacity 
                 style={{ flex: 1, borderWidth: 1, borderColor: border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginRight: 8, backgroundColor: cardBg }}
                 onPress={() => setModalVisible(false)}
               >
                 <Text style={{ color: textSecondary, fontWeight: '700' }}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={{ flex: 2, backgroundColor: '#0f2d5e', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
                 onPress={handleSubmit}
                 disabled={submitting}
               >
                 {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Post Announcement</Text>
                 )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </OfficerPageWrapper>
  );
}
