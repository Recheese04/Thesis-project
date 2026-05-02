import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import api from '../../services/api';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react-native';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useAuth } from '../../context/AuthContext';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfficerRFIDScanner() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rfidInput, setRfidInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [lastScan, setLastScan] = useState<any>(null);
  const { membership } = useAuth();
  const { isDark, colors } = useTheme();
  
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/officer/events');
      setEvents(res.data.events || []);
      if (res.data.events?.length > 0) {
        setSelectedEventId(res.data.events[0].id);
      }
    } catch (_) {}
    setLoadingEvents(false);
  };

  const handleScanSubmit = async () => {
    if (!rfidInput.trim()) return;
    if (!selectedEventId) {
      Alert.alert('Error', 'Please select an event first.');
      return;
    }

    setScanning(true);
    setLastScan(null);
    try {
      const res = await api.post('/attendance/rfid-scan', {
        event_id: selectedEventId,
        rfid_uid: rfidInput.trim()
      });
      setLastScan({ success: true, data: res.data });
      setRfidInput('');
      
      // Keep focus on input for continuous scanning
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      setLastScan({ success: false, data: err.response?.data || { message: 'Scan failed' } });
      setRfidInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    setScanning(false);
  };

  if (loadingEvents) return (
    <OfficerPageWrapper activeRoute="rfid">
      <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563eb" /></View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="rfid">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
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
                Hardware Simulation
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                RFID Scanner
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} color={isDark ? '#94a3b8' : '#10b981'} />
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
                source={require('../../tarsier-mascot/tar-id-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message="Ready to scan! Make sure the selected event matches the one you're checking in for." 
            />
          </View>
         </View>

      <View className="px-5 pt-6 pb-4">
        {events.length === 0 ? (
          <View className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <Text className="text-amber-700 font-bold">No active events</Text>
            <Text className="text-amber-600 text-xs mt-1">Create an event to start scanning.</Text>
          </View>
        ) : (
          <>
            <Text className="text-sm font-bold text-slate-700 mb-2">Select Active Event</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {events.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => setSelectedEventId(ev.id)}
                  className={`mr-3 px-4 py-2.5 rounded-xl border ${selectedEventId === ev.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`font-bold ${selectedEventId === ev.id ? 'text-white' : 'text-slate-700'}`}>{ev.title}</Text>
                  <Text className={`text-[10px] mt-0.5 ${selectedEventId === ev.id ? 'text-blue-100' : 'text-slate-400'}`}>{ev.event_date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <Text className="text-[15px] font-extrabold text-slate-900 text-center mb-1">Scan ID Card</Text>
              <Text className="text-xs text-slate-400 text-center mb-5">Ensure hardware scanner is active or type UID below</Text>
              
              <TextInput
                ref={inputRef}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-bold text-slate-800 tracking-wider mb-4"
                placeholder="Awaiting scan..."
                value={rfidInput}
                onChangeText={setRfidInput}
                onSubmitEditing={handleScanSubmit}
                autoFocus
                returnKeyType="done"
                editable={!scanning}
              />
              
              <TouchableOpacity 
                className={`bg-blue-600 py-3.5 rounded-xl items-center ${scanning ? 'opacity-70' : ''}`}
                onPress={handleScanSubmit}
                disabled={scanning}
              >
                {scanning ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-[15px]">Submit Scan</Text>}
              </TouchableOpacity>
            </View>

            {/* Scan Results */}
            {lastScan && (
              <View className={`mt-5 p-5 rounded-2xl border ${lastScan.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <View className="flex-row items-center mb-3">
                  {lastScan.success ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                  <Text className={`font-extrabold ml-2 text-base ${lastScan.success ? 'text-emerald-700' : 'text-red-700'}`}>
                    {lastScan.data.message}
                  </Text>
                </View>
                
                {lastScan.data.user_name && (
                  <View className="bg-white p-3 rounded-lg shadow-sm border border-slate-100/50">
                    <Text className="font-bold text-slate-800">{lastScan.data.user_name}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">{lastScan.data.course} | {lastScan.data.student_number}</Text>
                    {lastScan.data.action && (
                      <View className="mt-2 flex-row">
                        <View className={`px-2 py-1 rounded text-xs ${lastScan.data.action === 'checkin' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                          <Text className={`font-bold text-[10px] uppercase ${lastScan.data.action === 'checkin' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {lastScan.data.action}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
      </ScrollView>
    </OfficerPageWrapper>
  );
}
