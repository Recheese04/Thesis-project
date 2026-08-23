import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  ScrollView, Image, Modal, Animated, Easing
} from 'react-native';
import api from '../../services/api';
import {
  CreditCard, CheckCircle, XCircle, Cpu, RefreshCw, Zap,
  Users, UserCheck, UserX, Clock, ChevronRight, ShieldAlert, Sparkles, HelpCircle
} from 'lucide-react-native';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useAuth } from '../../context/AuthContext';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import SafeLinearGradient from '../../components/ui/SafeLinearGradient';

interface ScanRecord {
  id: string;
  time: string;
  uid: string;
  success: boolean;
  message: string;
  userName?: string;
  studentNumber?: string;
  course?: string;
  action?: 'checkin' | 'checkout' | 'already_checkout' | 'unknown';
}

export default function OfficerRFIDScanner() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rfidInput, setRfidInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Event Attendance Stats
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, checkedOut: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);

  const { membership } = useAuth();
  const { isDark } = useTheme();

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const bgCard = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventStats(selectedEventId);
      const interval = setInterval(() => {
        fetchEventStats(selectedEventId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/officer/events');
      const eventList = res.data.events || [];
      setEvents(eventList);
      if (eventList.length > 0) {
        setSelectedEventId(eventList[0].id);
      }
    } catch (_) { }
    setLoadingEvents(false);
  };

  const fetchEventStats = async (eventId: number) => {
    setLoadingStats(true);
    try {
      const res = await api.get(`/attendance/event/${eventId}`);
      if (res.data) {
        const records = res.data.attendance || res.data.records || [];
        const checkedIn = records.filter((r: any) => r.status === 'checked_in' || (r.time_in && !r.time_out)).length;
        const checkedOut = records.filter((r: any) => r.status === 'checked_out' || r.time_out).length;
        setStats({
          total: records.length,
          checkedIn,
          checkedOut,
        });
      }
    } catch (_) {
    } finally {
      setLoadingStats(false);
    }
  };

  const executeScan = async (uidToScan: string) => {
    const cleanUid = uidToScan.trim();
    if (!cleanUid) return;
    if (!selectedEventId) {
      Alert.alert('Select Event', 'Please select an active event first before scanning.');
      return;
    }

    setScanning(true);

    try {
      const res = await api.post('/attendance/rfid-scan', {
        event_id: selectedEventId,
        rfid_uid: cleanUid,
      });

      const data = res.data;
      const newRecord: ScanRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        uid: cleanUid,
        success: true,
        message: data.message || 'Scan registered successfully!',
        userName: data.user_name,
        studentNumber: data.student_number,
        course: data.course,
        action: data.action || 'checkin',
      };

      setLastScan(newRecord);
      setScanHistory(prev => [newRecord, ...prev]);
      setRfidInput('');

      // Refresh event statistics
      fetchEventStats(selectedEventId);

      // Keep focus on input for continuous hardware scanning
      setTimeout(() => inputRef.current?.focus(), 150);
    } catch (err: any) {
      const errData = err.response?.data || {};
      const failRecord: ScanRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        uid: cleanUid,
        success: false,
        message: errData.message || 'Card scan failed or unrecognized.',
        userName: errData.user_name,
        action: errData.action || 'unknown',
      };

      setLastScan(failRecord);
      setScanHistory(prev => [failRecord, ...prev]);
      setRfidInput('');
      setTimeout(() => inputRef.current?.focus(), 150);
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = () => {
    executeScan(rfidInput);
  };

  if (loadingEvents) return (
    <OfficerPageWrapper activeRoute="rfid">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: textSecondary, fontWeight: '600', fontSize: 13 }}>Loading RFID System...</Text>
      </View>
    </OfficerPageWrapper>
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <OfficerPageWrapper activeRoute="rfid">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header Area with Tarsi */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>

          {/* Background Blobs */}
          <View style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#3b82f6', opacity: 0.12, zIndex: 0
          }} />
          <View style={{
            position: 'absolute', top: 60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#8b5cf6', opacity: 0.1, zIndex: 0
          }} />

          {/* Title & Badge */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, zIndex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Cpu size={12} color="#3b82f6" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 5 }}>
                  Hardware RFID Attendance
                </Text>
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                RFID Scanner
              </Text>
            </View>

            <View style={{ width: 44, height: 44, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <CreditCard size={20} color={isDark ? '#94a3b8' : '#2563eb'} />
            </View>
          </View>

          {/* Mascot & Tarsi Bubble */}
          <View style={{ position: 'relative', minHeight: 110, justifyContent: 'flex-end', paddingBottom: 10, marginTop: 10 }}>
            <SafeLinearGradient
              colors={['#3b82f6', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, zIndex: 0 }}
            />

            <View style={{
              position: 'absolute', left: -20, bottom: 0, width: 210, height: 180, overflow: 'hidden', zIndex: 10
            }}>
              <Image
                source={require('../../tarsier-mascot/tar-id-nobg.png')}
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }}
                resizeMode="contain"
              />
            </View>

            <TarsiChatBubble
              message="NodeMCU & RC522 Hardware active! Live card scans will record directly to attendance."
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>

          {/* Active Event Selector */}
          {events.length === 0 ? (
            <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fef3c7', marginBottom: 20 }}>
              <Text style={{ color: '#d97706', fontWeight: '800', fontSize: 14 }}>No Active Events Found</Text>
              <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>Please create or activate an event in the Event Management tab first.</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Active Event
                </Text>
                <TouchableOpacity onPress={() => selectedEventId && fetchEventStats(selectedEventId)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RefreshCw size={12} color="#3b82f6" />
                  <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '700', marginLeft: 4 }}>Sync Stats</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {events.map((ev) => {
                  const isSelected = selectedEventId === ev.id;
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      onPress={() => setSelectedEventId(ev.id)}
                      style={{
                        marginRight: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#2563eb' : border,
                        backgroundColor: isSelected ? (isDark ? '#1e3a8a' : '#eff6ff') : bgCard,
                      }}
                    >
                      <Text style={{ fontWeight: '800', fontSize: 13, color: isSelected ? (isDark ? '#93c5fd' : '#1e40af') : textPrimary }}>
                        {ev.title}
                      </Text>
                      <Text style={{ fontSize: 10, marginTop: 2, color: isSelected ? (isDark ? '#bfdbfe' : '#3b82f6') : textSecondary }}>
                        {ev.event_date || 'Today'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Event Attendance Stats Summary */}
              {selectedEvent && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                  <View style={{ flex: 1, backgroundColor: bgCard, borderWidth: 1, borderColor: border, borderRadius: 14, padding: 12, alignItems: 'center' }}>
                    <Users size={16} color="#3b82f6" />
                    <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary, marginTop: 4 }}>
                      {loadingStats ? '...' : stats.total}
                    </Text>
                    <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>Total Scans</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5', borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                    <UserCheck size={16} color="#10b981" />
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#10b981', marginTop: 4 }}>
                      {loadingStats ? '...' : stats.checkedIn}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#047857', fontWeight: '700' }}>Checked In</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', borderWidth: 1, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                    <UserX size={16} color="#f59e0b" />
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#f59e0b', marginTop: 4 }}>
                      {loadingStats ? '...' : stats.checkedOut}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#b45309', fontWeight: '700' }}>Checked Out</Text>
                  </View>
                </View>
              )}

              {/* HARDWARE SCANNER / MANUAL BACKUP INPUT */}
              <View style={{ backgroundColor: bgCard, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: isDark ? '#1e3a8a' : '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <CreditCard size={24} color="#2563eb" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary }}>Hardware Scanner Active</Text>
                  <Text style={{ fontSize: 12, color: textSecondary, textAlign: 'center', marginTop: 4 }}>
                    Tap card on NodeMCU reader, or enter Card UID manually below
                  </Text>
                </View>

                <TextInput
                  ref={inputRef}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1.5,
                    borderColor: scanning ? '#2563eb' : border,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 18,
                    fontWeight: '800',
                    color: textPrimary,
                    textAlign: 'center',
                    letterSpacing: 2,
                    marginBottom: 14,
                  }}
                  placeholder="Place RFID card on reader..."
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  value={rfidInput}
                  onChangeText={setRfidInput}
                  onSubmitEditing={handleManualSubmit}
                  autoFocus
                  returnKeyType="done"
                  editable={!scanning}
                />

                <TouchableOpacity
                  onPress={handleManualSubmit}
                  disabled={scanning || !rfidInput.trim()}
                  style={{
                    backgroundColor: '#2563eb',
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    opacity: (scanning || !rfidInput.trim()) ? 0.6 : 1,
                  }}
                >
                  {scanning ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Submit Manual UID</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* LATEST SCAN RESULT CARD */}
              {lastScan && (
                <View style={{
                  backgroundColor: lastScan.success
                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5')
                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                  borderWidth: 1.5,
                  borderColor: lastScan.success ? (isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0') : (isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca'),
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    {lastScan.success ? (
                      <CheckCircle size={22} color="#10b981" />
                    ) : (
                      <XCircle size={22} color="#ef4444" />
                    )}
                    <Text style={{
                      fontWeight: '900', fontSize: 15, marginLeft: 8,
                      color: lastScan.success ? '#047857' : '#b91c1c'
                    }}>
                      {lastScan.message}
                    </Text>
                  </View>

                  {lastScan.userName ? (
                    <View style={{ backgroundColor: bgCard, padding: 12, borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: border }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: textPrimary }}>{lastScan.userName}</Text>
                      {lastScan.studentNumber && (
                        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                          ID: {lastScan.studentNumber} {lastScan.course ? `• ${lastScan.course}` : ''}
                        </Text>
                      )}

                      {lastScan.action && (
                        <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                          <View style={{
                            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                            backgroundColor: lastScan.action === 'checkin' ? '#d1fae5' : '#fef3c7'
                          }}>
                            <Text style={{
                              fontSize: 10, fontWeight: '900', textTransform: 'uppercase',
                              color: lastScan.action === 'checkin' ? '#047857' : '#b45309'
                            }}>
                              ACTION: {lastScan.action.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                      Scanned UID: <Text style={{ fontFamily: 'monospace', fontWeight: '800' }}>{lastScan.uid}</Text>
                    </Text>
                  )}
                </View>
              )}

              {/* RECENT SCAN SESSION LOG */}
              <View style={{ backgroundColor: bgCard, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={16} color="#3b82f6" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginLeft: 6 }}>
                      Session Scan History
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '700' }}>
                    {scanHistory.length} Scans
                  </Text>
                </View>

                {scanHistory.length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <CreditCard size={28} color={textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <Text style={{ color: textSecondary, fontSize: 12, fontWeight: '600' }}>No scans in this session yet.</Text>
                    <Text style={{ color: textSecondary, fontSize: 10, marginTop: 2 }}>Scanned cards will appear here in real-time.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {scanHistory.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          {item.success ? (
                            <CheckCircle size={16} color="#10b981" style={{ marginRight: 8 }} />
                          ) : (
                            <XCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
                          )}

                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>
                              {item.userName || `UID: ${item.uid}`}
                            </Text>
                            <Text style={{ fontSize: 10, color: textSecondary }}>
                              {item.time} • {item.message}
                            </Text>
                          </View>
                        </View>

                        {item.action && (
                          <View style={{
                            paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
                            backgroundColor: item.action === 'checkin' ? '#d1fae5' : '#fee2e2'
                          }}>
                            <Text style={{
                              fontSize: 9, fontWeight: '900', textTransform: 'uppercase',
                              color: item.action === 'checkin' ? '#047857' : '#991b1b'
                            }}>
                              {item.action}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </OfficerPageWrapper>
  );
}

