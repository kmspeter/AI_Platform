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
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://kau-capstone.duckdns.org/',
        changeOrigin: true,
        // 필요하면:
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
