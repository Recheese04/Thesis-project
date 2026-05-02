import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Alert, TextInput, Modal, Pressable } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import { API_BASE_URL } from '../../constants/Config';
import { Download, FileText, Trash2, Plus, Search, Calendar as CalendarIcon, HardDrive, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';

const categories = ['ACADEMIC', 'ORGANIZATION', 'CERTIFICATE', 'FINANCIAL', 'OTHER'];

export default function OfficerDocuments() {
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

  const primaryBtn = isDark ? '#475569' : '#0f172a';
  
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { membership } = useAuth();
  
  const orgId = membership?.organization_id;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', category: 'ACADEMIC', file: null as any });
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    if (!orgId) return;
    try {
      const res = await api.get(`/organizations/${orgId}/documents`);
      setDocs(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const handleDownload = (doc: any) => {
    const url = `${API_BASE_URL.replace('/api', '')}/api/documents/${doc.id}/download`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the document.'));
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/documents/${id}`);
          setDocs(prev => prev.filter(d => d.id !== id));
        } catch (err: any) {
          Alert.alert('Error', 'Failed to delete document.');
        }
      }}
    ]);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewDoc({ ...newDoc, file: result.assets[0] });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick a document.');
    }
  };

  const handleUpload = async () => {
    if (!newDoc.title.trim() || !newDoc.file) {
      Alert.alert('Error', 'Please provide a title and select a file.');
      return;
    }

    if (newDoc.file.size > 10 * 1024 * 1024) {
      Alert.alert('Error', 'File exceeds the 10MB limit.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', newDoc.title);
    formData.append('category', newDoc.category);
    
    formData.append('file', {
      uri: newDoc.file.uri,
      name: newDoc.file.name,
      type: newDoc.file.mimeType || 'application/octet-stream',
    } as any);

    try {
      const res = await api.post(`/organizations/${orgId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocs([res.data, ...docs]);
      setIsUploadOpen(false);
      setNewDoc({ title: '', category: 'ACADEMIC', file: null });
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = docs.filter(d => {
    const title = d.title || d.file_name || '';
    const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'All' || d.category?.toUpperCase() === categoryFilter;
    return matchSearch && matchCat;
  });

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="documents">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color="#2563eb" /></View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="documents">
      <View style={{ backgroundColor: cardBg, paddingTop: 24, paddingBottom: 16 }}>
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? '#f8fafc' : '#0f2d5e' }}>Documents</Text>
          <Text style={{ color: textSecondary, fontSize: 13, marginTop: 2 }}>Manage official organization documents and files.</Text>
          
          <TouchableOpacity 
            onPress={() => setIsUploadOpen(true)}
            style={{ backgroundColor: primaryBtn, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 16, width: 160 }}
          >
            <Plus size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 13 }}>Upload Document</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 8, zIndex: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: cardBg, marginBottom: 12 }}>
            <Search size={18} color={textMuted} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: textPrimary, paddingVertical: 0 }}
              placeholder="Search documents by title..."
              placeholderTextColor={textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <View style={{ position: 'relative', width: 160, zIndex: 50 }}>
            <TouchableOpacity 
              onPress={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: cardBg }}
            >
              <Text style={{ fontSize: 13, color: textPrimary, fontWeight: '600' }}>{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</Text>
              <ChevronDown size={16} color={textSecondary} />
            </TouchableOpacity>

            {isCategoryPickerOpen && (
              <View style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: modalBg, borderWidth: 1, borderColor: borderLight, borderRadius: 12, paddingVertical: 4, zIndex: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
                <TouchableOpacity onPress={() => { setCategoryFilter('All'); setIsCategoryPickerOpen(false); }} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderLight }}>
                  <Text style={{ fontSize: 13, color: categoryFilter === 'All' ? '#2563eb' : textPrimary, fontWeight: categoryFilter === 'All' ? '800' : '400' }}>All Categories</Text>
                </TouchableOpacity>
                {categories.map((cat, i) => (
                  <TouchableOpacity key={cat} onPress={() => { setCategoryFilter(cat); setIsCategoryPickerOpen(false); }} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < categories.length - 1 ? 1 : 0, borderBottomColor: borderLight }}>
                    <Text style={{ fontSize: 13, color: categoryFilter === cat ? '#2563eb' : textPrimary, fontWeight: categoryFilter === cat ? '800' : '400' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        style={{ flex: 1, backgroundColor: bg, zIndex: 10 }} // Behind the dropdown
        contentContainerStyle={{ paddingTop: 10 }}
      >
        <Pressable style={{ paddingHorizontal: 20, paddingBottom: 32 }} onPress={() => setIsCategoryPickerOpen(false)}>
          {filteredDocs.length === 0 ? (
            <EmptyState icon="📁" message={searchTerm || categoryFilter !== 'All' ? 'No matching documents found.' : 'No documents uploaded yet.'} />
          ) : (
            filteredDocs.map(doc => (
              <View key={doc.id} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <View style={{ backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : '#f5f3ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: isDark ? 'rgba(124,58,237,0.3)' : '#ede9fe', marginBottom: 8 }}>
                       <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#a78bfa' : '#7c3aed', textTransform: 'uppercase', letterSpacing: 1 }}>{doc.category || 'OTHER'}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary }} numberOfLines={2}>{doc.title || doc.file_name}</Text>
                  </View>
                  <View style={{ width: 40, height: 40, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: borderLight }}>
                     <FileText size={18} color={textSecondary} />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderLight, paddingBottom: 12, marginBottom: 12 }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                      <CalendarIcon size={12} color={textMuted} />
                      <Text style={{ fontSize: 12, color: textSecondary, marginLeft: 6 }}>{new Date(doc.created_at).toLocaleDateString()}</Text>
                   </View>
                   <Text style={{ color: border, marginRight: 12 }}>•</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <HardDrive size={12} color={textMuted} />
                      <Text style={{ fontSize: 12, color: textSecondary, marginLeft: 6 }}>{formatSize(doc.file_size)}</Text>
                   </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                   <TouchableOpacity 
                     style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: borderLight, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 12, paddingVertical: 10 }}
                     onPress={() => handleDownload(doc)}
                   >
                     <Download size={15} color={isDark ? '#93c5fd' : '#0f2d5e'} />
                     <Text style={{ marginLeft: 8, fontWeight: '700', color: isDark ? '#93c5fd' : '#0f2d5e', fontSize: 13 }}>Download</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={{ width: 44, backgroundColor: cardBg, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 10 }}
                     onPress={() => handleDelete(doc.id)}
                   >
                     <Trash2 size={16} color={textMuted} />
                   </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Pressable>
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={isUploadOpen} transparent animationType="slide" onRequestClose={() => !uploading && setIsUploadOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40 }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <View>
                 <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary }}>Upload Document</Text>
                 <Text style={{ fontSize: 13, color: textSecondary, marginTop: 2 }}>Maximum file size is 10MB.</Text>
              </View>
              {!uploading && (
                <TouchableOpacity onPress={() => setIsUploadOpen(false)} style={{ width: 32, height: 32, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: textSecondary, fontWeight: '800', lineHeight: 28 }}>x</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Document Title</Text>
              <TextInput
                style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: textPrimary, fontWeight: '500' }}
                placeholder="e.g. Master Member List"
                placeholderTextColor={textMuted}
                value={newDoc.title}
                onChangeText={t => setNewDoc({ ...newDoc, title: t })}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderWidth: 1, borderColor: borderLight, borderRadius: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', paddingLeft: 8, paddingVertical: 8 }}>
                {categories.map(c => (
                  <TouchableOpacity 
                    key={c}
                    onPress={() => setNewDoc({...newDoc, category: c})}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: newDoc.category === c ? '#2563eb' : 'transparent', backgroundColor: newDoc.category === c ? inputBg : 'transparent' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: newDoc.category === c ? '#2563eb' : textSecondary }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>File</Text>
              <TouchableOpacity 
                onPress={pickDocument}
                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: isDark ? '#475569' : '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}
              >
                {newDoc.file ? (
                  <View style={{ alignItems: 'center' }}>
                    <FileText size={32} color={isDark ? '#93c5fd' : '#0f2d5e'} />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginTop: 8 }}>{newDoc.file.name}</Text>
                    <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{formatSize(newDoc.file.size)}</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, backgroundColor: isDark ? '#334155' : '#f8fafc', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                       <Plus size={20} color={textMuted} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimary }}>Tap to select a document</Text>
                    <Text style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>Allowed formats: PDF, DOCX, JPG, PNG.</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#7c3aed', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: uploading ? 0.7 : 1 }}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? <ActivityIndicator color="#fff" size="small" /> : (
                 <>
                    <CheckCircle2 size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, marginLeft: 8 }}>Upload Document</Text>
                 </>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </OfficerPageWrapper>
  );
}
