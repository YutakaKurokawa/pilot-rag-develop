import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
