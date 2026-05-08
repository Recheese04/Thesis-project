import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Upload, CheckCircle2, Clock } from 'lucide-react-native';
import api from '../../services/api';
import { API_BASE_URL } from '../../constants/Config';
import { useTheme } from '../../context/ThemeContext';

interface PaymentMethod { id: number; name: string; account_number?: string; account_name?: string; }
interface PaymentModalProps {
  visible: boolean; onClose: () => void; feeId: number | null;
  amountStr: string | null; title: string; onSuccess: () => void;
  status?: string; initialReference?: string; initialProof?: string;
}

const METHOD_LOGOS: Record<string, any> = {
  gcash: require('../../assets/images/gcash.png'),
  paymaya: require('../../assets/images/paymaya.jpg'),
};

export default function PaymentModal({ visible, onClose, feeId, amountStr, title, onSuccess, status, initialReference, initialProof }: PaymentModalProps) {
  const { isDark, colors } = useTheme();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchMethods(); setSelectedMethod(null); setProofUri(null);
      setReferenceNumber(''); setError(null);
    }
  }, [visible]);

  const fetchMethods = async () => {
    setLoadingMethods(true); setError(null);
    try {
      const res = await api.get('/payment-methods');
      setMethods(res.data);
      if (res.data.length > 0) setSelectedMethod(res.data[0].id);
    } catch { setError('Failed to load payment methods.'); }
    finally { setLoadingMethods(false); }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any, allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled) setProofUri(result.assets[0].uri);
  };

  const isFormValid = !!(selectedMethod && proofUri && referenceNumber.trim());

  const handleSubmit = async () => {
    if (!feeId || !isFormValid) { setError('Please fill in all fields.'); return; }
    Keyboard.dismiss(); setSubmitting(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('payment_method_id', selectedMethod!.toString());
      fd.append('reference_number', referenceNumber.trim());
      const fn = proofUri!.split('/').pop() || 'proof.jpg';
      const m = /\.(\w+)$/.exec(fn);
      fd.append('proof', { uri: proofUri, name: fn, type: m ? `image/${m[1]}` : 'image' } as any);
      await api.post(`/student-fees/${feeId}/pay`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess(); onClose();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to submit payment.'); }
    finally { setSubmitting(false); }
  };

  const bg = isDark ? '#1e293b' : '#ffffff';
  const tp = isDark ? '#f1f5f9' : '#0f172a';
  const ts = isDark ? '#94a3b8' : '#64748b';
  const bd = isDark ? '#334155' : '#e2e8f0';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Full screen flex column */}
      <View style={{ flex: 1 }}>
        {/* Top spacer — tap to close (acts as ~10% gap) */}
        <TouchableOpacity
          style={{ height: '10%', backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet — flex:1 takes the remaining 90% */}
        <View style={[s.sheet, { backgroundColor: bg }]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: bd }]}>
            <Text style={[s.headerTitle, { color: tp }]}>Manual Verification</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={ts} /></TouchableOpacity>
          </View>

          {/* Scrollable body */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: tp }}>{status === 'submitted' ? 'Verification for:' : 'Paying:'} <Text style={{ fontWeight: 'bold' }}>{title}</Text></Text>
              {amountStr && <Text style={{ fontSize: 24, fontWeight: '900', color: colors.accent }}>{amountStr}</Text>}
            </View>

            {status === 'submitted' ? (
              <View>
                <View style={[s.infoBox, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderColor: isDark ? '#1e40af' : '#bfdbfe' }]}>
                  <Clock size={16} color="#3b82f6" />
                  <Text style={{ marginLeft: 8, fontSize: 13, color: '#3b82f6', fontWeight: '700' }}>Waiting for Officer Approval</Text>
                </View>

                <Text style={[s.secTitle, { color: tp, marginTop: 12 }]}>Reference Number</Text>
                <View style={[s.input, { borderColor: bd, backgroundColor: isDark ? '#0f172a' : '#f8fafc', justifyContent: 'center' }]}>
                   <Text style={{ color: tp, fontSize: 15, fontWeight: '600' }}>{initialReference || 'No reference'}</Text>
                </View>

                <Text style={[s.secTitle, { color: tp, marginTop: 24 }]}>Submitted Proof</Text>
                <View style={[s.uploadBox, { borderColor: bd, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                  {initialProof ? (
                    <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}/storage/${initialProof}` }} style={s.previewImg} />
                  ) : (
                    <Text style={{ color: ts }}>No proof uploaded</Text>
                  )}
                </View>
              </View>
            ) : (
              <>
                {error && (
                  <View style={[s.errorBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2' }]}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={[s.secTitle, { color: tp }]}>1. Select Payment Method</Text>
                {loadingMethods ? <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 10 }} /> :
                  methods.length === 0 ? <Text style={{ color: ts }}>No payment methods available.</Text> : (
                    <View style={s.methodsRow}>
                      {methods.map((m) => {
                        const sel = selectedMethod === m.id;
                        const logo = METHOD_LOGOS[m.name.toLowerCase()];
                        return (
                          <TouchableOpacity key={m.id} style={[s.methodCard, { borderColor: sel ? colors.accent : bd, backgroundColor: sel ? (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : 'transparent' }]} onPress={() => setSelectedMethod(m.id)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {logo && <Image source={logo} style={s.methodLogo} />}
                              <Text style={{ fontSize: 13, fontWeight: '700', color: tp }}>{m.name === 'gcash' ? 'GCash' : m.name === 'paymaya' ? 'Maya' : m.name.toUpperCase()}</Text>
                            </View>
                            {sel && <CheckCircle2 size={16} color={colors.accent} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                {selectedMethod && (() => {
                  const sel = methods.find(m => m.id === selectedMethod);
                  const num = sel?.account_number || 'Not set';
                  const name = sel?.account_name || 'Not set';
                  return (
                    <View style={[s.instrBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                      <Text style={{ color: ts, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>Send the exact amount to our official number:</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: tp }}>{num}</Text>
                      <Text style={{ color: ts, fontSize: 11, marginTop: 8, textAlign: 'center' }}>Name: {name}</Text>
                    </View>
                  );
                })()}

                <Text style={[s.secTitle, { color: tp, marginTop: 24 }]}>2. Reference Number</Text>
                <TextInput style={[s.input, { borderColor: bd, color: tp, backgroundColor: isDark ? '#0f172a' : '#fff' }]} placeholder="e.g. 1234567890123" placeholderTextColor={ts} value={referenceNumber} onChangeText={setReferenceNumber} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

                <Text style={[s.secTitle, { color: tp, marginTop: 24 }]}>3. Upload Screenshot</Text>
                <TouchableOpacity style={[s.uploadBox, { borderColor: bd, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]} onPress={pickImage}>
                  {proofUri ? <Image source={{ uri: proofUri }} style={s.previewImg} /> : (
                    <View style={{ alignItems: 'center' }}>
                      <Upload size={36} color={ts} />
                      <Text style={{ color: ts, marginTop: 10, fontSize: 13, fontWeight: '600' }}>Tap to select image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[s.footer, { borderTopColor: bd, backgroundColor: bg }]}>
            {status === 'submitted' ? (
              <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.accent }]} onPress={onClose}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Close Details</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.submitBtn, { backgroundColor: isFormValid ? colors.accent : isDark ? '#475569' : '#cbd5e1' }]} disabled={submitting || !isFormValid} onPress={handleSubmit}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isFormValid ? '#fff' : ts }}>Submit Payment</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  body: { padding: 20, paddingBottom: 24 },
  secTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderRadius: 12, width: '48%' },
  methodLogo: { width: 24, height: 24, resizeMode: 'contain', marginRight: 8 },
  instrBox: { marginTop: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600' },
  uploadBox: { width: '100%', height: 280, borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  footer: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1 },
  submitBtn: { height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
});
