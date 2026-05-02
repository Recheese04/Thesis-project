import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardEdit, CheckCircle2, ArrowLeft, Send, Clock, AlertCircle } from 'lucide-react-native';
import EvaluationPopup from '../../components/ui/EvaluationPopup';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';

export default function StudentEvaluations() {
  const { isDark, colors } = useTheme();
  const [evaluations, setEvaluations] = useState<any[]>([]);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f8fafc';
  const textPrimary = isDark ? '#f1f5f9' : '#1e1b4b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const accentColor = isDark ? '#a5b4fc' : '#6366f1';
  const inputBg = isDark ? '#334155' : '#f8fafc';
  const inputBorder = isDark ? '#475569' : '#e2e8f0';
  const openBadgeBg = isDark ? 'rgba(99,102,241,0.15)' : '#e0e7ff';
  const doneBadgeBg = isDark ? 'rgba(5,150,105,0.15)' : '#ecfdf5';
  const selectedBg = isDark ? '#4f46e5' : '#4f46e5';
  const unselectedBg = isDark ? '#1e293b' : '#f8fafc';
  const cardStyle = { backgroundColor: cardBg, borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: border };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvals = async () => {
    try {
      const res = await api.get('/student/evaluations');
      setEvaluations(res.data.evaluations || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchEvals(); }, []);

  const openEvaluation = async (evUrlId: number, evEventId: number) => {
    try {
      const res = await api.get(`/events/${evEventId}/evaluation`);
      if (res.data.evaluation) {
        setSelectedEval(res.data.evaluation);
      } else {
        Alert.alert('Error', 'Could not load evaluation form.');
      }
    } catch (_) {
      Alert.alert('Error', 'Failed to fetch evaluation details.');
    }
  };

  const handleAnswerChange = (questionId: number, key: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], question_id: questionId, [key]: value }
    }));
  };

  const submitEvaluation = async () => {
    const missing = questions.filter(q => q.is_required && !answers[q.id]);
    if (missing.length > 0) {
      Alert.alert('Incomplete Form', 'Please answer all required questions.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/evaluations/${selectedEval.id}/responses`, { answers: Object.values(answers) });
      Alert.alert('Success', 'Evaluation submitted successfully!');
      setSelectedEval(null);
      fetchEvals();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit evaluation.');
    }
    setSubmitting(false);
  };

  if (loading && !refreshing) return (
    <StudentPageWrapper activeRoute="evaluations" title="Evaluations">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </StudentPageWrapper>
  );

  return (
    <StudentPageWrapper activeRoute="evaluations" title="Evaluations">
      {!selectedEval ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: bg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvals(); }} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Area with Tarsi */}
          <View style={{ position: 'relative', overflow: 'hidden' }}>
            
            {/* Decorative Background Circles */}
            <View style={{
              position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#6366f1', opacity: 0.1, zIndex: 0
            }} />
            <View style={{
              position: 'absolute', top: 60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#818cf8', opacity: 0.08, zIndex: 0
            }} />

            {/* Title & Quick Actions */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                  Feedback Center
                </Text>
                <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                  Event Feedback
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <ClipboardEdit size={16} color={accentColor} />
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
                  source={require('../../tarsier-mascot/tar-evaluation-nobg.png')} 
                  style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                  resizeMode="contain"
                />
              </View>

              {/* Chat Bubble */}
              <TarsiChatBubble 
                message={evaluations.filter(e => !e.has_responded && e.status === 'open').length > 0 
                  ? `You have ${evaluations.filter(e => !e.has_responded && e.status === 'open').length} pending evaluation form${evaluations.filter(e => !e.has_responded && e.status === 'open').length !== 1 ? 's' : ''}! Your feedback helps us improve.` 
                  : "All caught up! You've completed all your evaluations. Thank you for your feedback!"} 
              />
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            {/* Pending Section */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Pending Forms</Text>
            {evaluations.filter(e => !e.has_responded && e.status === 'open').length === 0 ? (
              <EmptyState icon="📝" message="No pending evaluations." />
            ) : (
              evaluations.filter(e => !e.has_responded && e.status === 'open').map(ev => {
                const isExpired = ev.expires_at ? new Date(ev.expires_at) < new Date() : false;
                
                return (
                  <TouchableOpacity key={ev.id} onPress={() => openEvaluation(ev.id, ev.event?.id)} activeOpacity={0.8}
                    style={[cardStyle, isExpired && { opacity: 0.8, borderColor: isDark ? '#452a2a' : '#fee2e2' }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary, flex: 1, marginRight: 8 }} numberOfLines={2}>{ev.event?.title || 'Event'}</Text>
                      <View style={{ backgroundColor: isExpired ? (isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2') : openBadgeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: isExpired ? '#ef4444' : (isDark ? '#a5b4fc' : '#4f46e5'), fontSize: 10, fontWeight: '800' }}>
                          {isExpired ? 'EXPIRED' : 'OPEN'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: textSecondary }}>{ev.title}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ClipboardEdit size={14} color={isExpired ? textMuted : accentColor} />
                        <Text style={{ fontSize: 11, color: isExpired ? textMuted : accentColor, fontWeight: '700', marginLeft: 6 }}>{ev.questions_count} Questions</Text>
                      </View>
                      
                      {ev.expires_at && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Clock size={12} color={isExpired ? '#ef4444' : textSecondary} />
                          <Text style={{ fontSize: 11, color: isExpired ? '#ef4444' : textSecondary, marginLeft: 4, fontWeight: '600' }}>
                            {isExpired ? 'Ended' : 'Due'}: {new Date(ev.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Completed Section */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 24 }}>Completed</Text>
            {evaluations.filter(e => e.has_responded).length === 0 ? (
              <EmptyState icon="✅" message="No completed evaluations." />
            ) : (
              evaluations.filter(e => e.has_responded).map(ev => (
                <View key={ev.id} style={[cardStyle, { opacity: 0.6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary, flex: 1, marginRight: 8 }} numberOfLines={2}>{ev.event?.title || 'Event'}</Text>
                    <View style={{ backgroundColor: doneBadgeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <CheckCircle2 size={10} color="#059669" />
                      <Text style={{ color: '#059669', fontSize: 10, fontWeight: '800', marginLeft: 4 }}>DONE</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: textSecondary, marginTop: 4 }}>{ev.title}</Text>
                </View>
              ))
            )}
          </View>
          <View style={{ height: 40 }} />

        </ScrollView>
      ) : null}

      <EvaluationPopup 
        visible={!!selectedEval}
        onClose={() => setSelectedEval(null)}
        evaluation={selectedEval}
        onSuccess={() => fetchEvals()}
      />
    </StudentPageWrapper>
  );
}
