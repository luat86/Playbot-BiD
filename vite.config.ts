import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cấu hình chuẩn cho GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/Playbot-BiD/',
})
