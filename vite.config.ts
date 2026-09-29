import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project-page URL is https://<owner>.github.io/ProseCombat/, so every
// asset reference needs that path prefix baked in at build time.
export default defineConfig({
  base: '/ProseCombat/',
  resolve: {
    alias: {
      '@': resolve('src'),
      '@shared': resolve('shared'),
      '@providers': resolve('providers')
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve('index.html')
      }
    }
  },
  plugins: [react()]
})
