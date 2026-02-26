import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// For GitHub Pages: set base to your repo name, e.g. base: '/constructflow/'
// Or set env: VITE_BASE_PATH=/your-repo-name/ when building
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  logLevel: 'error', // Suppress warnings, only show errors
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  resolve: {
    alias: {
      'pdfjs-dist/build/pdf.mjs': 'pdfjs-dist',
      'pdfjs-dist/legacy/build/pdf.mjs': 'pdfjs-dist',
    },
  },
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