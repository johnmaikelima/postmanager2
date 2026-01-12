import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // Otimizações para build mais rápido
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    },
    // Reduzir uso de memória
    chunkSizeWarningLimit: 1000,
    // Sourcemaps desabilitados em produção
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3006',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3006',
        changeOrigin: true
      },
      '/logos': {
        target: 'http://localhost:3006',
        changeOrigin: true
      }
    }
  }
});
