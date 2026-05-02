import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function EmptyState({ icon = '📭', message = 'No data found.' }: { icon?: string; message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40 },
  icon: { fontSize: 48, marginBottom: 12 },
  message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
