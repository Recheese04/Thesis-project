import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, MapPin, Clock, Search } from 'lucide-react-native';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const extractDateParts = (ev: any) => {
   try {
       let dateStr = ev?.start_time || ev?.event_date || ''; 
       if (typeof dateStr !== 'string') dateStr = String(dateStr);
       
       if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
       else if (dateStr.includes(' ')) dateStr = dateStr.split(' ')[0];
       
       const parts = dateStr.split('-');
       if(parts && parts.length >= 3) {
          const mIndex = parseInt(parts[1], 10) - 1;
          const monthStr = (mIndex >= 0 && mIndex < 12) ? MONTHS[mIndex] : '???';
          const dayInt = parseInt(parts[2], 10);
          return {
             month: monthStr,
             day: isNaN(dayInt) ? '??' : dayInt.toString()
          }
       }
       return { month: '???', day: '??' };
   } catch {
       return { month: 'ERR', day: '--' };
   }
};

const formatTime = (ev: any) => {
   try {
       if (ev?.event_time) {
           const timeStr = String(ev.event_time);
           const tParts = timeStr.split(':');
           if (tParts && tParts.length >= 2) {
               let h = parseInt(tParts[0], 10);
               if (isNaN(h)) return 'TBA';
               const m = tParts[1];
               const ampm = h >= 12 ? 'PM' : 'AM';
               h = h % 12 || 12;
               return `${h}:${m} ${ampm}`;
           }
       }
       return 'TBA';
   } catch {
       return 'TBA';
   }
};

export default function OfficerMyEvents() {
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

  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?role=student');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllEvents(data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const filteredBySearch = allEvents.filter(ev => {
     if (!ev) return false;
     const q = search.toLowerCase();
     const t = typeof ev?.title === 'string' ? ev.title.toLowerCase() : '';
     const org = typeof ev?.organization?.name === 'string' ? ev.organization.name.toLowerCase() : '';
     return t.includes(q) || org.includes(q);
  });

  const upcomingEvents = filteredBySearch.filter(ev => ev && ev.status !== 'completed' && ev.status !== 'cancelled');
  const pastEvents = filteredBySearch.filter(ev => ev && (ev.status === 'completed' || ev.status === 'cancelled'));

  const activeList = tab === 'upcoming' ? upcomingEvents : pastEvents;

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="my-events">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
         <ActivityIndicator size="large" color="#2563eb" />
      </View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="my-events">
      <View style={{ flex: 1, backgroundColor: bg }}>
         
         {/* HEADER */}
         <View style={{ backgroundColor: bg, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}>
           <Text style={{ fontSize: 22, fontWeight: '800', color: textPrimary }}>My Events</Text>
           <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>View organization events</Text>
         </View>

         {/* SEARCH CONTAINER */}
         <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{ backgroundColor: inputBg, borderColor: inputBorder, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
               <Search size={16} color={textMuted} />
               <TextInput
                 style={{ flex: 1, marginLeft: 12, fontSize: 13, color: textPrimary }}
                 placeholder="Search events..."
                 placeholderTextColor={textMuted}
                 value={search}
                 onChangeText={setSearch}
               />
            </View>
         </View>

         {/* TABS CONTAINER */}
         <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', padding: 4, flexDirection: 'row', borderRadius: 8 }}>
               <TouchableOpacity 
                  onPress={() => setTab('upcoming')}
                  style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6,
                    backgroundColor: tab === 'upcoming' ? cardBg : 'transparent',
                    shadowColor: tab === 'upcoming' ? '#000' : 'transparent', shadowOpacity: 0.05, shadowRadius: 2, elevation: tab === 'upcoming' ? 1 : 0
                  }}
               >
                  <Text style={{ fontSize: 12, fontWeight: tab === 'upcoming' ? '800' : '700', color: tab === 'upcoming' ? textPrimary : textSecondary }}>
                     Upcoming ({upcomingEvents.length})
                  </Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => setTab('past')}
                  style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6,
                    backgroundColor: tab === 'past' ? cardBg : 'transparent',
                    shadowColor: tab === 'past' ? '#000' : 'transparent', shadowOpacity: 0.05, shadowRadius: 2, elevation: tab === 'past' ? 1 : 0
                  }}
               >
                  <Text style={{ fontSize: 12, fontWeight: tab === 'past' ? '800' : '700', color: tab === 'past' ? textPrimary : textSecondary }}>
                     Past ({pastEvents.length})
                  </Text>
               </TouchableOpacity>
            </View>
         </View>

         <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} />}
            showsVerticalScrollIndicator={false}
         >
            {activeList.length === 0 ? (
               <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <EmptyState icon="📅" message={`No ${tab} events found.`} />
               </View>
            ) : activeList.map((ev, index) => {
               try {
                   const statusStr = String(ev?.status || 'unknown');
                   const isOngoing = statusStr === 'ongoing';
                   const isCompleted = statusStr === 'completed';
                   
                   const badgeBgColor = isOngoing
                     ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                     : (isCompleted ? (isDark ? 'rgba(67,56,202,0.15)' : '#e0e7ff') : (isDark ? '#334155' : '#f1f5f9'));
                   const badgeTextColor = isOngoing
                     ? (isDark ? '#86efac' : '#15803d')
                     : (isCompleted ? (isDark ? '#a5b4fc' : '#4338ca') : textSecondary);
                   
                   const dateInfo = extractDateParts(ev);
                   const timeInfo = formatTime(ev);
                   const keyId = ev?.id ? String(ev.id) : `ev-map-${index}`;
                   
                   return (
                      <View key={keyId} style={{ backgroundColor: cardBg, borderRadius: 20, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderColor: border, borderWidth: 1 }}>
                         
                         <View style={{ width: 60, height: 60, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                               {dateInfo.month}
                            </Text>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff', lineHeight: 22 }}>
                               {dateInfo.day}
                            </Text>
                         </View>
                         
                         <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 8, paddingRight: 64 }} numberOfLines={1}>
                               {String(ev?.title || 'Untitled Event')}
                            </Text>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                               <Calendar size={11} color={textMuted} />
                               <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 6 }} numberOfLines={1}>
                                  {String(ev?.organization?.name || 'Campus Organization')}
                               </Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                               <Clock size={11} color={textMuted} />
                               <Text style={{ fontSize: 11, color: textSecondary, marginLeft: 6 }}>
                                  {timeInfo}
                               </Text>
                            </View>
                         </View>

                         <View style={{ position: 'absolute', top: 16, right: 16, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: badgeBgColor }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'capitalize', color: badgeTextColor }}>
                               {statusStr}
                            </Text>
                         </View>
                      </View>
                   );
               } catch (err: any) {
                   return (
                      <View key={`error-${index}`} style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', padding: 16, marginBottom: 16, borderRadius: 12, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#fecaca', borderWidth: 1 }}>
                          <Text style={{ color: isDark ? '#fca5a5' : '#b91c1c', fontWeight: 'bold' }}>Render Error ({index}):</Text>
                          <Text style={{ color: isDark ? '#fca5a5' : '#ef4444', fontSize: 11 }}>{err?.message}</Text>
                      </View>
                   )
               }
            })}
            <View style={{ height: 32 }} />
         </ScrollView>
      </View>
    </OfficerPageWrapper>
  );
}
