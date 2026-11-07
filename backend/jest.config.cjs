/**
 * Configuração do Jest para a suíte alternativa de testes (branch dev-alt-tests).
 *
 * - Convive com o Vitest: o Vitest lê apenas `**\/*.spec.ts`; o Jest lê apenas
 *   `test-jest/**\/*.test.ts`. Uma ferramenta nunca executa os arquivos da outra.
 * - O NestJS 12 é publicado somente como ESM ("type": "module"). Como o Jest roda
 *   em CommonJS, o SWC transpila também os pacotes @nestjs/* de node_modules.
 */
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'backend',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/test-jest'],
  testMatch: ['<rootDir>/test-jest/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'json'],
  transform: {
    '^.+\\.(t|j|mj)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(@nestjs)/)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/test-jest/setup-env.ts'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: '<rootDir>/coverage-jest',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};
