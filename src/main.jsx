import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios'; // 1. Import axios
import App from './App';
import './index.css';

// 2. Configure Axios Defaults
axios.defaults.baseURL = '';
axios.defaults.withCredentials = true; // Required for Sanctum session cookies

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);