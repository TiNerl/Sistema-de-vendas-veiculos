/**
 * E2E – RNF005: acesso por perfil, inclusive digitando a URL diretamente.
 * (No frontend é uma camada de usabilidade; a garantia efetiva é o 403 da API,
 *  verificado nos testes de API do backend.)
 */
describe('Controle de acesso por URL direta', () => {
  it('visitante é enviado ao login com ?redirect e volta à página após autenticar', () => {
    cy.visit('/admin/clientes')
    cy.location('pathname').should('eq', '/')
    cy.location('search').should('contain', 'redirect=%2Fadmin%2Fclientes')

    cy.intercept('POST', `${Cypress.expose('apiUrl')}/auth/login`, { statusCode: 201, body: { accessToken: 'jwt' } })
    cy.intercept('GET', `${Cypress.expose('apiUrl')}/auth/perfil`, {
      body: { id: 1, cpf: '11144477735', perfil: 'admin', nome: 'Admin Teste' },
    })
    cy.intercept('GET', `${Cypress.expose('apiUrl')}/clientes*`, { fixture: 'clientes.json' })
    cy.get('#login-cpf').type('11144477735')
    cy.get('#login-senha').type('segredo1{enter}')
    cy.location('pathname').should('eq', '/admin/clientes')
  })

  const rotasAdmin = ['/admin/usuarios', '/admin/usuarios/cadastrar', '/admin/usuarios/inativar', '/admin/veiculos', '/dashboard']
  rotasAdmin.forEach((rota) => {
    it(`vendedor que digita ${rota} é redirecionado à própria área`, () => {
      cy.entrarComo('vendedor', rota)
      cy.location('pathname').should('eq', '/vendedor')
    })
  })

  it('administrador que digita /vendedor/vendas vai para o seu painel', () => {
    cy.entrarComo('admin', '/vendedor/vendas')
    cy.location('pathname').should('eq', '/dashboard')
  })

  it('sessão expirada (GET /auth/perfil → 401) encerra a sessão e volta ao login', () => {
    cy.intercept('GET', `${Cypress.expose('apiUrl')}/auth/perfil`, { statusCode: 401, body: { statusCode: 401 } })
    cy.visit('/dashboard', { onBeforeLoad: (win) => win.sessionStorage.setItem('accessToken', 'expirado') })
    cy.location('pathname').should('eq', '/')
    cy.window().its('sessionStorage').invoke('getItem', 'accessToken').should('be.null')
  })
})

export {}
