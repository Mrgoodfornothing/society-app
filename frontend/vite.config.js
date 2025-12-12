import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // This "devOptions" section is what you were missing!
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Society Connect',
        short_name: 'SocietyApp',
        description: 'Manage your society bills and maintenance',
        theme_color: '#4F46E5',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png', // Note the slash at the start
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  /*server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})*/

// inside defineConfig...
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001', // <--- CHANGE THIS TO 5001
      changeOrigin: true,
      secure: false,
    },
  },
}
})