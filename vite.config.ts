import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // An installable app that works offline: after the first load, every page,
    // character, picture and recording comes from the precache, and nothing
    // leaves the device.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'Hanzi Garden',
        short_name: 'Hanzi Garden',
        description: 'Mandarin Chinese for children aged 5–10: character roots, picture cards, speaking and pinyin.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fdf6e3',
        theme_color: '#f59f00',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,mp3,txt,TXT}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
