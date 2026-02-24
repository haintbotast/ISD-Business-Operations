import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',    // Required for Docker — listen on all interfaces
    // usePolling is required on Docker Desktop (Windows/Mac) where inotify events
    // are not propagated from the host filesystem to the container.
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      // BACKEND_URL allows Docker to override to http://backend:3001
      // Local dev: http://localhost:3001 (default)
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
});
