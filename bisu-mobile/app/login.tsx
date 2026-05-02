import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1e1b4b' }}>
      {/* Wavy Background Elements */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
        <LinearGradient colors={['#1e1b4b', '#3730a3', '#4f46e5']} style={{ flex: 1 }} />
        <View style={{ position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.4)' }} />
        <View style={{ position: 'absolute', top: 150, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(55, 48, 163, 0.5)' }} />
        <View style={{ position: 'absolute', bottom: -150, left: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(79, 70, 229, 0.3)' }} />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">

            {/* Mobile logo header (matching web's mobile view) */}
            <View className="items-center mb-8">
              <View className="mb-3 rounded-full border-2 border-white shadow-xl bg-white overflow-hidden">
                <Image source={require('../assets/images/bisu-logo.png')} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
              </View>
              <View className="items-center">
                <Text className="font-extrabold text-white text-3xl tracking-tight mb-1">
                  <Text className="text-yellow-400">TAP</Text>asok
                </Text>
                <Text className="text-blue-200 font-semibold text-xs tracking-widest uppercase">BISU Candijay</Text>
              </View>
            </View>

            {/* Form Card */}
            <View className="w-full bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 sm:p-8">

              <View className="mb-6 items-center">
                <Text className="font-extrabold text-[#0f172a] text-2xl mb-1">Welcome back 👋</Text>
                <Text className="text-slate-500 text-sm">Sign in to your account to continue</Text>
              </View>

              {/* Email Field */}
              <View className="mb-4 text-left">
                <Text className="font-bold text-sm text-slate-700 mb-2">Email Address</Text>
                <View className="relative justify-center">
                  <View className="absolute left-3 z-10">
                    <Mail size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-slate-900 text-[15px]"
                    placeholder="you@bisu.edu.ph"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View className="mb-6 text-left">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-bold text-sm text-slate-700">Password</Text>
                  <TouchableOpacity onPress={() => { }}>
                    <Text className="text-blue-600 font-bold text-xs">Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View className="relative justify-center">
                  <View className="absolute left-3 z-10">
                    <Lock size={18} color="#94a3b8" />
                  </View>
                  <TextInput
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 text-slate-900 text-[15px]"
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    className="absolute right-3 py-2 px-1 z-10"
                    onPress={() => setShowPassword(p => !p)}
                  >
                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={`w-full h-12 rounded-xl flex-row items-center justify-center shadow-lg ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="white" size="small" className="mr-2" />
                    <Text className="text-white font-bold text-[15px]">Signing in...</Text>
                  </>
                ) : (
                  <Text className="text-white font-bold text-[15px]">Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Register */}
              <View className="mt-6 flex-row justify-center">
                <Text className="text-slate-400 text-[13px]">Don't have an account? </Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text className="text-blue-600 font-bold text-[13px]">Request Access</Text>
                </TouchableOpacity>
              </View>

              {/* View Welcome Screen Button (For Testing/Dev) */}
              <View className="mt-4 flex-row justify-center">
                <TouchableOpacity onPress={() => router.replace('/')} className="bg-slate-100 px-4 py-2 rounded-lg">
                  <Text className="text-slate-600 font-bold text-[12px]">View New Welcome Screen</Text>
                </TouchableOpacity>
              </View>

              {/* Security note */}
              <View className="flex-row items-center justify-center mt-6">
                <ShieldCheck size={14} color="#e2e8f0" className="mr-1.5" />
                <Text className="text-white text-[11px] opacity-80">Secured with end-to-end encryption</Text>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
