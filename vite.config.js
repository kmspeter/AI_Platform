import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // 브라우저 → Vite(HTTPS 아님) → EC2:3001 로 프록시
      '/api': {
        target: 'http://13.125.63.0:3001',
        changeOrigin: true,
        // /api/upload → /upload 로 리라이트
        rewrite: (path) => path.replace(/^\/api/, ''),
        // 만약 target이 HTTPS & 자체서명 인증서면 필요
        secure: false,
      },
    },
  },
});
