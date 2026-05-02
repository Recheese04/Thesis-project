import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert, Modal, Pressable, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import { AlertTriangle, Plus, X, ChevronDown, Calendar, Trash2, Pencil } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerConsequences() {
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
  
  // Custom module colors (Purple/Blue for consequences)
  const primaryBg = isDark ? 'rgba(139,61,255,0.15)' : '#efe5ff';
  const primarySolid = isDark ? '#9d5cff' : '#8b3dff';
  const primaryText = isDark ? '#c096ff' : '#8b3dff';
  
  const alertBg = isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff';
  const alertBorder = isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe';
  const alertText = isDark ? '#93c5fd' : '#1e40af';
  const alertIconColor = isDark ? '#60a5fa' : '#2563eb';

  const [rules, setRules] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDays, setDueDays] = useState('7');
  const [type, setType] = useState('task');
  const [feeTypeId, setFeeTypeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isFeePickerOpen, setIsFeePickerOpen] = useState(false);

  const { membership } = useAuth();
  const orgId = membership?.organization_id;

  const fetchData = async () => {
    if (!orgId) return;
    try {
      const [rulesRes, eventsRes, feeTypesRes] = await Promise.all([
        api.get(`/organizations/${orgId}/consequence-rules`),
        api.get(`/events?role=officer`),
        api.get(`/fee-types`)
      ]);
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : []);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setFeeTypes(Array.isArray(feeTypesRes.data.fees) ? feeTypesRes.data.fees : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const openCreate = () => {
    setEditingId(null);
    setEventId('');
    setTitle('');
    setDescription('');
    setDueDays('7');
    setType('task');
    setFeeTypeId('');
    setModalVisible(true);
  };

  const openEdit = (rule: any) => {
    setEditingId(rule.id);
    setEventId(rule.event_id ? rule.event_id.toString() : '');
    setTitle(rule.consequence_title);
    setDescription(rule.consequence_description || '');
    setDueDays(rule.due_days.toString());
    setType(rule.type || 'task');
    setFeeTypeId(rule.fee_type_id ? rule.fee_type_id.toString() : '');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !dueDays.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (type === 'financial' && !feeTypeId) {
      Alert.alert('Error', 'Please select a fee type for financial consequences.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        event_id: eventId || null,
        consequence_title: title,
        consequence_description: description,
        due_days: parseInt(dueDays, 10),
        type,
        fee_type_id: type === 'financial' ? feeTypeId : null,
      };

      if (editingId) {
        await api.put(`/consequence-rules/${editingId}`, payload);
      } else {
        await api.post(`/organizations/${orgId}/consequence-rules`, payload);
      }

      setModalVisible(false);
      fetchData();
      Alert.alert('Success', `Consequence rule ${editingId ? 'updated' : 'added'} successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save rule.');
    }
    setSubmitting(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Rule', 'Delete this consequence rule?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/consequence-rules/${id}`);
          setRules(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
          Alert.alert('Error', 'Failed to delete rule.');
        }
      }}
    ]);
  };

  const getConsequenceTypeColor = (type: string) => {
    switch (type) {
      case 'financial': return '#ef4444'; // Red
      case 'task': return '#8b3dff'; // Purple
      case 'warning': return '#f59e0b'; // Amber
      case 'suspension': return '#dc2626'; // Dark Red
      default: return '#64748b';
    }
  };

  const getConsequenceTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="consequences">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color={primarySolid} /></View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="consequences">
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
                Automated Actions
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                Consequences
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: primarySolid, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                  onPress={openCreate}
               >
                  <Plus size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Rule</Text>
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
                source={require('../../tarsier-mascot/tar-consequences-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={`You have ${rules.length} active rule${rules.length !== 1 ? 's' : ''}! Set up automated penalties for absences.`} 
            />
          </View>
        </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 4, backgroundColor: alertBg, borderWidth: 1, borderColor: alertBorder, borderRadius: 12, padding: 16, flexDirection: 'row' }}>
          <View style={{ marginRight: 12, marginTop: 2 }}>
            <AlertTriangle size={18} color={alertIconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: alertText, fontSize: 13, lineHeight: 18 }}>
              Closing an event automatically checks absences and assigns these rules. <Text style={{ fontWeight: '800' }}>Financial rules</Text> automatically create a student fee.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          {rules.length === 0 ? (
            <EmptyState icon="⚖️" message="No consequence rules defined." />
          ) : (
            rules.map(rule => (
              <View key={rule.id} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingRight: 8, rowGap: 8 }}>
                     <View style={{ backgroundColor: primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(139,61,255,0.3)' : 'transparent', marginRight: 10 }}>
                       <Text style={{ fontSize: 11, fontWeight: '800', color: primaryText, textTransform: 'capitalize' }}>
                         {rule.event?.title || 'All Events'}
                       </Text>
                     </View>
                     <View style={{ backgroundColor: isDark ? 'rgba(100,116,139,0.1)' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: getConsequenceTypeColor(rule.type), textTransform: 'uppercase' }}>
                          {getConsequenceTypeLabel(rule.type)}
                        </Text>
                     </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <TouchableOpacity 
                       onPress={() => openEdit(rule)}
                       style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#334155' : '#fff' }}
                    >
                      <Pencil size={15} color={textSecondary} strokeWidth={2.5}/>
                    </TouchableOpacity>
                    <TouchableOpacity 
                       onPress={() => handleDelete(rule.id)}
                       style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fee2e2', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fff' }}
                    >
                      <Trash2 size={15} color={isDark ? '#fca5a5' : '#ef4444'} strokeWidth={2.5}/>
                    </TouchableOpacity>
                  </View>

                </View>
                
                <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary, marginBottom: 8 }}>
                  {rule.consequence_title}
                </Text>

                {rule.type === 'financial' && rule.fee_type && (
                  <View style={{ backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', padding: 10, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7' }}>
                    <Text style={{ fontSize: 12, color: isDark ? '#4ade80' : '#16a34a', fontWeight: '700' }}>
                      Linked Fine: {rule.fee_type.name} — ₱{rule.fee_type.amount}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Calendar size={13} color={textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>
                    Due {rule.due_days} day{rule.due_days !== 1 ? 's' : ''} after event
                  </Text>
                </View>
                {!!rule.consequence_description && (
                  <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', marginTop: 4 }}>{rule.consequence_description}</Text>
                )}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create/Edit Rule Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: modalBg, borderRadius: 24, width: '100%', maxWidth: 450, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>{editingId ? 'Edit Consequence Rule' : 'New Consequence Rule'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '85%' }}>
              <View style={{ marginBottom: 16, zIndex: 100 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>
                  Apply to Event <Text style={{ fontWeight: '400', color: textMuted }}>(optional)</Text>
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsEventPickerOpen(!isEventPickerOpen)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: inputBg }}
                >
                  <Text style={{ fontSize: 14, color: textPrimary }}>
                    {eventId === '' ? 'All Events' : (events.find(e => e.id.toString() === eventId)?.title || 'Unknown Event')}
                  </Text>
                  <ChevronDown size={16} color={textSecondary} />
                </TouchableOpacity>

                {isEventPickerOpen && (
                  <View style={{ marginTop: 4, backgroundColor: modalBg, borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}>
                    <TouchableOpacity onPress={() => { setEventId(''); setIsEventPickerOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: borderLight }}>
                      <Text style={{ color: textPrimary }}>All Events</Text>
                    </TouchableOpacity>
                    {events.map((ev) => (
                      <TouchableOpacity key={ev.id} onPress={() => { setEventId(ev.id.toString()); setIsEventPickerOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: borderLight }}>
                        <Text style={{ color: textPrimary }} numberOfLines={1}>{ev.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ marginBottom: 16, zIndex: 90 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>Consequence Type</Text>
                <TouchableOpacity 
                  onPress={() => setIsTypePickerOpen(!isTypePickerOpen)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: primarySolid, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: inputBg }}
                >
                  <Text style={{ fontSize: 14, color: textPrimary, fontWeight: '700' }}>{getConsequenceTypeLabel(type)}</Text>
                  <ChevronDown size={16} color={textSecondary} />
                </TouchableOpacity>

                {isTypePickerOpen && (
                  <View style={{ marginTop: 4, backgroundColor: modalBg, borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}>
                    {['task', 'financial', 'warning', 'suspension'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => { setType(t); setIsTypePickerOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: borderLight }}>
                        <Text style={{ color: textPrimary }}>{getConsequenceTypeLabel(t)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {type === 'financial' && (
                <View style={{ marginBottom: 16, zIndex: 80 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>Link to Fee Type <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TouchableOpacity 
                    onPress={() => setIsFeePickerOpen(!isFeePickerOpen)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#22c55e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: inputBg }}
                  >
                    <Text style={{ fontSize: 14, color: textPrimary }}>
                      {feeTypeId === '' ? 'Select a Fine/Fee' : (feeTypes.find(f => f.id.toString() === feeTypeId)?.name || 'Unknown Fee')}
                    </Text>
                    <ChevronDown size={16} color={textSecondary} />
                  </TouchableOpacity>

                  {isFeePickerOpen && (
                    <View style={{ marginTop: 4, backgroundColor: modalBg, borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}>
                      {feeTypes.length === 0 ? (
                        <View style={{ padding: 12 }}><Text style={{ color: textMuted }}>No fee types found.</Text></View>
                      ) : (
                        feeTypes.map((f) => (
                          <TouchableOpacity key={f.id} onPress={() => { setFeeTypeId(f.id.toString()); setTitle(`Fine: ${f.name}`); setIsFeePickerOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: borderLight }}>
                            <Text style={{ color: textPrimary }}>{f.name} (₱{f.amount})</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>Title <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: textPrimary }}
                  placeholder="e.g. Special Project"
                  placeholderTextColor={textMuted}
                  value={title} onChangeText={setTitle}
                />
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>Description</Text>
                <TextInput
                  style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: textPrimary, minHeight: 80, textAlignVertical: 'top' }}
                  placeholder="Details about the consequence..."
                  placeholderTextColor={textMuted}
                  multiline
                  value={description} onChangeText={setDescription}
                />
              </View>

              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>Due Days (after event)</Text>
                <TextInput
                  style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: textPrimary }}
                  placeholder="7"
                  placeholderTextColor={textMuted}
                  keyboardType="number-pad"
                  value={dueDays} onChangeText={setDueDays}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  style={{ backgroundColor: primarySolid, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flex: 1, opacity: submitting ? 0.7 : 1 }}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{editingId ? 'Save Changes' : 'Add Rule'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ backgroundColor: isDark ? '#334155' : '#fff', borderWidth: 1, borderColor: border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: 100 }}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={{ color: textPrimary, fontWeight: '800' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </OfficerPageWrapper>
  );
}
