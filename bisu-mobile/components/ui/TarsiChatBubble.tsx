import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TarsiChatBubbleProps {
  message: string;
}

export default function TarsiChatBubble({ message }: TarsiChatBubbleProps) {
  const { isDark, colors } = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  // Typewriter effect & Pop in animation
  useEffect(() => {
    // Reset state
    setDisplayedText('');
    fadeAnim.setValue(0);
    slideAnim.setValue(10);

    // Run bubble pop-in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Run typewriter text
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(message.slice(0, i + 1));
      i++;
      if (i >= message.length) {
        clearInterval(interval);
      }
    }, 25); // 25ms per character

    return () => clearInterval(interval);
  }, [message]);

  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <Animated.View style={{ 
      backgroundColor: isDark ? '#1f2937' : '#ffffff', 
      padding: 8, paddingHorizontal: 12, borderRadius: 14, borderBottomLeftRadius: 4, 
      marginLeft: 145, marginRight: 20, marginBottom: 35,
      borderWidth: 1, borderColor: border,
      shadowColor: colors.shadow || '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.1, shadowRadius: 4, elevation: 2,
      zIndex: 20, alignSelf: 'flex-start', maxWidth: 180,
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    }}>
      <Text style={{ fontSize: 10, fontWeight: '900', color: '#16a34a', marginBottom: 1 }}>Tarsi</Text>
      <Text style={{ fontSize: 9, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 12, fontWeight: '500' }}>
        {displayedText}
      </Text>
    </Animated.View>
  );
}
