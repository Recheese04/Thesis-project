import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  student_number?: string;
  user_type?: string;
  profile_picture?: string;
  college?: { name: string };
  course?: { name: string };
  year_level?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  membership: any | null;
  officerDesignations: any[];
  isLoading: boolean;
  isOfficer: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
  switchOrg: (orgId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Exported so the api.ts 401 interceptor can call it
export let globalLogout: (() => Promise<void>) | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [membership, setMembership] = useState<any | null>(null);
  const [officerDesignations, setOfficerDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = async () => {
    // 1. Clear local state immediately for instant UI response
    setToken(null);
    setUser(null);
    setRole(null);
    setMembership(null);
    setOfficerDesignations([]);

    // 2. Clear persistence
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    await SecureStore.deleteItemAsync('auth_role');
    await SecureStore.deleteItemAsync('auth_membership');
    await SecureStore.deleteItemAsync('auth_officer_designations');

    // 3. Inform server (optional, don't wait for it)
    api.post('/logout').catch(() => {});
  };

  // Register the global logout so the api interceptor can call it
  useEffect(() => {
    globalLogout = clearAuth;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedUser = await SecureStore.getItemAsync('auth_user');
        const storedRole = await SecureStore.getItemAsync('auth_role');
        const storedMembership = await SecureStore.getItemAsync('auth_membership');
        const storedOfficerDesignations = await SecureStore.getItemAsync('auth_officer_designations');

        if (storedToken && storedUser) {
          // Validate token is still valid with the backend
          try {
            const meRes = await api.get('/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            // Token valid — use fresh data from /me
            const { user: freshUser, role: freshRole, membership: freshMembership, officer_designations } = meRes.data;
            await SecureStore.setItemAsync('auth_user', JSON.stringify(freshUser));
            await SecureStore.setItemAsync('auth_role', freshRole || 'student');
            if (freshMembership) await SecureStore.setItemAsync('auth_membership', JSON.stringify(freshMembership));
            if (officer_designations) await SecureStore.setItemAsync('auth_officer_designations', JSON.stringify(officer_designations));

            setToken(storedToken);
            setUser(freshUser);
            setRole(freshRole || 'student');
            setMembership(freshMembership || null);
            setOfficerDesignations(officer_designations || []);
          } catch (err: any) {
            if (err.response?.status === 401) {
              // Interceptor handles the actual logout, we just log and finish
              console.warn('[AuthContext] Session invalid. Redirecting to login.');
            } else {
              // Network error — still allow offline use with cached data
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
              setRole(storedRole || 'student');
              if (storedMembership) setMembership(JSON.parse(storedMembership));
              if (storedOfficerDesignations) setOfficerDesignations(JSON.parse(storedOfficerDesignations));
            }
          }
        }
      } catch (_) {}
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/login', { email, password });
    const { token: t, user: u, role: r, membership: m, officer_designations } = res.data;

    await SecureStore.setItemAsync('auth_token', t);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(u));
    await SecureStore.setItemAsync('auth_role', r || 'student');
    if (m) await SecureStore.setItemAsync('auth_membership', JSON.stringify(m));
    if (officer_designations) await SecureStore.setItemAsync('auth_officer_designations', JSON.stringify(officer_designations));

    setToken(t);
    setUser(u);
    setRole(r || 'student');
    setMembership(m || null);
    setOfficerDesignations(officer_designations || []);
  };

  const logout = clearAuth;

  const updateUser = async (partial: Partial<User>) => {
    const updated = { ...user, ...partial } as User;
    setUser(updated);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(updated));
  };

  const isOfficer = role === 'officer';

  const switchOrg = async (orgId: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Set the header temporarily for the /me request
      const meRes = await api.get('/me', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Organization-Id': orgId.toString()
        },
      });
      const { membership: freshMembership } = meRes.data;
      if (freshMembership) {
        await SecureStore.setItemAsync('auth_membership', JSON.stringify(freshMembership));
        setMembership(freshMembership);
      }
    } catch (err) {
      console.error("Failed to switch org", err);
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, role, membership, officerDesignations, isLoading, isOfficer, login, logout, updateUser, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
