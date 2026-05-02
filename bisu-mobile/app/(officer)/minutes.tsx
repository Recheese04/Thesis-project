import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import OfficerPageWrapper from '../../components/ui/OfficerPageWrapper';
import { FileText, Calendar, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react-native';
import Badge from '../../components/ui/Badge';

export default function OfficerMinutes() {
  const [minutes, setMinutes] = useState([
    {
      id: 1,
      title: 'General Assembly Meeting',
      date: '2026-02-15',
      time: '2:00 PM',
      attendees: 24,
      status: 'approved',
      summary: 'Discussed upcoming events for the second semester. Approved budget allocation for the Sportsfest.',
    },
    {
      id: 2,
      title: 'Officers Meeting',
      date: '2026-02-28',
      time: '4:00 PM',
      attendees: 8,
      status: 'draft',
      summary: 'Planned clearance requirements and membership dues collection schedule.',
    },
  ]);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <OfficerPageWrapper activeRoute="minutes">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-white px-5 pt-5 pb-4">
          <Text className="text-2xl font-extrabold text-slate-900">Meeting Minutes 📝</Text>
          <Text className="text-slate-500 text-sm mt-1">Record and manage meeting records</Text>
          
          <View className="flex-row items-center mt-4">
            <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1 mr-2 items-center">
               <Text className="text-lg font-bold text-slate-900">{minutes.length}</Text>
               <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total</Text>
            </View>
            <View className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex-1 mr-2 items-center">
               <Text className="text-lg font-bold text-emerald-600">{minutes.filter(m => m.status === 'approved').length}</Text>
               <Text className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Approved</Text>
            </View>
            <View className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex-1 items-center">
               <Text className="text-lg font-bold text-amber-600">{minutes.filter(m => m.status === 'draft').length}</Text>
               <Text className="text-[10px] text-amber-500 font-bold uppercase mt-1">Drafts</Text>
            </View>
          </View>
        </View>

        <View className="px-4 py-4">
          {minutes.map(m => (
            <TouchableOpacity 
              key={m.id} 
              activeOpacity={0.8}
              onPress={() => setExpandedId(expandedId === m.id ? null : m.id)}
              className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="text-[15px] font-extrabold text-slate-900">{m.title}</Text>
                  <View className="flex-row items-center mt-2 flex-wrap" style={{ gap: 8 }}>
                    <View className="flex-row items-center">
                      <Calendar size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500 ml-1">{m.date}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500 ml-1">{m.time}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Users size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-500 ml-1">{m.attendees}</Text>
                    </View>
                  </View>
                </View>
                <Badge label={m.status} type={m.status === 'approved' ? 'active' : 'pending'} />
              </View>
              
              {expandedId === m.id && !!m.summary && (
                <View className="mt-4 pt-3 border-t border-slate-100 pb-1">
                   <Text className="text-sm text-slate-700 leading-relaxed">{m.summary}</Text>
                </View>
              )}
              
              <View className="absolute bottom-3 right-4">
                 {expandedId === m.id ? <ChevronUp size={16} color="#cbd5e1" /> : <ChevronDown size={16} color="#cbd5e1" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-6" />
      </ScrollView>
    </OfficerPageWrapper>
  );
}
