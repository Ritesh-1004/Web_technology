import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration — plain React, no extra plugins needed
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
