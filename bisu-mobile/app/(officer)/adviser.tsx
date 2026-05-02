import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { useTheme } from '../../context/ThemeContext';
import { Briefcase, Users, Calendar, CheckCircle } from 'lucide-react-native';

export default function OfficerAdviserDashboard() {
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({ members: 0, officers: 0, events: 0, clearanceRate: 0, clearedCount: 0, clearanceTotal: 0 });

  const bg = isDark ? '#0f172a' : '#f1f5f9';
  const cardBg = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const fetchAll = useCallback(async () => {
    try {
      const orgRes = await api.get('/profile/my-organizations');
      const orgs = Array.isArray(orgRes.data) ? orgRes.data : [];
      const orgId = orgs[0]?.organization_id;
      
      if (orgId) {
        const [membersRes, eventsRes, clearanceRes] = await Promise.all([
          api.get(`/organizations/${orgId}/members?status=active`),
          api.get(`/organizations/${orgId}/events`),
          api.get(`/organizations/${orgId}/clearance`, { params: { school_year: '2025-2026', semester: '2nd' } })
        ]);
        
        const members = Array.isArray(membersRes.data) ? membersRes.data : [];
        const events = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        const clearance = Array.isArray(clearanceRes.data) ? clearanceRes.data : [];
        
        const officersCount = members.filter(m => m.role === 'officer' || m.role === 'adviser').length;
        const cleared = clearance.filter(c => c.overall === 'cleared').length;
        const rate = clearance.length > 0 ? Math.round((cleared / clearance.length) * 100) : 0;
        
        setStats({ members: members.length, officers: officersCount, events: events.length, clearanceRate: rate, clearedCount: cleared, clearanceTotal: clearance.length });
      }
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="adviser">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}><ActivityIndicator size="large" color="#d97706" /></View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="adviser">
      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: '#d97706', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
             <Briefcase size={16} color="rgba(255,255,255,0.8)" />
             <Text style={{ color: '#fef3c7', fontWeight: '700', marginLeft: 8, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Adviser Overview</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>Org Health</Text>
          <Text style={{ color: '#fef3c7', fontSize: 14, marginTop: 4 }}>2025-2026, 2nd Semester Summary</Text>
        </View>
        
        <View style={{ paddingHorizontal: 16, marginTop: -24 }}>
           <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: border, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 16 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Users size={14} color="#3b82f6" />
                    <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}>Members</Text>
                 </View>
                 <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>{stats.members}</Text>
                 <Text style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>{stats.officers} officers</Text>
              </View>
              <View style={{ width: '48%', marginBottom: 16 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Calendar size={14} color="#8b5cf6" />
                    <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}>Events</Text>
                 </View>
                 <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>{stats.events}</Text>
                 <Text style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>Total events</Text>
              </View>
              <View style={{ width: '100%', marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: border }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                       <CheckCircle size={14} color="#10b981" />
                       <Text style={{ fontSize: 12, color: textSecondary, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}>Clearance</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#059669' }}>{stats.clearanceRate}%</Text>
                 </View>
                 <View style={{ width: '100%', height: 8, backgroundColor: isDark ? '#334155' : '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: '100%', backgroundColor: '#10b981', borderRadius: 4, width: `${stats.clearanceRate}%` }} />
                 </View>
                 <Text style={{ fontSize: 10, color: isDark ? '#6ee7b7' : '#059669', marginTop: 8, textAlign: 'center' }}>
                   {stats.clearedCount} out of {stats.clearanceTotal} members cleared
                 </Text>
              </View>
           </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 32 }}>
           <Text style={{ fontSize: 12, color: textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 12 }}>Notice</Text>
           <View style={{ backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : '#fffbeb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(217,119,6,0.3)' : '#fef3c7' }}>
              <Text style={{ color: isDark ? '#fbbf24' : '#92400e', fontSize: 14, lineHeight: 20 }}>
                 The Adviser dashboard gives you a quick snapshot of the organization's health. The Finance tracker is omitted per the President's scope.
              </Text>
           </View>
        </View>
      </ScrollView>
    </OfficerPageWrapper>
  );
}
