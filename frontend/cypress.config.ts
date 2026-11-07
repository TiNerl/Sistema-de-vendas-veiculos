import { defineConfig } from 'cypress'

/**
 * Cypress – testes End-to-End do frontend (suíte alternativa, branch dev-alt-tests).
 *
 * Modo padrão ("stub"): o backend é simulado com cy.intercept; basta o Vite rodando
 * em http://localhost:5173 com VITE_API_URL=http://localhost:3000 (valor do .env.example).
 * Modo integração: `--expose REAL_API=true` executa também cypress/e2e/integracao-real.cy.ts
 * contra a API real (exige docker compose up e usuários de teste — ver README).
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 6000,
    retries: { runMode: 1, openMode: 0 },
    // Cypress 16: valores públicos ficam em `expose` (lidos com Cypress.expose());
    // segredos (CPF/senha reais) chegam por variáveis CYPRESS_* e são lidos com cy.env().
    expose: {
      apiUrl: 'http://localhost:3000',
      REAL_API: false,
    },
  },
})
