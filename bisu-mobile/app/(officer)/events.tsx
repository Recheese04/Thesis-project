import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert, Modal, Platform, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Clock, Building2, Plus, X, Calendar as CalendarIcon, CheckCircle2, RefreshCw, Search, MoreHorizontal, Activity, Edit3, QrCode, Users, ClipboardList, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OfficerEvents() {
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
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Dropdown / Form Extensions
  const [actionEvent, setActionEvent] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<any>(null);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); 
  const [time, setTime] = useState(''); 
  const [endTime, setEndTime] = useState(''); 
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [submitting, setSubmitting] = useState(false);

  // Picker States
  const [showPicker, setShowPicker] = useState<'date' | 'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?role=officer'); // Match the web parameter structure
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setEvents(data);
      setFiltered(data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(events.filter(e => {
      return (e.title ?? '').toLowerCase().includes(q) || (e.location ?? '').toLowerCase().includes(q);
    }));
  }, [search, events]);

  const handleSubmit = async () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Error', 'Event Title and Date are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
         await api.put(`/events/${editingId}`, {
           title, description, event_date: date, event_time: time || undefined, end_time: endTime || undefined, location, status
         });
         Alert.alert('Success', 'Event updated successfully.');
      } else {
         await api.post('/events', {
           title, description, event_date: date, event_time: time || undefined, end_time: endTime || undefined, location, status
         });
         Alert.alert('Success', 'Event created successfully.');
      }
      setModalVisible(false);
      setEditingId(null);
      setTitle(''); setDescription(''); setDate(''); setTime(''); setEndTime(''); setLocation(''); setStatus('upcoming');
      fetchEvents();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to process event.');
    }
    setSubmitting(false);
  };

  const handleEdit = (ev: any) => {
    setActionEvent(null);
    setEditingId(ev.id);
    setTitle(ev.title || '');
    setDescription(ev.description || '');
    setDate(ev.start_time ? ev.start_time.split(' ')[0] : ev.event_date);
    setTime(ev.event_time || '');
    setEndTime(ev.end_time || '');
    setLocation(ev.location || '');
    setStatus(ev.status || 'upcoming');
    setModalVisible(true);
  };

  const handleDelete = (ev: any) => {
    setActionEvent(null);
    Alert.alert('Delete Event', `Are you sure you want to delete "${ev.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
         try {
           await api.delete(`/events/${ev.id}`);
           setEvents(prev => prev.filter(e => e.id !== ev.id));
         } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const getStatusIcon = (st: string) => {
    switch (st) {
       case 'ongoing': return <Activity size={10} color="#15803d" />;
       case 'completed': return <CheckCircle2 size={10} color="#475569" />;
       case 'cancelled': return <X size={10} color="#b91c1c" />;
       default: return <Clock size={10} color="#1d4ed8" />; // upcoming
    }
  };

  const getStatusStyle = (st: string) => {
    switch (st) {
       case 'ongoing': return { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#bbf7d0', color: isDark ? '#6ee7b7' : '#15803d' };
       case 'completed': return { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: isDark ? '#475569' : '#e2e8f0', color: isDark ? '#94a3b8' : '#475569' };
       case 'cancelled': return { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca', color: isDark ? '#fca5a5' : '#b91c1c' };
       default: return { backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff', borderColor: isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe', color: isDark ? '#93c5fd' : '#1d4ed8' };
    }
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    const currentMode = showPicker;
    setShowPicker(Platform.OS === 'ios' ? showPicker : null);
    if (selectedDate && event.type !== 'dismissed') {
      if (currentMode === 'date') {
        const d = selectedDate.toISOString().split('T')[0];
        setDate(d);
      } else if (currentMode === 'start') {
        const h = selectedDate.getHours().toString().padStart(2, '0');
        const m = selectedDate.getMinutes().toString().padStart(2, '0');
        setTime(`${h}:${m}`);
      } else if (currentMode === 'end') {
        const h = selectedDate.getHours().toString().padStart(2, '0');
        const m = selectedDate.getMinutes().toString().padStart(2, '0');
        setEndTime(`${h}:${m}`);
      }
    }
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
  };

  const openPicker = (mode: 'date' | 'start' | 'end') => {
    setTempDate(new Date());
    setShowPicker(mode);
  };

  const renderPicker = () => {
    if (!showPicker) return null;
    return (
      <DateTimePicker
        value={tempDate}
        mode={showPicker === 'date' ? 'date' : 'time'}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={handlePickerChange}
      />
    );
  };

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="events">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color="#0f2d5e" /></View>
    </OfficerPageWrapper>
  );

  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  const StatCard = ({ label, value, sub, bgClass, icon: Icon }: any) => (
    <View style={[{ borderRadius: 20, padding: 16, flex: 1, margin: 4, position: 'relative', overflow: 'hidden' }, bgClass]}>
      {/* Visual background flair circles mimicking the web gradients */}
      <View style={{ position: 'absolute', right: -20, top: -20, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <View style={{ position: 'absolute', right: -8, bottom: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
        <View>
          <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>{value}</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{sub}</Text>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color="#fff" />
        </View>
      </View>
    </View>
  );

  return (
    <OfficerPageWrapper activeRoute="events">
      <View style={{ flex: 1, backgroundColor: bg }}>
        
        {/* Header Section Matches Web Web Exactly */}
        <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: borderLight }}>
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#0f2d5e', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                 <CalendarIcon size={20} color="#fff" />
              </View>
              <View>
                 <Text style={{ fontSize: 20, fontWeight: '800', color: textPrimary }}>Events</Text>
                 <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>Create and manage your organization's events</Text>
              </View>
           </View>

           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity 
                 onPress={() => { setRefreshing(true); fetchEvents(); }}
                 style={{ width: 40, height: 40, backgroundColor: cardBg, borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                 <RefreshCw size={16} color="#0f2d5e" />
              </TouchableOpacity>

              <TouchableOpacity 
                 style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2d5e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, height: 40 }}
                 onPress={() => {
                   setEditingId(null);
                   setTitle(''); setDescription(''); setDate(''); setTime(''); setEndTime(''); setLocation(''); setStatus('upcoming');
                   setModalVisible(true);
                 }}
              >
                 <Plus size={16} color="#fff" />
                 <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Add</Text>
              </TouchableOpacity>
           </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <StatCard label="Total Events" value={stats.total} sub={`${stats.upcoming} upcoming`} bgClass={{ backgroundColor: '#244b7d' }} icon={CalendarIcon} />
              <StatCard label="Upcoming" value={stats.upcoming} sub="Scheduled" bgClass={{ backgroundColor: '#3b6fd4' }} icon={Clock} />
            </View>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <StatCard label="Ongoing" value={stats.ongoing} sub="Active now" bgClass={{ backgroundColor: '#10b981' }} icon={Activity} />
              <StatCard label="Completed" value={stats.completed} sub="Past events" bgClass={{ backgroundColor: '#818cf8' }} icon={CheckCircle2} />
            </View>
          </View>

          {/* Table Container Mimic */}
          <View style={{ backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor: border, overflow: 'hidden', marginBottom: 24 }}>
             
             {/* Toolbar */}
             <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: cardBg, zIndex: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}>
                   <Search size={14} color="#94a3b8" />
                   <TextInput
                      style={{ flex: 1, marginLeft: 8, fontSize: 12, color: textPrimary }}
                      placeholder="Search events..."
                      placeholderTextColor="#94a3b8"
                      value={search}
                      onChangeText={setSearch}
                   />
                </View>
                
                <View style={{ backgroundColor: isDark ? '#334155' : '#f8fafc', borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 34, width: 80 }}>
                   <Text style={{ fontSize: 11, color: textPrimary, fontWeight: '500' }}>All</Text>
                   <Text style={{ fontSize: 10, color: textMuted }}>▼</Text>
                </View>
             </View>

             <View style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: borderLight, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 10, color: textMuted }}><Text style={{ fontWeight: '800', color: textSecondary }}>{filtered.length}</Text> results</Text>
             </View>

             {/* Entries */}
             <View style={{ backgroundColor: cardBg }}>
                {filtered.length === 0 ? (
                   <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarIcon size={32} color="#cbd5e1" />
                      <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginTop: 8 }}>No events found</Text>
                   </View>
                ) : filtered.map((ev, index) => {
                   const isLast = index === filtered.length - 1;
                   return (
                      <View key={ev.id} style={{ padding: 16, ...(!isLast ? { borderBottomWidth: 1, borderBottomColor: borderLight } : {}) }}>
                         <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                               <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#0f2d5e', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 }}>
                                  <CalendarIcon size={16} color="#fff" />
                               </View>
                               <View style={{ flex: 1, paddingRight: 8 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>{ev.title}</Text>
                                  
                                  <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 8, ...getStatusStyle(ev.status) }}>
                                     {getStatusIcon(ev.status)}
                                     <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'capitalize', marginLeft: 4 }}>{ev.status}</Text>
                                  </View>

                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                                     <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                        <Clock size={11} color="#94a3b8" />
                                        <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 4 }}>
                                           {new Date(ev.start_time || ev.event_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                           {(ev.event_time) ? ` · ${ev.event_time}` : ''}
                                           {(ev.end_time) ? ` - ${ev.end_time}` : ''}
                                        </Text>
                                     </View>
                                     
                                     {!!ev.location && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                           <MapPin size={11} color="#94a3b8" />
                                           <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 4 }}>{ev.location}</Text>
                                        </View>
                                     )}
                                  </View>
                               </View>
                            </View>
                            <TouchableOpacity style={{ padding: 8, marginRight: -8 }} onPress={() => setActionEvent(ev)}>
                               <MoreHorizontal size={20} color="#94a3b8" />
                            </TouchableOpacity>
                         </View>
                      </View>
                   );
                })}
             </View>

             {/* Table Footer */}
             <View style={{ backgroundColor: footerBg, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: borderLight }}>
                <Text style={{ fontSize: 10, color: textMuted }}>
                   Showing <Text style={{ fontWeight: '800', color: textSecondary }}>{filtered.length}</Text> of <Text style={{ fontWeight: '800', color: textSecondary }}>{events.length}</Text> events
                </Text>
             </View>
          </View>
          
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Modal UI Preserved Exactly */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '90%' }}>
              
              <View style={{ backgroundColor: '#0f2d5e', paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <CalendarIcon size={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>Create New Event</Text>
                    <Text style={{ color: '#93c5fd', fontSize: 12, marginTop: 2 }}>Add a new event to your calendar</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Event Title <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TextInput
                    style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: textPrimary }}
                    placeholder="e.g. General Assembly 2025"
                    placeholderTextColor={textMuted}
                    value={title} onChangeText={setTitle}
                  />
                </View>
                
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Date <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TouchableOpacity 
                     style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                     onPress={() => openPicker('date')}
                  >
                     <Text style={{ fontSize: 15, color: date ? textPrimary : textMuted }}>{date || 'Select Date (YYYY-MM-DD)'}</Text>
                     <CalendarIcon size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Start Time</Text>
                    <TouchableOpacity 
                       style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                       onPress={() => openPicker('start')}
                    >
                       <Text style={{ fontSize: 15, color: time ? textPrimary : textMuted }}>{time || 'HH:MM'}</Text>
                       <Clock size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>End Time</Text>
                    <TouchableOpacity 
                       style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                       onPress={() => openPicker('end')}
                    >
                       <Text style={{ fontSize: 15, color: endTime ? textPrimary : textMuted }}>{endTime || 'HH:MM'}</Text>
                       <Clock size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Status</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                     {['upcoming', 'ongoing', 'completed', 'cancelled'].map(s => (
                        <TouchableOpacity 
                           key={s} 
                           onPress={() => setStatus(s)}
                           style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8, backgroundColor: status === s ? (isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff') : inputBg, borderColor: status === s ? '#2563eb' : inputBorder }}
                        >
                           <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'capitalize', color: status === s ? '#2563eb' : textSecondary }}>{s}</Text>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Location</Text>
                  <TextInput
                    style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: textPrimary }}
                    placeholder="e.g. University Auditorium"
                    placeholderTextColor={textMuted}
                    value={location} onChangeText={setLocation}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textPrimary, marginBottom: 6, marginLeft: 4 }}>Description</Text>
                  <TextInput
                    style={{ backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: textPrimary, minHeight: 80, textAlignVertical: 'top' }}
                    placeholder="Describe the event..."
                    placeholderTextColor={textMuted}
                    multiline
                    value={description} onChangeText={setDescription}
                  />
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>
              
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: borderLight, backgroundColor: footerBg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
                 <TouchableOpacity 
                   style={{ flex: 1, borderWidth: 1, borderColor: border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginRight: 8, backgroundColor: cardBg }}
                   onPress={() => setModalVisible(false)}
                 >
                   <Text style={{ color: textSecondary, fontWeight: '700' }}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={{ flex: 2, backgroundColor: '#0f2d5e', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
                   onPress={handleSubmit}
                   disabled={submitting}
                 >
                   {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                         <CheckCircle2 size={16} color="#fff" />
                         <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Create Event</Text>
                      </>
                   )}
                 </TouchableOpacity>
              </View>
            </View>
          </View>

          {renderPicker()}
          {Platform.OS === 'ios' && showPicker && (
             <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: modalBg, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: border, zIndex: 50 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                 <TouchableOpacity onPress={() => setShowPicker(null)} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : '#eff6ff', borderRadius: 8 }}>
                   <Text style={{ color: '#2563eb', fontWeight: '700' }}>Done</Text>
                 </TouchableOpacity>
               </View>
               <DateTimePicker
                 value={tempDate}
                 mode={showPicker === 'date' ? 'date' : 'time'}
                 display="spinner"
                 onChange={handlePickerChange}
                 style={{ height: 200 }}
               />
             </View>
          )}
        </Modal>

        {/* Action Sheet Modal */}
        <Modal transparent visible={!!actionEvent} animationType="fade" onRequestClose={() => setActionEvent(null)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setActionEvent(null)}>
            <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }} onStartShouldSetResponder={() => true}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 48, height: 6, backgroundColor: isDark ? '#475569' : '#e2e8f0', borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 16, paddingHorizontal: 8 }}>{actionEvent?.title}</Text>
              
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12 }} onPress={() => handleEdit(actionEvent)}>
                <Edit3 size={18} color="#0f2d5e" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: textPrimary }}>Edit Event</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12 }} onPress={() => { setActionEvent(null); setQrEvent(actionEvent); }}>
                <QrCode size={18} color="#0f2d5e" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: textPrimary }}>View QR</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12 }} onPress={() => { setActionEvent(null); router.push('/(officer)/attendance'); }}>
                <Users size={18} color="#0f2d5e" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: textPrimary }}>Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 12 }} onPress={() => { setActionEvent(null); router.push('/(officer)/evaluations'); }}>
                <ClipboardList size={18} color="#0f2d5e" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: textPrimary }}>Evaluations</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 8, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderRadius: 12 }} onPress={() => handleDelete(actionEvent)}>
                <Trash2 size={18} color="#dc2626" />
                <Text style={{ marginLeft: 12, fontWeight: '600', color: '#dc2626' }}>Delete Event</Text>
              </TouchableOpacity>
              
              <View style={{ height: 16 }} />
            </View>
          </Pressable>
        </Modal>

        {/* QR Code Modal */}
        <Modal transparent visible={!!qrEvent} animationType="fade" onRequestClose={() => setQrEvent(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: modalBg, width: '85%', borderRadius: 24, overflow: 'hidden', paddingBottom: 4 }} onStartShouldSetResponder={() => true}>
              <View style={{ backgroundColor: '#0f2d5e', padding: 20, alignItems: 'center' }}>
                 <QrCode size={28} color="#fff" />
                 <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8, letterSpacing: 0.5 }}>Event QR Code</Text>
                 <Text style={{ color: 'rgba(219,234,254,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>Students can scan this from their app to automatically Check-In / Check-Out</Text>
              </View>
              <View style={{ padding: 24, alignItems: 'center' }}>
                 <Text style={{ color: textPrimary, fontWeight: '800', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>{qrEvent?.title}</Text>
                 <View style={{ padding: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: border }}>
                    {qrEvent && (
                       <Image 
                          source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrEvent.qr_code)}` }} 
                          style={{ width: 200, height: 200 }} 
                       />
                    )}
                 </View>
                 <Text style={{ fontSize: 10, fontFamily: 'monospace', color: textMuted, marginTop: 16, letterSpacing: 1 }}>{qrEvent?.qr_code}</Text>
              </View>
              <TouchableOpacity style={{ borderTopWidth: 1, borderTopColor: borderLight, paddingVertical: 16, alignItems: 'center', backgroundColor: footerBg }} onPress={() => setQrEvent(null)}>
                 <Text style={{ color: isDark ? '#93c5fd' : '#0f2d5e', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Close Window</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </OfficerPageWrapper>
  );
}
