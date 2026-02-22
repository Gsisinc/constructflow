import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  server: {
    proxy: {
      // Forward /api to Base44 backend so auth and public-settings work locally
      '/api': {
        target: process.env.VITE_BASE44_APP_BASE_URL || 'https://app.base44.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      // Disabled to avoid base44 plugin messing with app routing/UI
      hmrNotifier: false,
      navigationNotifier: false,
      visualEditAgent: false,
    }),
    react(),
  ]
});