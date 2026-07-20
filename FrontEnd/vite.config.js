import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://46634000000013049.catalystapps.com/baas/v1/project/46634000000013049/function/api_service',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
