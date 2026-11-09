import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const base = '/Trivium/'

function spaFallback404() {
  let outDir
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    }
  }
}

export default defineConfig({
  base,
  server: { port: 5173, host: true },
  plugins: [
    react(),
    spaFallback404(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: base,
        name: 'Trivium - Plataforma de Estudo',
        short_name: 'Trivium',
        description: 'Cadernos, atividades e curadoria de videoaulas com gamificação.',
        theme_color: '#3B5FE0',
        background_color: '#0F1222',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        globIgnores: ['**/node_modules/**/*', '404.html'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'trivium-supabase-data', networkTimeoutSeconds: 4, expiration: { maxEntries: 100, maxAgeSeconds: 86400 } }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ]
})
