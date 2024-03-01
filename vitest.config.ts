import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    // environment: 'happy-dom',
    typecheck: {
      enabled: true,
      tsconfig: './test/tsconfig.json',
    },
  },
})
