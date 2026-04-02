import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios'; // 1. Import axios
import App from './App';
import './index.css';

// 2. Configure Axios Defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';
axios.defaults.withCredentials = true; // Required for Sanctum session cookies

// 3. Add global interceptor for 401 Unauthorized errors (expired tokens)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all auth data if token is expired or invalid
      localStorage.clear();
      // Only redirect if not already on the login page to prevent infinite loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);