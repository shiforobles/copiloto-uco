import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Los módulos virtuales están disponibles en desarrollo; el service worker solo
// se genera cuando ENABLE_PWA=true (CI o comprobación de producción).
const enablePWA = process.env.ENABLE_PWA === 'true';

const plugins = [react()];

plugins.push(
  VitePWA({
    disable: !enablePWA,
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: 'Copiloto UCO',
      short_name: 'Copiloto UCO',
      description: 'Referencia clínica y cálculos para UCO de adultos',
      lang: 'es-AR',
      theme_color: '#0b1220',
      background_color: '#0b1220',
      display: 'standalone',
      scope: '/copiloto-uco/',
      start_url: '/copiloto-uco/',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [],
    },
  })
);

export default defineConfig({
  base: '/copiloto-uco/',
  plugins,
});
