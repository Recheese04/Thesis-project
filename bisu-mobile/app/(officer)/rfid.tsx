import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../../services/api';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';

export default function OfficerRFIDScanner() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rfidInput, setRfidInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [lastScan, setLastScan] = useState<any>(null);
  const { membership } = useAuth();
  
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
        <View className="bg-white px-5 pt-5 pb-4 border-b border-slate-100 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">RFID Scanner</Text>
          <Text className="text-slate-500 text-sm mt-1">Simulate hardware scanner</Text>
        </View>
        <View className="w-12 h-12 bg-emerald-50 rounded-full items-center justify-center">
          <CreditCard size={22} color="#10b981" />
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
