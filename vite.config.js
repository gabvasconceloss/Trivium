import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
        'robots.txt'
      ],
      manifest: {
        id: '/',
        name: 'Trivium - Plataforma de Estudo',
        short_name: 'Trivium',
        description:
          'Organize seus cadernos, tópicos e videoaulas em um único lugar, com curadoria automática de conteúdo.',
        theme_color: '#3B5FE0',
        background_color: '#F7F7FB',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Cache do "app shell" de dados do Supabase (somente GET) para uso offline básico
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/rest/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'trivium-supabase-data',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 dia
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.hostname === 'i.ytimg.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'trivium-youtube-thumbs',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
})
