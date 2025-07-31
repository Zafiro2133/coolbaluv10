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
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('/admin/')) {
            return 'admin';
          }
          if (id.includes('/product/') || id.includes('ProductCard') || id.includes('ProductGrid') || id.includes('ProductDetailsModal')) {
            return 'product';
          }
          if (id.includes('Reservation')) {
            return 'reservation';
          }
          if (id.includes('Auth') || id.includes('AuthContext')) {
            return 'auth';
          }
          if (id.includes('Cart') || id.includes('useCart')) {
            return 'cart';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/functions/v1': {
        target: 'https://rwgxdtfuzpdukaguogyh.functions.supabase.co',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/functions\/v1/, ''),
      },
    },
  },
});
