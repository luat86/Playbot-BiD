import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Playbot-BiD/', // Phải có dấu / ở đầu và cuối tên Repository của bạn
})
