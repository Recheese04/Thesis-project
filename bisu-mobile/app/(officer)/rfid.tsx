import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  ScrollView, Image, Modal, FlatList, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import {
  CreditCard, CheckCircle, XCircle, Cpu, RefreshCw,
  Users, UserCheck, UserX, Clock, Search, X, ListFilter, UserPlus, List
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
  action?: 'checkin' | 'checkout' | 'already_checkout' | 'unknown' | string;
  rawTime?: number;
}

const parseDateSafe = (dateStr: any): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  try {
    const s = String(dateStr).trim();
    if (!s) return null;
    const iso = s.replace(' ', 'T');
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
    const d2 = new Date(s.replace(/-/g, '/'));
    if (!isNaN(d2.getTime())) return d2;
  } catch (_) {}
  return null;
};

const formatTimeSafe = (dateStr: any): string => {
  const d = parseDateSafe(dateStr);
  if (!d) return 'Just now';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function OfficerRFIDScanner() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rfidInput, setRfidInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Scan Mode: 'checkin' (force check-in) or 'checkout' (force check-out)
  const [scanMode, setScanMode] = useState<'checkin' | 'checkout'>('checkin');

  // Event Attendance Stats
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, checkedOut: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [lastFailedScan, setLastFailedScan] = useState<any | null>(null);

  // Member Search & Manual Attendance Modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [submittingMemberId, setSubmittingMemberId] = useState<number | null>(null);

  const { membership } = useAuth();
  const { isDark } = useTheme();

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const bgCard = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';

  const inputRef = useRef<TextInput>(null);
  const lastScanThrottleRef = useRef<{ uid: string; time: number }>({ uid: '', time: 0 });

  // Scanner Session & Devices (Officer Hardware Assignment)
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(),
        fetchActiveSession(),
        fetchDevices(),
        selectedEventId ? fetchEventStats(selectedEventId, true) : Promise.resolve(),
      ]);
    } catch (_) {
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchActiveSession();
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/scanner-devices');
      setDevices(res.data.devices || []);
    } catch (_) { }
  };

  const fetchActiveSession = async () => {
    try {
      const res = await api.get('/scanner-sessions/active');
      setActiveSession(res.data.session || null);
    } catch (_) { }
  };

  const handleStartSession = async () => {
    if (!selectedEventId) {
      Alert.alert('Select Event', 'Please select an ongoing event first.');
      return;
    }
    setLoadingSession(true);
    try {
      const res = await api.post('/scanner-sessions/start', {
        event_id: selectedEventId,
        device_id: selectedDeviceId,
      });
      setActiveSession(res.data.session);
      Alert.alert('Scanner Session Started', `NodeMCU hardware is now bound to "${res.data.session.event_title}". Scans will be logged under your officer name.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to start scanner session.');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleStopSession = async () => {
    setLoadingSession(true);
    try {
      await api.post('/scanner-sessions/stop');
      setActiveSession(null);
      Alert.alert('Session Stopped', 'The hardware scanner session has been ended.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to stop scanner session.');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleRenameDevice = (device: any) => {
    Alert.prompt(
      'Rename Scanner Board',
      `Enter friendly name for device (${device.device_id}):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newName?: string) => {
            if (!newName || !newName.trim()) return;
            try {
              await api.put(`/scanner-devices/${device.id}/rename`, { name: newName.trim() });
              fetchDevices();
              Alert.alert('Success', 'Scanner renamed successfully!');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to rename scanner.');
            }
          },
        },
      ],
      'plain-text',
      device.name !== 'Unnamed Scanner' ? device.name : ''
    );
  };

  useEffect(() => {
    if (selectedEventId) {
      // Clear old event's data immediately when event changes
      setScanHistory([]);
      setLastScan(null);
      setLastFailedScan(null);
      setStats({ total: 0, checkedIn: 0, checkedOut: 0 });

      fetchEventStats(selectedEventId, false);
      const interval = setInterval(() => {
        fetchEventStats(selectedEventId, true);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setScanHistory([]);
      setLastScan(null);
      setLastFailedScan(null);
      setStats({ total: 0, checkedIn: 0, checkedOut: 0 });
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/events?role=officer');
      const allEvents = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.events || []);
      // STRICT FILTER: Only show events that are currently 'ongoing'
      const ongoingEvents = allEvents.filter((ev: any) => ev.status === 'ongoing');
      setEvents(ongoingEvents);
      if (ongoingEvents.length > 0) {
        setSelectedEventId(ongoingEvents[0].id);
      } else {
        setSelectedEventId(null);
      }
    } catch (_) { }
    setLoadingEvents(false);
  };

  const fetchEventStats = async (eventId: number, isSilent = false) => {
    if (!isSilent) setLoadingStats(true);
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

        // Sync individual Check-In and Check-Out actions into chronological history
        if (Array.isArray(records)) {
          const distinctLogs: ScanRecord[] = [];

          records.forEach((rec: any) => {
            const u = rec.user || rec.student || {};
            const userName = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Student';
            const studentNumber = u.student_number || u.student_id;
            const course = typeof u.course === 'string' ? u.course : u.course?.name;
            const uid = u.rfid_uid || 'RFID';

            const dIn = parseDateSafe(rec.time_in);

            // 1. If student checked in, create a distinct CHECK-IN log entry
            if (rec.time_in) {
              distinctLogs.push({
                id: `${rec.id}-in`,
                rawTime: dIn ? dIn.getTime() : 0,
                time: formatTimeSafe(rec.time_in),
                uid,
                success: true,
                message: 'Check-In recorded',
                userName,
                studentNumber,
                course,
                action: 'checkin',
              });
            }

            // 2. If student checked out, create a separate distinct CHECK-OUT log entry
            if (rec.time_out || rec.status === 'checked_out') {
              const dOut = parseDateSafe(rec.time_out || rec.updated_at);
              distinctLogs.push({
                id: `${rec.id}-out`,
                rawTime: dOut ? dOut.getTime() : (dIn ? dIn.getTime() + 1000 : 1),
                time: formatTimeSafe(rec.time_out || rec.updated_at),
                uid,
                success: true,
                message: 'Check-Out recorded',
                userName,
                studentNumber,
                course,
                action: 'checkout',
              });
            }
          });

          // Sort latest actions at the very top
          distinctLogs.sort((a, b) => (b.rawTime || 0) - (a.rawTime || 0));

          setScanHistory(distinctLogs);

          if (distinctLogs.length > 0) {
            setLastScan(distinctLogs[0]);
          }
        }

        // Sync live failed scans from backend cache
        if (res.data.last_failed_scan) {
          setLastFailedScan(res.data.last_failed_scan);
        } else {
          setLastFailedScan(null);
        }
      }
    } catch (_) {
    } finally {
      if (!isSilent) setLoadingStats(false);
    }
  };

  const fetchOrgMembers = async () => {
    const orgId = membership?.organization_id;
    if (!orgId) return;
    setLoadingMembers(true);
    try {
      const res = await api.get(`/organizations/${orgId}/members`);
      const list = Array.isArray(res.data) ? res.data : (res.data.members || []);
      setMembers(list);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load organization members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const openMemberModal = () => {
    if (!selectedEventId) {
      Alert.alert('Select Event', 'Please select an active ongoing event first.');
      return;
    }
    setShowMemberModal(true);
    fetchOrgMembers();
  };

  const executeScan = async (uidToScan: string) => {
    const cleanUid = uidToScan.trim();
    if (!cleanUid) return;
    if (!selectedEventId) {
      Alert.alert('Select Event', 'Please select an ongoing event first before scanning.');
      return;
    }

    // Cooldown throttle: Prevent same card from multi-firing within 2.5 seconds
    const now = Date.now();
    if (lastScanThrottleRef.current.uid === cleanUid && now - lastScanThrottleRef.current.time < 2500) {
      return;
    }
    lastScanThrottleRef.current = { uid: cleanUid, time: now };

    setScanning(true);

    try {
      const endpoint = scanMode === 'checkout' ? '/attendance/rfid-checkout' : '/attendance/rfid-checkin';

      const res = await api.post(endpoint, {
        event_id: selectedEventId,
        rfid_uid: cleanUid,
      });

      const data = res.data;
      const actionType = scanMode === 'checkout' ? 'checkout' : 'checkin';
      const isAlready = data.message && (data.message.toLowerCase().includes('already'));

      const newRecord: ScanRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        uid: cleanUid,
        success: !isAlready,
        message: data.message || `Scan (${actionType === 'checkout' ? 'Check-Out' : 'Check-In'}) recorded successfully!`,
        userName: data.user_name,
        studentNumber: data.student_number,
        course: data.course,
        action: actionType,
      };

      setLastScan(newRecord);
      setScanHistory(prev => [newRecord, ...prev]);
      setRfidInput('');

      // Refresh event statistics silently
      fetchEventStats(selectedEventId, true);

      // Keep focus on input for continuous hardware scanning
      setTimeout(() => inputRef.current?.focus(), 150);
    } catch (err: any) {
      const errData = err.response?.data || {};
      const failRecord: ScanRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        uid: cleanUid,
        success: false,
        message: errData.message || (scanMode === 'checkout' ? 'Check-Out failed.' : 'Check-In failed.'),
        userName: errData.user_name,
        studentNumber: errData.student_number,
        action: scanMode === 'checkout' ? 'checkout' : 'checkin',
      };

      setLastScan(failRecord);
      setScanHistory(prev => [failRecord, ...prev]);
      setRfidInput('');
      setTimeout(() => inputRef.current?.focus(), 150);
    } finally {
      setScanning(false);
    }
  };

  const handleManualMemberAction = async (memberUser: any, type: 'checkin' | 'checkout') => {
    if (!selectedEventId) return;
    const userId = memberUser.id || memberUser.user_id || memberUser.user?.id;
    if (!userId) return;

    const name = `${memberUser.user?.first_name || memberUser.first_name || 'Member'} ${memberUser.user?.last_name || memberUser.last_name || ''}`.trim();

    setSubmittingMemberId(userId);
    try {
      const endpoint = type === 'checkin' ? '/attendance/manual-checkin' : '/attendance/manual-checkout';
      const res = await api.post(endpoint, {
        event_id: selectedEventId,
        user_id: userId,
      });

      const newRecord: ScanRecord = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        uid: 'MANUAL',
        success: true,
        message: res.data?.message || `Manual ${type === 'checkin' ? 'Check-In' : 'Check-Out'} recorded`,
        userName: name,
        studentNumber: memberUser.user?.student_number || memberUser.student_number,
        course: memberUser.user?.course?.name || memberUser.course,
        action: type,
      };

      setLastScan(newRecord);
      setScanHistory(prev => [newRecord, ...prev]);
      fetchEventStats(selectedEventId);
      Alert.alert('Success', `Recorded manual ${type === 'checkin' ? 'Check-In' : 'Check-Out'} for ${name}.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.user_id?.[0] || `Failed to record manual ${type}.`;
      Alert.alert('Manual Attendance Status', msg);
    } finally {
      setSubmittingMemberId(null);
    }
  };

  const handleModeChange = (mode: 'checkin' | 'checkout') => {
    setScanMode(mode);
    if (selectedEventId) {
      api.post('/scanner-sessions/mode', {
        event_id: selectedEventId,
        mode: mode,
      }).catch(() => {});
    }
  };

  const filteredMembers = members.filter(m => {
    const u = m.user || m;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const stNo = String(u.student_number || '').toLowerCase();
    const des = String(m.designation || '').toLowerCase();
    const q = memberQuery.toLowerCase();
    return name.includes(q) || stNo.includes(q) || des.includes(q);
  });

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
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
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

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={onRefresh}
                disabled={refreshing}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  borderWidth: 1,
                  borderColor: border,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <RefreshCw size={18} color="#2563eb" />
              </TouchableOpacity>

              <View style={{ width: 44, height: 44, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <CreditCard size={20} color={isDark ? '#94a3b8' : '#2563eb'} />
              </View>
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
              message="NodeMCU & RC522 Hardware active! Choose Check-In or Check-Out mode below."
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>

          {/* Active Event Selector */}
          {events.length === 0 ? (
            <View style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', padding: 18, borderRadius: 18, borderWidth: 1.5, borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fef3c7', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ color: '#d97706', fontWeight: '900', fontSize: 15 }}>No Ongoing Events Found</Text>
                  <Text style={{ color: textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                    Only events with status <Text style={{ fontWeight: '800', color: '#d97706' }}>"Ongoing"</Text> appear here for attendance scanning.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={fetchEvents}
                  style={{
                    backgroundColor: '#2563eb',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <RefreshCw size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Ongoing Event
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

              {/* SCANNER SESSION CARD (OFFICER & EVENT BINDING) */}
              <View style={{
                backgroundColor: activeSession ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5') : bgCard,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: activeSession ? '#10b981' : border,
                padding: 16,
                marginBottom: 20,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeSession ? '#10b981' : '#94a3b8', marginRight: 6 }} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: activeSession ? '#10b981' : textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {activeSession ? 'Hardware Bound & Active' : 'NodeMCU Hardware Binding'}
                      </Text>
                    </View>

                    {activeSession ? (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: textPrimary }}>
                          {activeSession.event_title}
                        </Text>
                        <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>
                          👤 Officer: <Text style={{ fontWeight: '800', color: textPrimary }}>{activeSession.officer_name}</Text>
                          {activeSession.device_id ? ` • 📟 ${activeSession.device_id}` : ' • 🌐 All Scanners'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary }}>
                          Bind Scanner to Selected Event
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                          Assign hardware scans to <Text style={{ fontWeight: '700', color: '#2563eb' }}>{selectedEvent?.title || 'Selected Event'}</Text>
                        </Text>
                      </>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={activeSession ? handleStopSession : handleStartSession}
                    disabled={loadingSession}
                    style={{
                      backgroundColor: activeSession ? '#ef4444' : '#2563eb',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {loadingSession ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
                        {activeSession ? 'Stop Session' : 'Start Session'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* DEVICE SELECTOR (ONLY WHEN NO ACTIVE SESSION) */}
                {!activeSession && devices.length > 0 && (
                  <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Target Hardware Scanner
                      </Text>
                      <TouchableOpacity onPress={fetchDevices} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <RefreshCw size={10} color="#3b82f6" />
                        <Text style={{ fontSize: 10, color: '#3b82f6', fontWeight: '700', marginLeft: 3 }}>Refresh</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity
                        onPress={() => setSelectedDeviceId(null)}
                        style={{
                          marginRight: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: selectedDeviceId === null ? '#2563eb' : border,
                          backgroundColor: selectedDeviceId === null ? (isDark ? '#1e3a8a' : '#eff6ff') : bgCard,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: selectedDeviceId === null ? '#2563eb' : textPrimary }}>
                          🌐 Any Scanner (Default)
                        </Text>
                      </TouchableOpacity>

                      {devices.map((dev) => {
                        const isSelected = selectedDeviceId === dev.device_id;
                        return (
                          <View
                            key={dev.id}
                            style={{
                              marginRight: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: isSelected ? '#2563eb' : border,
                              backgroundColor: isSelected ? (isDark ? '#1e3a8a' : '#eff6ff') : bgCard,
                            }}
                          >
                            <TouchableOpacity onPress={() => setSelectedDeviceId(dev.device_id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dev.is_online ? '#10b981' : '#94a3b8', marginRight: 6 }} />
                              <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#2563eb' : textPrimary }}>
                                {dev.name !== 'Unnamed Scanner' ? dev.name : dev.device_id}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleRenameDevice(dev)} style={{ marginLeft: 6, padding: 2 }}>
                              <Text style={{ fontSize: 10, color: textSecondary }}>✏️</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* HARDWARE SCANNER & SCAN MODE SELECTOR */}
              <View style={{ backgroundColor: bgCard, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                
                {/* SCAN MODE TOGGLE TABS */}
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Hardware Scan Mode
                </Text>
                <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => handleModeChange('checkin')}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 9,
                      alignItems: 'center',
                      backgroundColor: scanMode === 'checkin' ? '#10b981' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: scanMode === 'checkin' ? '#ffffff' : textSecondary }}>
                      📥 Check-In Mode
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleModeChange('checkout')}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 9,
                      alignItems: 'center',
                      backgroundColor: scanMode === 'checkout' ? '#f59e0b' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: scanMode === 'checkout' ? '#ffffff' : textSecondary }}>
                      📤 Check-Out Mode
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: scanMode === 'checkin' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7') : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'), alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <CreditCard size={26} color={scanMode === 'checkin' ? '#10b981' : '#f59e0b'} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary }}>
                    Hardware Scanner ({scanMode === 'checkin' ? 'Check-In' : 'Check-Out'})
                  </Text>
                  <Text style={{ fontSize: 12, color: textSecondary, textAlign: 'center', marginTop: 4 }}>
                    {scanMode === 'checkin' ? 'Tap RFID card on reader to record Check-In' : 'Tap RFID card on reader to record Check-Out'}
                  </Text>
                </View>

                {/* Invisible input listener for physical USB/Bluetooth card readers */}
                <TextInput
                  ref={inputRef}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                  value={rfidInput}
                  onChangeText={setRfidInput}
                  onSubmitEditing={() => executeScan(rfidInput)}
                  autoFocus
                  returnKeyType="done"
                />

                {/* QUICK ACTIONS BUTTONS */}
                <View style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={openMemberModal}
                    style={{
                      backgroundColor: '#2563eb',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserPlus size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                      Manual Check-in / Check-out by Name
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/(officer)/attendance')}
                    style={{
                      backgroundColor: isDark ? '#334155' : '#f1f5f9',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: border,
                    }}
                  >
                    <List size={18} color={textPrimary} style={{ marginRight: 8 }} />
                    <Text style={{ color: textPrimary, fontWeight: '800', fontSize: 14 }}>
                      View Full Attendance Records
                    </Text>
                  </TouchableOpacity>
                </View>
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

              {/* FAILED SCAN ALERT BANNER (Hardware scanner errors surfaced from backend cache) */}
              {lastFailedScan && (
                <View style={{
                  backgroundColor: lastFailedScan.action === 'not_member'
                    ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb')
                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                  borderWidth: 1.5,
                  borderColor: lastFailedScan.action === 'not_member'
                    ? (isDark ? 'rgba(245, 158, 11, 0.5)' : '#fcd34d')
                    : (isDark ? 'rgba(239, 68, 68, 0.5)' : '#fca5a5'),
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <XCircle size={22} color={lastFailedScan.action === 'not_member' ? '#f59e0b' : '#ef4444'} />
                    <Text style={{
                      fontWeight: '900', fontSize: 14, marginLeft: 8,
                      color: lastFailedScan.action === 'not_member' ? '#b45309' : '#b91c1c',
                      flex: 1,
                    }}>
                      {lastFailedScan.action === 'not_member' ? '⚠️ Not an Org Member' : '❌ Unknown RFID Card'}
                    </Text>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                      backgroundColor: lastFailedScan.action === 'not_member' ? '#fef3c7' : '#fee2e2',
                    }}>
                      <Text style={{
                        fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6,
                        color: lastFailedScan.action === 'not_member' ? '#92400e' : '#991b1b',
                      }}>DENIED</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    {lastFailedScan.user_name ? (
                      <>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: textPrimary }}>{lastFailedScan.user_name}</Text>
                        {lastFailedScan.student_number && (
                          <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>Student No: {lastFailedScan.student_number}</Text>
                        )}
                        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 4 }}>{lastFailedScan.message}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: '800', color: textPrimary }}>
                          UID: {lastFailedScan.rfid_uid || 'Unknown'}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 4 }}>{lastFailedScan.message}</Text>
                      </>
                    )}
                    <Text style={{ fontSize: 10, color: textSecondary, marginTop: 6 }}>
                      🕐 {lastFailedScan.scanned_at} · Event: {lastFailedScan.event_title}
                    </Text>
                  </View>
                </View>
              )}

              {/* RECENT SCAN SESSION LOG */}
              <View style={{ backgroundColor: bgCard, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={16} color="#3b82f6" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginLeft: 6 }}>
                      Attendance History
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '700' }}>
                    {scanHistory.length} Records
                  </Text>
                </View>
                {selectedEventId && events.find((e: any) => e.id === selectedEventId) && (
                  <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '700', marginBottom: 12 }}>
                    📅 {events.find((e: any) => e.id === selectedEventId)?.title}
                  </Text>
                )}

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
                            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                            backgroundColor: item.action === 'checkin'
                              ? '#d1fae5'
                              : item.action === 'checkout'
                                ? '#fef3c7'
                                : '#fee2e2'
                          }}>
                            <Text style={{
                              fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5,
                              color: item.action === 'checkin'
                                ? '#047857'
                                : item.action === 'checkout'
                                  ? '#b45309'
                                  : '#dc2626'
                            }}>
                              {item.action === 'checkin' ? 'CHECK-IN' : item.action === 'checkout' ? 'CHECK-OUT' : item.action}
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

        {/* MODAL: MANUAL MEMBER CHECK-IN / CHECK-OUT */}
        <Modal
          visible={showMemberModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMemberModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '85%',
              borderWidth: 1,
              borderColor: border,
            }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary }}>Manual Member Attendance</Text>
                  <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>Select Check-In or Check-Out for a member</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowMemberModal(false)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} color={textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderRadius: 14,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: border,
                marginBottom: 14,
              }}>
                <Search size={18} color={textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                    fontSize: 14,
                    color: textPrimary,
                  }}
                  placeholder="Search by member name, ID number..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={memberQuery}
                  onChangeText={setMemberQuery}
                />
                {memberQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMemberQuery('')}>
                    <X size={16} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Members List */}
              {loadingMembers ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={{ color: textSecondary, marginTop: 10, fontSize: 13, fontWeight: '600' }}>Loading organization members...</Text>
                </View>
              ) : filteredMembers.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Users size={32} color={textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '700' }}>No members found</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 8, paddingBottom: 20 }}>
                    {filteredMembers.map((m) => {
                      const u = m.user || m;
                      const uId = u.id || m.user_id || m.id;
                      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User';
                      const stNo = u.student_number || 'No ID';
                      const designation = m.designation || 'Member';
                      const isSubmitting = submittingMemberId === uId;

                      return (
                        <View
                          key={m.id || uId}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 12,
                            borderRadius: 14,
                            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                            borderWidth: 1,
                            borderColor: border,
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary }}>{fullName}</Text>
                            <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                              ID: {stNo} • <Text style={{ color: '#3b82f6', fontWeight: '700' }}>{designation}</Text>
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              onPress={() => handleManualMemberAction(m, 'checkin')}
                              disabled={isSubmitting}
                              style={{
                                backgroundColor: '#10b981',
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: isSubmitting ? 0.6 : 1,
                              }}
                            >
                              {isSubmitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <>
                                  <UserCheck size={13} color="#ffffff" style={{ marginRight: 3 }} />
                                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>In</Text>
                                </>
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleManualMemberAction(m, 'checkout')}
                              disabled={isSubmitting}
                              style={{
                                backgroundColor: '#f59e0b',
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: isSubmitting ? 0.6 : 1,
                              }}
                            >
                              {isSubmitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <>
                                  <UserX size={13} color="#ffffff" style={{ marginRight: 3 }} />
                                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Out</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </OfficerPageWrapper>
  );
}

