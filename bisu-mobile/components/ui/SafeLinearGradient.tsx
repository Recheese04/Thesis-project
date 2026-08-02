import React from 'react';
import { View } from 'react-native';

let LinearGradientComponent: any = null;

try {
  LinearGradientComponent = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradientComponent = null;
}

export function SafeLinearGradient({ colors, style, children, ...props }: any) {
  if (LinearGradientComponent) {
    return (
      <LinearGradientComponent colors={colors} style={style} {...props}>
        {children}
      </LinearGradientComponent>
    );
  }
  const fallbackColor = Array.isArray(colors) && colors.length > 0 ? colors[0] : '#16a34a';
  return (
    <View style={[{ backgroundColor: fallbackColor }, style]} {...props}>
      {children}
    </View>
  );
}

export default SafeLinearGradient;
