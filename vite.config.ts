import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'die_hard_images',
  test: {
    environment: 'node',
    globals: true,
  },
})
