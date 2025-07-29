import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/functions/v1': {
        target: 'https://<rwgxdtfuzpdukaguogyh>.functions.supabase.co',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/functions\/v1/, ''),
      },
    },
  },
});
