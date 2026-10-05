import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
import api from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Download, Calendar as CalendarIcon, Users, CheckCircle2, XCircle, Search, List, Grid, ChevronDown, X } from 'lucide-react-native';

export default function OfficerAttendance() {
  const { isDark, colors } = useTheme();
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
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
  const footerBg = isDark ? '#0f172a' : '#f8fafc';

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'All' | 'Grouped'>('Grouped');

  // School Year States
  const currentYearStr = new Date().getFullYear().toString();
  const [apiSchoolYears, setApiSchoolYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedYearId, setSelectedYearId] = useState<string | number>('all');
  const [showYearModal, setShowYearModal] = useState(false);

  const DEFAULT_SCHOOL_YEARS = [
    '2032-2033',
    '2031-2032',
    '2030-2031',
    '2029-2030',
    '2028-2029',
    '2027-2028',
    '2026-2027',
    '2025-2026',
    '2024-2025',
  ];

  const fetchSchoolYears = async () => {
    try {
      const res = await api.get('/school-years');
      if (Array.isArray(res.data)) {
        setApiSchoolYears(res.data);
      }
    } catch (_) {}
  };

  const fetchEvents = async (syId?: string | number) => {
    try {
      const targetSY = syId !== undefined ? syId : selectedYearId;
      const params: Record<string, any> = { role: 'officer' };
      if (targetSY && targetSY !== 'all') {
        params.school_year_id = targetSY;
      } else if (targetSY === 'all') {
        params.school_year_id = 'all';
      }
      const res = await api.get('/events', { params });
      const rawEvents = Array.isArray(res.data) ? res.data : [];

      // If a school year name is chosen without a db id, client filter as well
      const filteredEvents = rawEvents.filter(e => {
        if (selectedYear === 'All') return true;
        if (targetSY !== 'all' && e.school_year_id) {
          return String(e.school_year_id) === String(targetSY);
        }
        if (e.school_year?.name) {
          return e.school_year.name === selectedYear || e.school_year.name.includes(selectedYear);
        }
        const dStr = e.start_time || e.event_date;
        if (!dStr) return true;
        const d = new Date(dStr);
        const evYear = d.getFullYear();
        const evMonth = d.getMonth() + 1;
        if (selectedYear.includes('-')) {
          const [startYStr, endYStr] = selectedYear.split('-');
          const startY = parseInt(startYStr, 10);
          const endY = parseInt(endYStr, 10);
          if (!isNaN(startY) && !isNaN(endY)) {
            if (evYear === startY && evMonth >= 6) return true;
            if (evYear === endY && evMonth <= 5) return true;
            if (evYear === startY) return true;
            return false;
          }
        }
        return evYear.toString() === selectedYear;
      });

      setEvents(filteredEvents);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  const fetchAttendance = async (eventId: number) => {
    setLoadingAttendance(true);
    try {
      const res = await api.get(`/attendance/event/${eventId}`);
      const raw = res.data;
      const records = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.attendance) ? raw.attendance : []);
      setAttendance(records);

      if (raw?.stats) {
        setStats(raw.stats);
      } else {
        setStats({
          total: records.length,
          checked_in: records.filter((r: any) => r.status === 'checked_in').length,
          checked_out: records.filter((r: any) => r.status === 'checked_out').length,
        });
      }
    } catch (err) {
      console.error("Fetch attendance error:", err);
      setAttendance([]);
      setStats({ total: 0, checked_in: 0, checked_out: 0 });
    } finally {
      setLoadingAttendance(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchoolYears();
    fetchEvents();
  }, [orgId]);

  const availableYears = React.useMemo(() => {
    const map = new Map<string, { id?: number; name: string }>();
    DEFAULT_SCHOOL_YEARS.forEach(name => map.set(name, { name }));
    apiSchoolYears.forEach(sy => {
      if (sy.name) map.set(sy.name, { id: sy.id, name: sy.name });
    });
    return Array.from(map.values()).sort((a, b) => b.name.localeCompare(a.name));
  }, [apiSchoolYears]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredAttendance(attendance.filter(r => {
      const name = `${r.user?.first_name || r.user?.name || ''} ${r.user?.last_name || ''}`.toLowerCase();
      const stNum = String(r.user?.student_number || '').toLowerCase();
      return name.includes(q) || stNum.includes(q);
    }));
  }, [searchQuery, attendance]);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedEvent) fetchAttendance(selectedEvent.id);
    else fetchEvents();
  };

  const getInitials = (fName?: string, lName?: string) => {
    if (fName && lName) {
      return `${fName[0] || ''}${lName[0] || ''}`.toUpperCase();
    }
    if (fName) {
      const parts = fName.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
      }
      return (fName[0] || '?').toUpperCase();
    }
    return '?';
  };

  const getStatusColor = (st: string) => {
     if (st === 'completed') return { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe', color: isDark ? '#93c5fd' : '#1d4ed8' };
     if (st === 'ongoing') return { backgroundColor: isDark ? 'rgba(22,163,74,0.1)' : '#dcfce7', color: isDark ? '#86efac' : '#15803d' };
     return { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#cbd5e1' : '#334155' };
  };

  const safeFormatDate = (val: string) => {
     if (!val) return 'TBA';
     try { return new Date(val).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
     catch { return 'Bad Date'; }
  };

  const safeFormatTime = (val: string) => {
     if (!val) return '—';
     try { return new Date(val).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
     catch { return 'Error'; }
  };

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="attendance">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color="#0f2d5e" /></View>
    </OfficerPageWrapper>
  );

  const renderEventItem = (ev: any, isSelected: boolean = false) => {
     const statusStyle = getStatusColor(ev.status);
     return (
        <TouchableOpacity 
           key={ev.id} 
           activeOpacity={0.7}
           onPress={() => {
              if (isSelected) {
                 setSelectedEvent(null);
                 setAttendance([]);
                 setStats(null);
              } else {
                 setSelectedEvent(ev);
                 fetchAttendance(ev.id);
              }
           }}
           style={{ 
              borderWidth: 1, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: 12, 
              borderRadius: 16, 
              marginBottom: 8, 
              backgroundColor: isSelected ? (isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff') : cardBg, 
              borderColor: isSelected ? (isDark ? '#3b82f6' : '#bfdbfe') : border
           }}
        >
           <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                 <CalendarIcon size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                 <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>{ev.title}</Text>
                 <Text style={{ fontSize: 11, color: textSecondary }}>
                    {safeFormatDate(ev.start_time || ev.event_date)}
                 </Text>
              </View>
           </View>
           <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: statusStyle.backgroundColor }}>
              <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'capitalize', color: statusStyle.color }}>{ev.status || 'Upcoming'}</Text>
           </View>
        </TouchableOpacity>
     );
  };

  // Grouping logic for "Grouped" mode
  const groupedData = filteredAttendance.reduce((acc, curr) => {
     const course = typeof curr.user?.course === 'object' ? curr.user?.course?.name : curr.user?.course;
     const groupKey = course ? `${course} (Year ${curr.user?.year_level})` : 'Other';
     if (!acc[groupKey]) acc[groupKey] = [];
     acc[groupKey].push(curr);
     return acc;
  }, {} as Record<string, any[]>);

  const StatBox = ({ label, value, icon: Icon, colorClass }: any) => (
     <View style={{ flex: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 16, padding: 12, marginHorizontal: 4 }}>
        <Text style={{ fontSize: 10, color: textMuted, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colorClass.bg }}>
               <Icon size={14} color={colorClass.icon} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary }}>{value}</Text>
        </View>
     </View>
  );

  return (
    <OfficerPageWrapper activeRoute="attendance">
      <View style={{ flex: 1, backgroundColor: bg }}>
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
              <TouchableOpacity
                onPress={() => setShowYearModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                  borderWidth: 1.5,
                  borderColor: '#0fa968',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                  marginBottom: 6,
                }}
              >
                <CalendarIcon size={13} color="#0fa968" style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#0fa968', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {selectedYear === 'All' ? 'S.Y. ALL YEARS' : `S.Y. ${selectedYear}`}
                </Text>
                <ChevronDown size={13} color="#0fa968" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                {selectedEvent ? 'Live Tracker' : 'Attendance'}
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Download size={14} color={isDark ? '#94a3b8' : '#0f2d5e'} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f2d5e', marginLeft: 6 }}>Export</Text>
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
                source={require('../../tarsier-mascot/tar-attendance-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={selectedEvent ? `Monitoring ${selectedEvent.title}. You have ${stats?.checked_in || 0} members checked in!` : "Great job tracking! Select an event below to monitor real-time attendance."} 
            />
          </View>
         </View>

         <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
         >
            {/* SELECT EVENT CARD */}
            <View style={{ backgroundColor: cardBg, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: border, marginBottom: 16 }}>
               <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary, marginBottom: 2 }}>Select Event</Text>
               <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 16 }}>Choose an event to monitor attendance</Text>
               
               {!selectedEvent ? (
                  events.length === 0 ? (
                     <EmptyState icon="📅" message="No events available." />
                  ) : events.map(ev => renderEventItem(ev, false))
               ) : (
                  renderEventItem(selectedEvent, true)
               )}
            </View>

            {selectedEvent && (
               loadingAttendance ? (
                  <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 32, alignItems: 'center', marginBottom: 16 }}>
                     <ActivityIndicator size="small" color="#2563eb" />
                     <Text style={{ fontSize: 12, color: textSecondary, marginTop: 8, fontWeight: '600' }}>Loading attendance records...</Text>
                  </View>
               ) : stats ? (
                  <>
                     {/* STATS */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginHorizontal: -4 }}>
                     <StatBox label="Total Check-ins" value={stats.total || 0} icon={Users} colorClass={{ bg: isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff', icon: '#2563eb' }} />
                     <StatBox label="Currently In" value={stats.checked_in || 0} icon={CheckCircle2} colorClass={{ bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', icon: '#16a34a' }} />
                     <StatBox label="Checked Out" value={stats.checked_out || 0} icon={XCircle} colorClass={{ bg: isDark ? '#334155' : '#f8fafc', icon: isDark ? '#60a5fa' : '#3b82f6' }} />
                  </View>

                  {/* LIVE ATTENDANCE CARD */}
                  <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, padding: 16, marginBottom: 24 }}>
                     <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary, marginBottom: 2 }}>Live Attendance — {selectedEvent.title}</Text>
                     <Text style={{ fontSize: 11, color: textSecondary, marginBottom: 16 }}>Real-time attendance tracking</Text>

                     <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, backgroundColor: inputBg }}>
                        <Search size={16} color={textMuted} />
                        <TextInput
                           style={{ flex: 1, marginLeft: 8, fontSize: 12, color: textPrimary }}
                           placeholder="Search name or ID..."
                           placeholderTextColor={textMuted}
                           value={searchQuery}
                           onChangeText={setSearchQuery}
                        />
                     </View>

                     {/* Segmented Control */}
                     <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: border, borderRadius: 12, padding: 4, marginBottom: 24 }}>
                        <TouchableOpacity 
                           onPress={() => setViewMode('All')}
                           style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'All' ? cardBg : 'transparent' }}
                        >
                           <List size={14} color={viewMode === 'All' ? '#3b82f6' : textSecondary} />
                           <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 6, color: viewMode === 'All' ? textPrimary : textSecondary }}>View All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                           onPress={() => setViewMode('Grouped')}
                           style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'Grouped' ? cardBg : 'transparent' }}
                        >
                           <Grid size={14} color={viewMode === 'Grouped' ? '#3b82f6' : textSecondary} />
                           <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 6, color: viewMode === 'Grouped' ? textPrimary : textSecondary }}>Grouped</Text>
                        </TouchableOpacity>
                     </View>

                     {filteredAttendance.length === 0 ? (
                        <EmptyState icon="👀" message="No attendance records found." />
                     ) : viewMode === 'Grouped' ? (
                        Object.keys(groupedData).map(groupName => (
                           <View key={groupName} style={{ marginBottom: 24 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: borderLight, paddingBottom: 8, marginBottom: 12 }}>
                                 <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#93c5fd' : '#0f2d5e', flex: 1, paddingRight: 12 }}>{groupName}</Text>
                                 <View style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: textSecondary }}>{groupedData[groupName].length} Student{groupedData[groupName].length !== 1 ? 's' : ''}</Text>
                                 </View>
                              </View>
                              {groupedData[groupName].map((record: any) => renderAttendee(record))}
                           </View>
                        ))
                     ) : (
                        <View>
                           {filteredAttendance.map((record: any) => renderAttendee(record))}
                        </View>
                     )}
                  </View>
               </>
               ) : null
            )}
            
            <View style={{ height: 24 }} />
         </ScrollView>

        {/* SCHOOL YEAR MODAL */}
        <Modal visible={showYearModal} transparent animationType="fade" onRequestClose={() => setShowYearModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: modalBg, width: '100%', borderRadius: 16, padding: 24, elevation: 10, borderWidth: isDark ? 1 : 0, borderColor: '#334155' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CalendarIcon size={18} color="#0fa968" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Select School Year</Text>
                </View>
                <TouchableOpacity onPress={() => setShowYearModal(false)}><X size={20} color={textMuted} /></TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 18, lineHeight: 18 }}>
                Filter events and attendance records by academic year.
              </Text>

              <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedYear('All');
                    setSelectedYearId('all');
                    setSelectedEvent(null);
                    setShowYearModal(false);
                    fetchEvents('all');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: selectedYear === 'All' ? '#0fa968' : border,
                    backgroundColor: selectedYear === 'All' ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : cardBg,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: selectedYear === 'All' ? '#0fa968' : textPrimary }}>
                      🌐 All School Years
                    </Text>
                    <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                      Show all events across all academic years
                    </Text>
                  </View>
                  {selectedYear === 'All' && <CheckCircle2 size={18} color="#0fa968" />}
                </TouchableOpacity>

                {availableYears.map(sy => {
                  const isSelected = selectedYear === sy.name;
                  const isCurrent = sy.name.includes(currentYearStr) || sy.name === currentYearStr;
                  const startYear = parseInt(sy.name.split('-')[0], 10);
                  const isUpcoming = !isNaN(startYear) && startYear > parseInt(currentYearStr, 10);

                  const titleLabel = isCurrent
                    ? `📅 S.Y. ${sy.name} (Current Active)`
                    : isUpcoming
                      ? `🔮 S.Y. ${sy.name} (Upcoming)`
                      : `⏳ S.Y. ${sy.name} (Past Year)`;

                  const subtitleLabel = isCurrent
                    ? 'Current active academic year events'
                    : isUpcoming
                      ? 'Upcoming academic year events & schedule'
                      : 'Past academic year event archives';

                  return (
                    <TouchableOpacity
                      key={sy.name}
                      onPress={() => {
                        setSelectedYear(sy.name);
                        setSelectedYearId(sy.id || 'all');
                        setSelectedEvent(null);
                        setShowYearModal(false);
                        if (sy.id) {
                          fetchEvents(sy.id);
                        } else {
                          fetchEvents('all');
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 14,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#0fa968' : border,
                        backgroundColor: isSelected ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : cardBg,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? '#0fa968' : textPrimary }}>
                          {titleLabel}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                          {subtitleLabel}
                        </Text>
                      </View>
                      {isSelected && <CheckCircle2 size={18} color="#0fa968" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowYearModal(false)}
                style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '800' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </OfficerPageWrapper>
  );

  function renderAttendee(record: any) {
     const isCheckedIn = record.status === 'checked_in';
     return (
        <View key={record.id} style={{ borderWidth: 1, borderColor: border, borderRadius: 16, padding: 12, marginBottom: 12, backgroundColor: cardBg }}>
           <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                 <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                       {getInitials(record.user?.first_name || record.user?.name, record.user?.last_name)}
                    </Text>
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>
                       {record.user?.first_name || record.user?.name} {record.user?.last_name || ''}
                    </Text>
                    <Text style={{ fontSize: 10, color: textSecondary, fontFamily: 'monospace', marginTop: 2 }}>{record.user?.student_number}</Text>
                 </View>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: isCheckedIn ? (isDark ? 'rgba(22,163,74,0.1)' : '#dcfce7') : (isDark ? '#334155' : '#f1f5f9') }}>
                 <Text style={{ fontSize: 10, fontWeight: '800', color: isCheckedIn ? (isDark ? '#86efac' : '#15803d') : textSecondary }}>
                    {isCheckedIn ? 'Checked In' : 'Checked Out'}
                 </Text>
              </View>
           </View>

           <View style={{ flexDirection: 'row', marginBottom: 12, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '500', marginBottom: 2 }}>Check In</Text>
                 <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary }}>
                    {safeFormatTime(record.time_in)}
                 </Text>
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '500', marginBottom: 2 }}>Check Out</Text>
                 <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary }}>
                    {safeFormatTime(record.time_out)}
                 </Text>
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 10, color: textSecondary, fontWeight: '500', marginBottom: 2 }}>Duration</Text>
                 <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary }}>{record.formatted_duration || '—'}</Text>
              </View>
           </View>

           <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <View style={{ borderWidth: 1, borderColor: border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                 <Text style={{ fontSize: 9, fontWeight: '700', color: textSecondary, letterSpacing: 0.5 }}>{record.attendance_type || 'N/A'}</Text>
              </View>
           </View>
        </View>
     );
  }
}
