import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Image } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import StudentPageWrapper from '../../components/ui/StudentPageWrapper';
import TarsiChatBubble from '../../components/ui/TarsiChatBubble';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, MapPin, Clock, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
          return { month: monthStr, day: isNaN(dayInt) ? '??' : dayInt.toString() }
       }
       return { month: '???', day: '??' };
   } catch { return { month: 'ERR', day: '--' }; }
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
   } catch { return 'TBA'; }
};

export default function StudentEvents() {
  const { isDark, colors } = useTheme();
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const tabBg = isDark ? '#1e293b' : '#f1f5f9';
  const tabActiveBg = isDark ? '#334155' : '#ffffff';
  const searchBg = isDark ? '#1e293b' : '#ffffff';

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
    <StudentPageWrapper activeRoute="events">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
         <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </StudentPageWrapper>
  );

  return (
    <StudentPageWrapper activeRoute="events">
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
              <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                University Hub
              </Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: textPrimary, letterSpacing: -0.5 }} numberOfLines={1}>
                Events
              </Text>
            </View>

            {/* Quick Actions moved to the right */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <View style={{ width: 40, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderWidth: 1, borderColor: border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} color={isDark ? '#94a3b8' : '#2563eb'} />
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
                source={require('../../tarsier-mascot/tar-events-nobg.png')} 
                style={{ position: 'absolute', left: -60, bottom: -130, width: 360, height: 360 }} 
                resizeMode="contain"
              />
            </View>

            {/* Chat Bubble */}
            <TarsiChatBubble 
              message={allEvents.length > 0 
                ? `You have ${upcomingEvents.length} upcoming events! Check them out below.` 
                : "No events right now. Stay tuned for updates!"} 
            />
          </View>
        </View>

         <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{ backgroundColor: searchBg, borderColor: border, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
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

         <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ backgroundColor: tabBg, padding: 4, flexDirection: 'row', borderRadius: 8 }}>
               <TouchableOpacity 
                  onPress={() => setTab('upcoming')}
                  style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6,
                    backgroundColor: tab === 'upcoming' ? tabActiveBg : 'transparent',
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
                    backgroundColor: tab === 'past' ? tabActiveBg : 'transparent',
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
                     ? (isDark ? 'rgba(22,163,74,0.2)' : '#dcfce7') 
                     : (isCompleted ? (isDark ? 'rgba(67,56,202,0.2)' : '#e0e7ff') : (isDark ? '#334155' : '#f1f5f9'));
                   const badgeTextColor = isOngoing ? '#15803d' : (isCompleted ? (isDark ? '#a5b4fc' : '#4338ca') : (isDark ? '#94a3b8' : '#475569'));
                   
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
                      <View key={`error-${index}`} style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', padding: 16, marginBottom: 16, borderRadius: 12, borderColor: '#fecaca', borderWidth: 1 }}>
                          <Text style={{ color: '#b91c1c', fontWeight: 'bold' }}>Render Error ({index}):</Text>
                          <Text style={{ color: '#ef4444', fontSize: 11 }}>{err?.message}</Text>
                      </View>
                   )
               }
            })}
            <View style={{ height: 32 }} />
         </ScrollView>
      </View>
    </StudentPageWrapper>
  );
}
