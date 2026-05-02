import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Config';
import { globalLogout } from '../context/AuthContext';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Add the scoped organization context
  const membershipStr = await SecureStore.getItemAsync('auth_membership');
  if (membershipStr) {
    try {
      const membership = JSON.parse(membershipStr);
      // Only set it if it hasn't been manually overridden for this specific request
      if (membership?.organization_id && !config.headers['X-Organization-Id']) {
        config.headers['X-Organization-Id'] = membership.organization_id.toString();
      }
    } catch (e) {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Prevent infinite loop if /logout itself returns 401
      if (error.config?.url?.includes('/logout')) {
        return Promise.reject(error);
      }

      console.error("[API] 401 Unauthorized - Token may be expired or revoked. Logging out...");
      if (globalLogout) {
        await globalLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
