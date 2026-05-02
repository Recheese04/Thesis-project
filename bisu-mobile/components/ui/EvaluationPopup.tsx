import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView,
  Platform, Dimensions
} from 'react-native';
import { X, Send, Star, MessageSquare, ThumbsUp, ListChecks, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  onClose: () => void;
  evaluation: any;
  onSuccess: () => void;
}

const { width, height } = Dimensions.get('window');

export default function EvaluationPopup({ visible, onClose, evaluation, onSuccess }: Props) {
  const { isDark } = useTheme();
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // For multi-step or just tracking progress

  // UI Colors
  const bg = isDark ? '#0f172a' : '#fff';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#1e1b4b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const accentColor = '#6366f1';
  const inputBg = isDark ? '#334155' : '#fff';

  const questions = evaluation?.questions || [];
  const isExpired = evaluation?.expires_at ? new Date(evaluation.expires_at) < new Date() : false;

  useEffect(() => {
    if (visible) {
      setAnswers({});
      setSubmitting(false);
    }
  }, [visible]);

  const handleAnswerChange = (questionId: number, value: any, type: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      const base = { question_id: questionId };
      
      if (type === 'rating') newAnswers[questionId] = { ...base, rating_value: value };
      else if (type === 'text') newAnswers[questionId] = { ...base, text_value: value };
      else if (type === 'multiple_choice') newAnswers[questionId] = { ...base, option_id: value };
      else if (type === 'yes_no') newAnswers[questionId] = { ...base, yes_no_value: value };
      
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    const missing = questions.filter((q: any) => q.is_required && !answers[q.id]);
    if (missing.length > 0) {
      Alert.alert('Required Questions', 'Please answer all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/evaluations/${evaluation.id}/responses`, {
        answers: Object.values(answers)
      });
      Alert.alert('Success', 'Thank you for your feedback!');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: any, index: number) => {
    const answer = answers[q.id];
    const isAnswered = !!answer;

    return (
      <View key={q.id} style={{ marginBottom: 24, backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isAnswered ? accentColor + '40' : border }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: accentColor + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ color: accentColor, fontSize: 12, fontWeight: '800' }}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary }}>
              {q.question_text}
              {q.is_required && <Text style={{ color: '#ef4444' }}> *</Text>}
            </Text>
          </View>
        </View>

        {/* --- RATING --- */}
        {q.question_type === 'rating' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
            {[1, 2, 3, 4, 5].map(val => (
              <TouchableOpacity
                key={val}
                onPress={() => handleAnswerChange(q.id, val, 'rating')}
                style={{ alignItems: 'center' }}
              >
                <Star
                  size={32}
                  color={answer?.rating_value >= val ? '#fbbf24' : textSecondary}
                  fill={answer?.rating_value >= val ? '#fbbf24' : 'transparent'}
                />
                <Text style={{ fontSize: 10, color: textSecondary, marginTop: 4, fontWeight: '600' }}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* --- TEXT --- */}
        {q.question_type === 'text' && (
          <TextInput
            value={answer?.text_value || ''}
            onChangeText={(t) => handleAnswerChange(q.id, t, 'text')}
            placeholder="Type your response here..."
            placeholderTextColor={textSecondary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: inputBg,
              borderWidth: 1,
              borderColor: border,
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              color: textPrimary,
              textAlignVertical: 'top',
              minHeight: 80
            }}
          />
        )}

        {/* --- YES/NO --- */}
        {q.question_type === 'yes_no' && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { label: 'Yes', value: true, color: '#10b981' },
              { label: 'No', value: false, color: '#ef4444' }
            ].map(opt => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => handleAnswerChange(q.id, opt.value, 'yes_no')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: answer?.yes_no_value === opt.value ? opt.color : border,
                  backgroundColor: answer?.yes_no_value === opt.value ? opt.color + '10' : 'transparent'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: answer?.yes_no_value === opt.value ? opt.color : textSecondary }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* --- MULTIPLE CHOICE --- */}
        {q.question_type === 'multiple_choice' && (
          <View style={{ gap: 8 }}>
            {(q.options || []).map((opt: any) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleAnswerChange(q.id, opt.id, 'multiple_choice')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: answer?.option_id === opt.id ? accentColor : border,
                  backgroundColor: answer?.option_id === opt.id ? accentColor + '10' : 'transparent'
                }}
              >
                <View style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: answer?.option_id === opt.id ? accentColor : textSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10
                }}>
                  {answer?.option_id === opt.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor }} />}
                </View>
                <Text style={{ fontSize: 14, color: answer?.option_id === opt.id ? textPrimary : textSecondary, fontWeight: answer?.option_id === opt.id ? '700' : '500' }}>
                  {opt.option_text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: height * 0.9 }}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
            {/* Header */}
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <ClipboardEdit size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase' }}>Event Evaluation</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{evaluation?.event?.title || 'Event Feedback'}</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{evaluation?.title}</Text>
              
              {evaluation?.expires_at && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Clock size={12} color={isExpired ? '#fca5a5' : '#c7d2fe'} />
                  <Text style={{ fontSize: 11, color: isExpired ? '#fca5a5' : '#c7d2fe', marginLeft: 6, fontWeight: '700' }}>
                    {isExpired ? 'EXPIRED' : `Deadline: ${new Date(evaluation.expires_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
              {evaluation?.description ? (
                <View style={{ marginBottom: 24, padding: 16, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#f5f3ff', borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#ddd6fe' }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#a5b4fc' : '#4f46e5', fontStyle: 'italic', lineHeight: 18 }}>
                    {evaluation.description}
                  </Text>
                </View>
              ) : null}

              {isExpired ? (
                <View style={{ alignItems: 'center', py: 40 }}>
                   <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <AlertCircle size={32} color="#ef4444" />
                   </View>
                   <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Form Expired</Text>
                   <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', marginTop: 8 }}>
                     The deadline for this evaluation has passed. You can no longer submit responses.
                   </Text>
                </View>
              ) : (
                <>
                  {questions.map((q: any, i: number) => renderQuestion(q, i))}
                  
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: accentColor,
                      paddingVertical: 16,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 40,
                      shadowColor: accentColor,
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 4
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 10 }}>Submit Evaluation</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const ClipboardEdit = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size }}>
    <ClipboardList size={size} color={color} />
  </View>
);
import { ClipboardList } from 'lucide-react-native';
