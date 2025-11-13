import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@game': path.resolve(__dirname, '../game'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true
      },
      '/api': {
        target: 'http://localhost:4000'
      }
    }
  }
})
