import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The engine under test is deliberately plain TypeScript with no Vue or browser
// dependencies, so it needs no Nuxt environment — just node.
export default defineConfig({
  resolve: {
    // Nuxt resolves `~` to the app directory; vitest has to be told, or nothing
    // that lives beside app code can be tested at all.
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.spec.ts', 'server/**/*.spec.ts'],
  },
})
