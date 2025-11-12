import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/products': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
      '/order': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
      '/config': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
