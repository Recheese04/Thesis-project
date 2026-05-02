import React from 'react';
import { View, Text } from 'react-native';

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  officer: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  member: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  default: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function Badge({ label, type = 'default' }: { label: string; type?: string }) {
  const style = typeStyles[type.toLowerCase()] ?? typeStyles.default;
  return (
    <View className={`px-2.5 py-0.5 rounded-full border self-start ${style.bg} ${style.border}`}>
      <Text className={`text-[11px] font-bold capitalize ${style.text}`}>{label}</Text>
    </View>
  );
}
