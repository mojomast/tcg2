import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Changed port
    open: true, // Automatically open the app in the browser
    proxy: {
      // Proxy /api requests to your backend server
      '/api': {
        target: 'http://localhost:3000', // Your Express backend running on port 3000
        changeOrigin: true, // Recommended for virtual hosted sites
        // secure: false, // If your backend is http and vite is https (not the case here)
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if backend routes don't include /api
      },
      '/socket.io': { // For Socket.IO, now on the same port as HTTP
        target: 'ws://localhost:3000',
        ws: true, // IMPORTANT for WebSocket proxying
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist_frontend', // To avoid conflict with backend 'dist'
  }
});
