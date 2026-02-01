import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      allowedHosts: ['34059ca55fb1.ngrok-free.app'],
      hmr: {
        host: '34059ca55fb1.ngrok-free.app',
        protocol: 'wss',
        clientPort: 443,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [react()],
  };
});