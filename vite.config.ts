import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA plugin: solo se activa con ENABLE_PWA=true (ej: en CI/deploy con red)
// En desarrollo local y build sin red, se omite para evitar timeouts de workbox
const enablePWA = process.env.ENABLE_PWA === 'true';

const plugins = [react()];

if (enablePWA) {
  plugins.push(
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Copiloto UCO',
        short_name: 'Copiloto UCO',
        description: 'Calculadora clínica para unidad coronaria',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
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
}

export default defineConfig({
  base: '/copiloto-uco/',
  plugins,
});
