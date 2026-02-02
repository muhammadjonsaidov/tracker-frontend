import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => ({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: '/frontend/',
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    allowedHosts: ['living-likely-monster.ngrok-free.app'],
    hmr: {
      host: 'living-likely-monster.ngrok-free.app',
      protocol: 'wss',
      clientPort: 443,
      path: '/frontend/@vite',
    },
  },
}));
