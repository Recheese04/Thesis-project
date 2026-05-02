import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import api from '../../services/api';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { QrCode, CheckCircle, XCircle, Calendar, CheckCircle2, ChevronRight, X } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function StudentCheckIn() {
   const { isDark, colors } = useTheme();
   const router = useRouter();
   const [events, setEvents] = useState<any[]>([]);
   const [selectedEvent, setSelectedEvent] = useState<any>(null);
   const [loadingEvents, setLoadingEvents] = useState(true);

   const [permission, requestPermission] = useCameraPermissions();
   const [scanning, setScanning] = useState(false);
   const [actionType, setActionType] = useState<'in' | 'out'>('in');
   const [lastScan, setLastScan] = useState<any>(null);
   const [processing, setProcessing] = useState(false);

   useEffect(() => { fetchEvents(); }, []);

   const fetchEvents = async () => {
      try {
         const res = await api.get('/events?role=student');
         const activeEvents = (Array.isArray(res.data) ? res.data : []).filter(e => e.status !== 'completed' && e.status !== 'cancelled');
         setEvents(activeEvents);
      } catch (_) { }
      setLoadingEvents(false);
   };

   const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
      if (processing || !selectedEvent || !scanning) return;
      setProcessing(true);
      setScanning(false);

      try {
         const endpoint = actionType === 'in' ? '/attendance/checkin' : '/attendance/checkout';
         const res = await api.post(endpoint, {
            event_id: selectedEvent.id,
            qr_code: data.trim()
         });
         
         setLastScan({ success: true, message: actionType === 'in' ? 'Checked In Successfully!' : 'Checked Out Successfully!' });
         
         if (actionType === 'out') {
            // Fetch evaluation for this event to see if one exists
            try {
               const evRes = await api.get(`/events/${selectedEvent.id}/evaluation`);
               if (evRes.data.evaluation) {
                  Alert.alert(
                     'Checked Out Successfully!',
                     'There is a pending evaluation for this event. Would you like to fill it out now?',
                     [
                        { text: 'Later', style: 'cancel', onPress: () => setScanning(true) },
                        { text: 'Go to Evaluations', style: 'default', onPress: () => router.push('/(student)/evaluations') }
                     ]
                  );
               } else {
                  Alert.alert('Success', 'Checked Out Successfully!');
                  setTimeout(() => setScanning(true), 2500);
               }
            } catch (_) {
               Alert.alert('Success', 'Checked Out Successfully!');
               setTimeout(() => setScanning(true), 2500);
            }
         } else {
            Alert.alert('Success', res.data.message || `You have been checked in.`);
            setTimeout(() => setScanning(true), 2500);
         }

      } catch (err: any) {
         setLastScan({ success: false, message: err.response?.data?.message || 'Scan failed. Try again.' });
         Alert.alert('Error', err.response?.data?.message || `Failed to check ${actionType}.`);
         setTimeout(() => setScanning(true), 2500);
      }

      setProcessing(false);
   };

   const toggleScanState = async (ev: any) => {
      if (selectedEvent?.id === ev.id) {
         setSelectedEvent(null);
         setScanning(false);
         setLastScan(null);
      } else {
         if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
               Alert.alert('Permission Required', 'You need to grant camera access to scan QR codes.');
               return;
            }
         }
         setSelectedEvent(ev);
         setScanning(true);
         setLastScan(null);
      }
   };

   const bg = isDark ? '#0f172a' : '#fff';
   const cardBg = isDark ? '#1e293b' : '#fff';
   const border = isDark ? '#334155' : '#e2e8f0';
   const textPrimary = isDark ? '#f1f5f9' : '#0f2d5e';
   const textSecondary = isDark ? '#94a3b8' : '#64748b';
   const textMuted = isDark ? '#64748b' : '#94a3b8';
   const emptyBg = isDark ? '#1e293b' : '#f8fafc';
   const emptyBorder = isDark ? '#334155' : '#f1f5f9';
   const infoBg = isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff';
   const infoBorder = isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe';
   const infoText = isDark ? '#93c5fd' : '#1e3a5f';
   const segmentBg = isDark ? '#1e293b' : '#fff';
   const segmentBorder = isDark ? '#334155' : '#e2e8f0';

   if (loadingEvents) return (
      <StudentPageWrapper activeRoute="checkin">
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
            <ActivityIndicator size="large" color={colors.accent} />
         </View>
      </StudentPageWrapper>
   );

   return (
      <StudentPageWrapper activeRoute="checkin">
         <ScrollView style={{ flex: 1, backgroundColor: bg }} showsVerticalScrollIndicator={false}>

            <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}>
               <View style={{ width: 64, height: 64, backgroundColor: '#2563eb', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <QrCode size={28} color="#fff" />
               </View>
               <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>Event Attendance</Text>
               <Text style={{ fontSize: 12, color: textSecondary, textAlign: 'center' }}>Select an ongoing event and scan the QR code</Text>
            </View>

            {selectedEvent && (
               <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 16 }}>
                     <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: lastScan?.success ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? '#334155' : '#e2e8f0') }}>
                        {lastScan?.success ? <CheckCircle size={20} color="#16a34a" /> : <X size={20} color={textMuted} />}
                     </View>
                     <View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: lastScan?.success ? '#16a34a' : textPrimary }}>
                           {lastScan ? lastScan.message : 'Ready to Scan'}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary }}>{selectedEvent.title}</Text>
                     </View>
                  </View>
               </View>
            )}

            <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
               <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 12 }}>Ongoing Events</Text>

               {events.length === 0 ? (
                  <View style={{ backgroundColor: emptyBg, borderWidth: 1, borderColor: emptyBorder, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                     <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '700' }}>No active events right now</Text>
                  </View>
               ) : (
                  <View style={{ marginBottom: 24 }}>
                     {events.map((ev) => {
                        const isSelected = selectedEvent?.id === ev.id;
                        return (
                           <TouchableOpacity
                              key={ev.id}
                              activeOpacity={0.8}
                              onPress={() => toggleScanState(ev)}
                              style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 12, borderRadius: 16, marginBottom: 12, backgroundColor: isSelected ? (isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff') : cardBg, borderColor: isSelected ? '#3b82f6' : border }}
                           >
                              <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isSelected ? '#2563eb' : (isDark ? '#334155' : '#f1f5f9') }}>
                                 <Calendar size={20} color={isSelected ? '#fff' : textMuted} />
                              </View>
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                 <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>{ev.title}</Text>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ fontSize: 11, color: textSecondary }}>{new Date(ev.start_time || ev.event_date).toLocaleDateString()}</Text>
                                    <Text style={{ fontSize: 11, color: textSecondary }}>🕐 {ev.event_time || ''}</Text>
                                 </View>
                              </View>
                              <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                 <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#6ee7b7' : '#15803d', textTransform: 'capitalize' }}>{ev.status}</Text>
                              </View>
                           </TouchableOpacity>
                        );
                     })}
                  </View>
               )}

               {!selectedEvent ? (
                  <View style={{ backgroundColor: infoBg, borderWidth: 1, borderColor: infoBorder, padding: 20, borderRadius: 16 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 32, height: 32, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                           <QrCode size={16} color="#fff" />
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: infoText }}>How to Check In / Out</Text>
                     </View>
                     <Text style={{ fontSize: 11, color: infoText, lineHeight: 18, marginBottom: 4 }}>1. Select an ongoing event from the list above</Text>
                     <Text style={{ fontSize: 11, color: infoText, lineHeight: 18, marginBottom: 4 }}>2. Choose Check In or Check Out</Text>
                     <Text style={{ fontSize: 11, color: infoText, lineHeight: 18, marginBottom: 4 }}>3. Allow camera access when prompted</Text>
                     <Text style={{ fontSize: 11, color: infoText, lineHeight: 18 }}>4. Point at the event QR code to scan</Text>
                  </View>
               ) : (
                  <View style={{ paddingVertical: 8 }}>
                     <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: textMuted, textTransform: 'uppercase', marginBottom: 12 }}>Select Action</Text>

                     <View style={{ flexDirection: 'row', backgroundColor: segmentBg, borderWidth: 1, borderColor: segmentBorder, borderRadius: 16, padding: 4, marginBottom: 20 }}>
                        <TouchableOpacity
                           onPress={() => setActionType('in')}
                           style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: actionType === 'in' ? '#00c571' : 'transparent' }}
                        >
                           <CheckCircle2 size={16} color={actionType === 'in' ? '#fff' : textSecondary} />
                           <Text style={{ fontSize: 13, fontWeight: '800', marginLeft: 6, color: actionType === 'in' ? '#fff' : textSecondary }}>Check In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                           onPress={() => setActionType('out')}
                           style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: actionType === 'out' ? (isDark ? '#475569' : '#cbd5e1') : 'transparent' }}
                        >
                           <XCircle size={16} color={actionType === 'out' ? (isDark ? '#e2e8f0' : '#475569') : textSecondary} />
                           <Text style={{ fontSize: 13, fontWeight: '800', marginLeft: 6, color: actionType === 'out' ? (isDark ? '#e2e8f0' : '#475569') : textSecondary }}>Check Out</Text>
                        </TouchableOpacity>
                     </View>

                     <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', height: 350, marginBottom: 16, borderWidth: 2, borderColor: border, position: 'relative' }}>
                        {scanning ? (
                           <CameraView
                              style={StyleSheet.absoluteFillObject}
                              facing="back"
                              onBarcodeScanned={scanned => handleBarcodeScanned({ type: scanned.type, data: scanned.data })}
                              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                           >
                              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                                 <View style={{ width: 224, height: 224, position: 'relative', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                                    <View style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff' }} />
                                    <View style={{ position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff' }} />
                                    <View style={{ position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff' }} />
                                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff' }} />
                                    {processing && <ActivityIndicator size="large" color="#fff" />}
                                 </View>
                              </View>
                           </CameraView>
                        ) : (
                           <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                              {processing ? <ActivityIndicator size="large" color="#fff" /> : <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Camera Paused</Text>}
                           </View>
                        )}
                     </View>

                     <TouchableOpacity
                        onPress={() => toggleScanState(selectedEvent)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16 }}
                     >
                        <X size={16} color={textPrimary} />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary, marginLeft: 8 }}>Cancel Scanning</Text>
                     </TouchableOpacity>
                  </View>
               )}
            </View>
         </ScrollView>
      </StudentPageWrapper>
   );
}
