import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string | React.ReactNode;
  colorClass?: string; 
  iconBgClass?: string;
}

export default function StatCard({ label, value, icon, colorClass = "text-blue-600", iconBgClass = "bg-blue-50" }: StatCardProps) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 m-1 shadow-sm border border-slate-100 items-start justify-between">
      <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${iconBgClass}`}>
        {typeof icon === 'string' ? <Text className="text-xl">{icon}</Text> : icon}
      </View>
      <View>
        <Text className={`text-2xl font-extrabold mb-0.5 ${colorClass}`}>{value}</Text>
        <Text className="text-xs font-medium text-slate-500">{label}</Text>
      </View>
    </View>
  );
}
