import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Download, Calendar as CalendarIcon, Users, CheckCircle2, XCircle, Search, List, Grid } from 'lucide-react-native';

export default function OfficerAttendance() {
  const { isDark, colors } = useTheme();
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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'All' | 'Grouped'>('Grouped');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?role=officer');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  const fetchAttendance = async (eventId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/event/${eventId}`);
      const attData = res.data.attendance || [];
      setAttendance(attData);
      setFilteredAttendance(attData);
      setStats(res.data.stats || { total: 0, checked_in: 0, checked_out: 0 });
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchEvents(); }, []);

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

  const getInitials = (fName: string, lName: string) => {
     return `${(fName || '?')[0].toUpperCase()}${(lName || '')[0]?.toUpperCase() || ''}`;
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
              if (isSelected) { setSelectedEvent(null); setAttendance([]); }
              else { setSelectedEvent(ev); fetchAttendance(ev.id); }
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
         {/* HEADER */}
         <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 16 }}>
               <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#f8fafc' : '#0f2d5e' }}>Attendance Monitoring</Text>
               <Text style={{ fontSize: 11, color: textSecondary, marginTop: 4 }}>Track member attendance in real-time</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: cardBg }}>
               <Download size={12} color={textSecondary} />
               <Text style={{ fontSize: 11, fontWeight: '600', color: textPrimary, marginLeft: 6 }}>Export</Text>
            </TouchableOpacity>
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

            {selectedEvent && stats && (
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
                              {groupedData[groupName].map(record => renderAttendee(record))}
                           </View>
                        ))
                     ) : (
                        <View>
                           {filteredAttendance.map(record => renderAttendee(record))}
                        </View>
                     )}
                  </View>
               </>
            )}
            
            <View style={{ height: 24 }} />
         </ScrollView>
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
                 <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary }}>—</Text> 
                 {/* Duration calculation can be added if required later, kept blank per design */}
              </View>
           </View>

           <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <View style={{ borderWidth: 1, borderColor: border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                 <Text style={{ fontSize: 9, fontWeight: '700', color: textSecondary, letterSpacing: 0.5 }}>RFID</Text>
              </View>
           </View>
        </View>
     );
  }
}
