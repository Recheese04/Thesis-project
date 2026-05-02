import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

function RootNavigator() {
  const { user, token, isLoading, isOfficer } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments.length === 0 || segments[0] === 'index';

    if (!token || !user) {
      if (!inAuthGroup) router.replace('/login');
    } else if (isOfficer) {
      if (segments[0] !== '(officer)') router.replace('/(officer)');
    } else {
      if (segments[0] !== '(student)') router.replace('/(student)');
    }
  }, [isLoading, token, user]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(officer)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
