import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Playbot-BiD/', // Phải chính xác là tên repository của bạn trên GitHub
})
