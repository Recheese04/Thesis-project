import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import { MessageSquare, Users } from 'lucide-react-native';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';

export default function OfficerMessages() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async () => {
    try {
      // For MVP, we'll fetch group chats as channels
      const res = await api.get('/group-chats');
      setChannels(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  if (loading && !refreshing) return (
    <OfficerPageWrapper activeRoute="messages">
      <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563eb" /></View>
    </OfficerPageWrapper>
  );

  return (
    <OfficerPageWrapper activeRoute="messages">
      <View className="bg-white px-5 pt-5 pb-4 border-b border-slate-100 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">Messages</Text>
          <Text className="text-slate-500 text-sm mt-1">Communicate with members</Text>
        </View>
        <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
          <MessageSquare size={22} color="#2563eb" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Group Chats</Text>
          {channels.length === 0 ? (
            <EmptyState icon="💬" message="No active group chats." />
          ) : (
            channels.map(ch => (
              <TouchableOpacity key={ch.id} activeOpacity={0.7}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 flex-row items-center"
              >
                <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-3">
                   <Users size={20} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-extrabold text-slate-800" numberOfLines={1}>{ch.name}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>Chat room with {ch.members?.length || 0} members</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        <View className="h-10" />
      </ScrollView>
    </OfficerPageWrapper>
  );
}
