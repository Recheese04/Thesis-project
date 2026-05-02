import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    card: string;
    navBar: string;
    navBarBorder: string;
    inputBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    border: string;
    shadow: string;
    overlay: string;
    iconDefault: string;
    statusBarStyle: 'light-content' | 'dark-content';
  };
}

const lightColors = {
  background: '#f0f4ff',
  surface: '#ffffff',
  card: '#f8fafc',
  navBar: '#ffffff',
  navBarBorder: '#e8eeff',
  inputBg: '#f0f4ff',
  textPrimary: '#1e1b4b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#4f46e5',
  accentSoft: '#f0f4ff',
  border: '#e2e8f0',
  shadow: '#4f46e5',
  overlay: 'transparent',
  iconDefault: '#3730a3',
  statusBarStyle: 'dark-content' as const,
};

const darkColors = {
  background: '#0f172a',
  surface: '#1e293b',
  card: '#1e293b',
  navBar: '#1e293b',
  navBarBorder: '#334155',
  inputBg: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#818cf8',
  accentSoft: '#1e1b4b',
  border: '#334155',
  shadow: '#000000',
  overlay: 'rgba(15, 23, 42, 0.5)',
  iconDefault: '#a5b4fc',
  statusBarStyle: 'light-content' as const,
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('theme_dark').then(val => {
      if (val === 'true') setIsDark(true);
    }).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    SecureStore.setItemAsync('theme_dark', next ? 'true' : 'false').catch(() => {});
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
