/**
 * Jest (suíte alternativa – branch dev-alt-tests) para o frontend Vue 3.
 * Convive com o Vitest: o Vitest ignora `test-jest/**` (ver vitest.config.ts)
 * e o Jest só lê `test-jest/**\/*.test.ts`.
 */
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  roots: ['<rootDir>/test-jest'],
  testMatch: ['<rootDir>/test-jest/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  transform: {
    // SFC: @vue/compiler-sfc + SWC (ver test-jest/support/transform-vue.cjs).
    '^.+\\.vue$': '<rootDir>/test-jest/support/transform-vue.cjs',
    '^.+\\.(t|j|mj)s$': '<rootDir>/test-jest/support/transform-ts.cjs',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css)$': '<rootDir>/test-jest/support/estilo-vazio.cjs',
  },
  // Pinia 4, Vue Router 5 e várias dependências deles são publicados apenas como ESM.
  // Transpilar também node_modules é o modo mais robusto (o cache do Jest evita custo repetido).
  transformIgnorePatterns: [],
  setupFiles: ['<rootDir>/test-jest/support/setup.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,vue}', '!src/main.ts', '!src/**/__tests__/**', '!src/**/*.d.ts'],
  coverageDirectory: '<rootDir>/coverage-jest',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
};
