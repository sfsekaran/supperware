import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    allowedHosts: ['supperware.sathyasekaran.com'],
    proxy: {
      '/api/v1/auth':       'http://localhost:3000',
      '/api/v1/recipes':    'http://localhost:3000',
      '/api/v1/parse_jobs': 'http://localhost:3000',
      '/api/v1/public':     'http://localhost:3000',
      '/api/v1/settings':   'http://localhost:3000',
      '/api/v1/admin':      'http://localhost:3000',
    },
  },
})
