import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useColorScheme } from 'react-native';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const textColor = scheme === 'dark' ? '#f1f5f9' : '#0f172a';
  const arrowColor = scheme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <Text style={{ color: arrowColor, fontSize: 14, marginRight: 4 }}>
          {isOpen ? '▾' : '▸'}
        </Text>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
