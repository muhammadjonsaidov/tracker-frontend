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
    allowedHosts: ['hyperconfident-carter-sweptback.ngrok-free.dev'],
    hmr: {
      host: 'hyperconfident-carter-sweptback.ngrok-free.dev',
      protocol: 'wss',
      clientPort: 443,
      path: '/frontend/@vite',
    },
  },
}));
