import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { ClipboardList, Plus, Search, ChevronRight, ArrowLeft, Star, MessageSquare, ThumbsUp, Trash2, Calendar, ListChecks, CheckCircle2, Clock, X } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

const TYPE_ICONS = { rating: Star, text: MessageSquare, multiple_choice: ListChecks, yes_no: ThumbsUp };
const TYPE_LABELS = { rating: "Rating (1–5)", text: "Open Text", multiple_choice: "Multiple Choice", yes_no: "Yes / No" };
const EMPTY_Q = { question_text: "", question_type: "rating", is_required: true, order_index: 0, options: [] };

export default function OfficerEvaluations() {
  const { isDark, colors } = useTheme();
  
  // Theme colors
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
  
  // Custom module colors (Violet is primary here)
  const primaryBg = isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff';
  const primarySolid = isDark ? '#6d28d9' : '#7c3aed';
  const primaryText = isDark ? '#a78bfa' : '#7c3aed';
  const primaryBorder = isDark ? 'rgba(124,58,237,0.3)' : '#ede9fe';

  const [view, setView] = useState<'list' | 'manage' | 'create'>('list');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Event List state
  const [events, setEvents] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshingList, setRefreshingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Manage state
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  // Create state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [questions, setQuestions] = useState<any[]>([{ ...EMPTY_Q }]);
  const [saving, setSaving] = useState(false);
  const [typePickerIndex, setTypePickerIndex] = useState<number | null>(null);

  // Deadline state
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/officer/events');
      setEvents(res.data.events ?? res.data ?? []);
    } catch (_) {}
    setLoadingList(false);
    setRefreshingList(false);
  };

  useEffect(() => {
    if (view === 'list') {
      fetchEvents();
    }
  }, [view]);

  const loadEvaluation = async (ev: any) => {
    setSelectedEvent(ev);
    setView('manage');
    setLoadingEval(true);
    setEvaluation(null);
    try {
      const res = await api.get(`/events/${ev.id}/evaluation`);
      setEvaluation(res.data.evaluation);
    } catch (_) {
      setEvaluation(null);
    }
    setLoadingEval(false);
  };

  const handleCreateSubmit = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title.');
    if (questions.some(q => !q.question_text.trim())) return Alert.alert('Error', 'All questions must have text.');
    
    setSaving(true);
    try {
      const res = await api.post('/evaluations', {
        event_id: selectedEvent.id,
        title,
        description,
        is_anonymous: isAnonymous,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        questions: questions.map((q, i) => ({ ...q, order_index: i }))
      });
      Alert.alert('Success', 'Evaluation created!');
      setEvaluation(res.data.evaluation);
      setView('manage');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create evaluation.');
    }
    setSaving(false);
  };

  // --- RENDERING VIEWS ---

  const renderList = () => {
    const filtered = events.filter(e => e.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    const counts = {
      open: events.filter(e => e.evaluation_status === 'open').length,
      closed: events.filter(e => e.evaluation_status === 'closed').length,
      none: events.filter(e => !e.evaluation_status).length,
    };

    return (
      <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshingList} onRefresh={() => { setRefreshingList(true); fetchEvents(); }} />} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: borderLight }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={22} color="#fff" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>Evaluations</Text>
              <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '500' }}>Select an event to manage its evaluation form.</Text>
            </View>
          </View>

          {/* Stats */}
          {!loadingList && events.length > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#d1fae5', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? '#6ee7b7' : '#059669' }}>{counts.open}</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#34d399' : '#10b981', fontWeight: '700', letterSpacing: -0.5 }}>Open</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: textSecondary }}>{counts.closed}</Text>
                <Text style={{ fontSize: 11, color: textMuted, fontWeight: '700', letterSpacing: -0.5 }}>Closed</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', borderWidth: 1, borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#fef3c7', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? '#fbbf24' : '#f59e0b' }}>{counts.none}</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#fcd34d' : '#f59e0b', fontWeight: '700', letterSpacing: -0.5 }}>No Evaluation</Text>
              </View>
            </View>
          )}

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Search size={18} color={textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events..."
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: textPrimary, paddingVertical: 0 }}
              placeholderTextColor={textMuted}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          {loadingList && !refreshingList ? (
            <ActivityIndicator size="large" color="#7c3aed" style={{ marginVertical: 32 }} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="📅" message="No events matched your search." />
          ) : (
            filtered.map(ev => {
              const status = ev.evaluation_status;
              const isExpired = ev.expires_at ? new Date(ev.expires_at) < new Date() : false;
              
              let badgeTheme = { bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: isDark ? 'rgba(245,158,11,0.3)' : '#fde68a', text: isDark ? '#fbbf24' : '#d97706', dot: isDark ? '#fbbf24' : '#fbbf24' };
              
              if (isExpired && status === 'open') {
                badgeTheme = { bg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca', text: isDark ? '#fca5a5' : '#ef4444', dot: isDark ? '#ef4444' : '#ef4444' };
              } else if (status === 'open') {
                badgeTheme = { bg: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', border: isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0', text: isDark ? '#6ee7b7' : '#059669', dot: isDark ? '#34d399' : '#34d399' };
              } else if (status === 'closed') {
                badgeTheme = { bg: isDark ? '#334155' : '#f1f5f9', border: isDark ? '#475569' : '#e2e8f0', text: isDark ? '#94a3b8' : '#64748b', dot: isDark ? '#94a3b8' : '#94a3b8' };
              }

              return (
                <TouchableOpacity key={ev.id} activeOpacity={0.8} onPress={() => loadEvaluation(ev)} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} color={primaryText} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary }} numberOfLines={1}>{ev.title}</Text>
                      <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '500', marginTop: 2 }}>{ev.event_date}</Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, borderWidth: 1, backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border, marginRight: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, marginRight: 6, backgroundColor: badgeTheme.dot }} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: badgeTheme.text }}>
                        {isExpired && status === 'open' ? 'Expired' : status ? status.charAt(0).toUpperCase() + status.slice(1) : 'No Evaluation'}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })

          )}
        </View>
      </ScrollView>
    );
  };

  const renderManage = () => {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header Ribbon */}
        <View style={{ backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -50, right: -50, width: 128, height: 128, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 64 }} />
          
          <TouchableOpacity onPress={() => setView('list')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <ArrowLeft size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ marginLeft: 8, color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Back to Events</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#fff" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 10, color: '#ddd6fe', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Managing Evaluation For</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 2 }} numberOfLines={1}>{selectedEvent?.title}</Text>
              <Text style={{ fontSize: 11, color: '#c4b5fd', marginTop: 2 }}>{new Date(selectedEvent?.event_date).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
          {loadingEval ? (
            <ActivityIndicator size="large" color="#7c3aed" style={{ marginVertical: 40 }} />
          ) : evaluation ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>{evaluation.title}</Text>
                  {!!evaluation.description && <Text style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}>{evaluation.description}</Text>}
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, backgroundColor: evaluation.status === 'open' ? (isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (isDark ? '#334155' : '#f1f5f9'), borderColor: evaluation.status === 'open' ? (isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0') : (isDark ? '#475569' : '#e2e8f0') }}>
                   <Text style={{ fontSize: 10, fontWeight: '700', color: evaluation.status === 'open' ? (isDark ? '#6ee7b7' : '#059669') : textSecondary }}>{evaluation.status === 'open' ? 'OPEN' : 'CLOSED'}</Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: borderLight, paddingTop: 16, gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: borderLight }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: primaryText }}>{(evaluation.questions || []).length}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, marginTop: 2 }}>Questions</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: borderLight }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textSecondary }}>{evaluation.total_responses ?? '0'}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, marginTop: 2 }}>Responses</Text>
                </View>
              </View>

              {evaluation.expires_at && (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: 12, borderWidth: 1, borderColor: borderLight, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   <Clock size={16} color={new Date(evaluation.expires_at) < new Date() ? '#ef4444' : primarySolid} />
                   <View>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, textTransform: 'uppercase' }}>Deadline</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: new Date(evaluation.expires_at) < new Date() ? '#ef4444' : textPrimary }}>
                        {new Date(evaluation.expires_at).toLocaleString()}
                        {new Date(evaluation.expires_at) < new Date() ? ' (EXPIRED)' : ''}
                      </Text>
                   </View>
                </View>
              )}

              <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }} activeOpacity={0.8} onPress={() => { Alert.alert('Coming Soon', 'Detailed results view is available on the web dashboard.'); }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>View Analytics</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 80, height: 80, backgroundColor: primaryBg, borderWidth: 1, borderColor: primaryBorder, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ClipboardList size={32} color={primaryText} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>No evaluation yet</Text>
              <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 32, width: '80%' }}>Create an evaluation so students can rate this event.</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => {
                setTitle('Event Feedback');
                setDescription('');
                setIsAnonymous(false);
                setQuestions([{ ...EMPTY_Q }]);
                setView('create');
              }} style={{ backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Plus size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 }}>Create Evaluation</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  const renderCreate = () => {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header Ribbon */}
        <View style={{ backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' }}>
           <TouchableOpacity onPress={() => setView('manage')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <ArrowLeft size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ marginLeft: 8, color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Back / Discard</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>New Evaluation</Text>
          <Text style={{ fontSize: 12, color: '#c4b5fd', fontWeight: '500' }}>For {selectedEvent?.title}</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
            
            {/* General Info */}
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, marginBottom: 24 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Event Feedback Form" placeholderTextColor={textMuted} style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: textPrimary, marginBottom: 16 }} />

              <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Description (optional)</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="Instructions..." placeholderTextColor={textMuted} multiline numberOfLines={2} style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: textPrimary, marginBottom: 16, textAlignVertical: 'top' }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: modalBg, borderWidth: 1, borderColor: borderLight, borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textSecondary }}>Anonymous responses</Text>
                <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ false: '#e2e8f0', true: '#a78bfa' }} thumbColor={isAnonymous ? '#7c3aed' : '#fff'} />
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Evaluation Deadline</Text>
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Evaluation Deadline</Text>
                <TouchableOpacity 
                   onPress={() => {
                     if (Platform.OS === 'android') {
                       DateTimePickerAndroid.open({
                         value: expiresAt || new Date(),
                         onChange: (event, selectedDate) => {
                           if (event.type === 'set' && selectedDate) {
                             setExpiresAt(selectedDate);
                           }
                         },
                         mode: 'date',
                         is24Hour: true,
                         minimumDate: new Date(),
                       });
                     } else {
                       setShowDatePicker(true);
                     }
                   }}
                   style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, padding: 12, gap: 10 }}
                >
                  <Clock size={18} color={primarySolid} />
                  <Text style={{ flex: 1, fontSize: 14, color: expiresAt ? textPrimary : textMuted }}>
                    {expiresAt ? expiresAt.toLocaleString() : 'Select Deadline (Optional)'}
                  </Text>
                  {expiresAt && (
                    <TouchableOpacity onPress={() => setExpiresAt(null)}>
                      <X size={16} color={textMuted} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {Platform.OS === 'ios' && showDatePicker && (
                  <DateTimePicker
                    value={expiresAt || new Date()}
                    mode="datetime"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setExpiresAt(selectedDate);
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              </View>
            </View>

            {/* Questions Builder */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Questions ({questions.length})</Text>
              <TouchableOpacity onPress={() => setQuestions([...questions, { ...EMPTY_Q }])}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#7c3aed' }}>+ Add Question</Text>
              </TouchableOpacity>
            </View>

            {questions.map((q, i) => (
              <View key={i} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderLeftWidth: 4, borderLeftColor: '#7c3aed', borderColor: border, marginBottom: 16 }}>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: primaryText, fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                     <TouchableOpacity onPress={() => {
                        const next = [...questions];
                        next[i].is_required = !next[i].is_required;
                        setQuestions(next);
                     }} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: q.is_required ? (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2') : (isDark ? '#334155' : '#f8fafc'), borderColor: q.is_required ? (isDark ? 'rgba(239,68,68,0.3)' : '#fecaca') : (isDark ? '#475569' : '#e2e8f0') }}>
                         <Text style={{ fontSize: 10, fontWeight: '700', color: q.is_required ? (isDark ? '#fca5a5' : '#ef4444') : textMuted }}>{q.is_required ? 'Required' : 'Optional'}</Text>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => {
                        const next = questions.filter((_, idx) => idx !== i);
                        setQuestions(next);
                     }}>
                         <Trash2 size={16} color={textMuted} />
                     </TouchableOpacity>
                  </View>
                </View>

                <TextInput value={q.question_text} onChangeText={(t) => {
                  const next = [...questions]; next[i].question_text = t; setQuestions(next);
                }} placeholder="Enter your question..." placeholderTextColor={textMuted} style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: textPrimary, marginBottom: 12 }} />

                <TouchableOpacity activeOpacity={0.7} onPress={() => setTypePickerIndex(i)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
                   <Text style={{ fontSize: 13, fontWeight: '600', color: textSecondary }}>{TYPE_LABELS[q.question_type as keyof typeof TYPE_LABELS]}</Text>
                   <ChevronRight size={14} color={textMuted} />
                </TouchableOpacity>

              </View>
            ))}

            <View style={{ height: 16 }} />

            {/* Bottom Form Actions */}
            <TouchableOpacity onPress={handleCreateSubmit} disabled={saving} style={{ paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: saving ? '#a78bfa' : '#7c3aed', marginBottom: 40 }}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle2 size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Create Evaluation</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Custom Type Picker Modal */}
        <Modal visible={typePickerIndex !== null} transparent animationType="slide">
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
             <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary, marginBottom: 16 }}>Select Question Type</Text>
                {Object.keys(TYPE_LABELS).map((key) => {
                   const Icon = TYPE_ICONS[key as keyof typeof TYPE_ICONS];
                   return (
                     <TouchableOpacity key={key} onPress={() => {
                        if (typePickerIndex !== null) {
                           const next = [...questions];
                           next[typePickerIndex].question_type = key;
                           setQuestions(next);
                        }
                        setTypePickerIndex(null);
                     }} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderLight, paddingVertical: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                           <Icon size={16} color={primarySolid} />
                        </View>
                        <Text style={{ marginLeft: 12, fontSize: 15, fontWeight: '700', color: textSecondary }}>{TYPE_LABELS[key as keyof typeof TYPE_LABELS]}</Text>
                     </TouchableOpacity>
                   )
                })}
                <TouchableOpacity onPress={() => setTypePickerIndex(null)} style={{ marginTop: 16, paddingVertical: 12, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 12, alignItems: 'center' }}>
                   <Text style={{ fontWeight: '700', color: textSecondary }}>Cancel</Text>
                </TouchableOpacity>
             </View>
           </View>
        </Modal>

      </View>
    );
  };

  return (
    <OfficerPageWrapper activeRoute="evaluations">
      {view === 'list' && renderList()}
      {view === 'manage' && renderManage()}
      {view === 'create' && renderCreate()}
    </OfficerPageWrapper>
  );
}
