// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: [
            'unscriptural-loculicidally-yahaira.ngrok-free.dev',
            '.ngrok-free.dev',
            '.ngrok.io',
            '.ngrok-free.app',
        ],
        proxy: {
            // Proxy both /api and /sanctum to Laravel
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/sanctum': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});