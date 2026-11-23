import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on the home network too, so a phone on the same Wi-Fi can open the app.
    host: true,
    port: 5173,
  },
});
