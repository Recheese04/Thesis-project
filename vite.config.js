// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // 1. Import path

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // 2. Define the '@' alias to point to the 'src' directory
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});