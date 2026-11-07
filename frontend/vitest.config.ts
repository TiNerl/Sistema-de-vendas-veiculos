import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // test-jest/** pertence à suíte Jest; cypress/** aos testes E2E do Cypress.
      exclude: [...configDefaults.exclude, 'e2e/**', 'test-jest/**', 'cypress/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
