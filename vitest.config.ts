import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
      '@providers': resolve(__dirname, 'providers'),
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    include: ['{src,shared,providers,electron}/**/*.test.ts']
  }
})
