import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    hmr: true,
    allowedHosts: [
      'dianne-bioclimatic-nonprobably.ngrok-free.dev',
      'localhost',
      '127.0.0.1'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: [],
    include: ['react', 'react-dom', 'react-router', 'react-router-dom', 'qrcode', 'qr-scanner']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      esmExternals: true
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  },
  plugins: [
    react(),
    basicSsl(), // Add SSL for development
    // PWA plugin disabled temporarily due to React module resolution issues
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'SmartSched',
    //     short_name: 'SmartSched',
    //     description: 'Smart Room Scheduling and Check-in System',
    //     theme_color: '#ffffff',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       },
    //       {
    //         src: '/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       }
    //     ]
    //   }
    // })
  ],
})
