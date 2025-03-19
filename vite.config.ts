import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    hmr: {
      protocol: 'wss',
      clientPort: 443,
      path: 'hmr/',
      timeout: 5000,
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  css: {
    devSourcemap: true
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    port: 5173
  },
  build: {
    sourcemap: true
  }
});