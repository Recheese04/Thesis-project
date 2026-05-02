import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.accent} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  accent: { width: 4, height: 20, backgroundColor: Colors.accent, borderRadius: 2, marginRight: 10 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
});
