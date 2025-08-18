import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Add this new rule for socket.io
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true, // This enables websocket proxying
      },
    },
  },
});