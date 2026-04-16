import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // During local development, proxy /api calls to the backend
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
