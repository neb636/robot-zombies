import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
  plugins: [
    VitePWA({
      // Auto-update: new SW activates immediately and reloads the page.
      // Save data is in localStorage so progress is preserved across reloads.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Pre-cache the app shell (JS bundles, CSS, HTML, JSON data, WASM).
        // Images and audio are large and handled via runtime caching below.
        globPatterns: ['**/*.{js,css,html,json,wasm}'],
        navigateFallback: '/robot-zombies/index.html',
        // Don't intercept requests for files with extensions (assets, audio, etc.)
        navigateFallbackDenylist: [/\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            // Network-first for JS/CSS — always serve the latest code when online,
            // fall back to cache when offline (5s timeout before using cache).
            urlPattern: /\.(?:js|css)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'code-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache-first for sprites, maps, and UI images — large files that
            // rarely change; serve from cache instantly, background-update on hit.
            urlPattern: /\/robot-zombies\/assets\/.*\.(?:png|jpg|gif|webp|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sprites-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Stale-while-revalidate for audio — serve cached version immediately,
            // fetch update in the background so next load gets the latest.
            urlPattern: /\/robot-zombies\/assets\/.*\.(?:mp3|ogg|wav|webm)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Silicon Requiem',
        short_name: 'Silicon Requiem',
        description: 'A browser-based SNES-style JRPG. Fight for the right to be inefficient.',
        theme_color: '#0a0a1e',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape',
        scope: '/robot-zombies/',
        start_url: '/robot-zombies/',
        icons: [],
      },
    }),
  ],
});
