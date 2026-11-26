import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /life-tracker/, so the built files need that prefix.
  // While developing on your computer it stays at the root.
  base: command === 'build' ? '/life-tracker/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    // Makes the app installable and lets it open offline. A new version waits until you tap
    // "Update" in the app, so it never reloads in the middle of something.
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Life Tracker',
        short_name: 'Life',
        description: 'Daily habits, goals and progress, stored on your device.',
        theme_color: '#0b0d12',
        background_color: '#0b0d12',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
    }),
  ],
  server: {
    // Listen on the home network too, so a phone on the same Wi-Fi can open the app.
    host: true,
    port: 5173,
  },
}));
