import { defineConfig } from 'vite';

export default defineConfig({
  base: '/robot-zombies/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
    open: true,
  },
});
