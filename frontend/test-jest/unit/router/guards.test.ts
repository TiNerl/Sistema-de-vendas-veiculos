/**
 * RNF005 no frontend — guards de navegação do Vue Router (camada de usabilidade;
 * a proteção efetiva está no backend). Cobre também UC01-FA1/FA2 e UC18.
 *
 * Cada teste recarrega os módulos (`jest.resetModules`) para obter um router e uma
 * store novos, já que `@/router` exporta uma instância única.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import type { Router } from 'vue-router'

jest.mock('@/services/auth.service', () => ({ login: jest.fn(), obterPerfil: jest.fn() }))

type Perfil = 'admin' | 'vendedor'

async function prepararNavegacao(opcoes: { token?: string; perfil?: Perfil; perfilFalha?: boolean }) {
  jest.resetModules()
  sessionStorage.clear()
  if (opcoes.token) sessionStorage.setItem('accessToken', opcoes.token)

  const { createPinia, setActivePinia } = require('pinia')
  setActivePinia(createPinia())
  const authService = require('@/services/auth.service')
  if (opcoes.perfilFalha) authService.obterPerfil.mockRejectedValue(new Error('401'))
  else if (opcoes.perfil) {
    authService.obterPerfil.mockResolvedValue({ id: 1, cpf: '11144477735', perfil: opcoes.perfil })
  }

  const router: Router = require('@/router').default
  const { useAuthStore } = require('@/stores/auth')
  return { router, auth: useAuthStore(), authService }
}

async function ir(router: Router, caminho: string) {
  await router.push(caminho)
  return router.currentRoute.value
}

describe('guards de rota', () => {
  beforeEach(() => jest.clearAllMocks())

  it('visitante em rota protegida vai ao login preservando o destino em ?redirect', async () => {
    const { router } = await prepararNavegacao({})
    const rota = await ir(router, '/admin/clientes')
    expect(rota.name).toBe('login')
    expect(rota.query.redirect).toBe('/admin/clientes')
  })

  it('visitante acessa a tela de login normalmente', async () => {
    const { router } = await prepararNavegacao({})
    expect((await ir(router, '/')).name).toBe('login')
  })

  it('token existente sem perfil carregado: busca /auth/perfil antes de decidir', async () => {
    const { router, authService } = await prepararNavegacao({ token: 't', perfil: 'admin' })
    expect((await ir(router, '/admin/usuarios')).name).toBe('lista-usuarios')
    expect(authService.obterPerfil).toHaveBeenCalledTimes(1)
  })

  it('token expirado/inválido: encerra a sessão e manda ao login (UC01-FA2)', async () => {
    const { router, auth } = await prepararNavegacao({ token: 'expirado', perfilFalha: true })
    expect((await ir(router, '/dashboard')).name).toBe('login')
    expect(auth.token).toBeNull()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })

  it.each([
    ['vendedor', '/admin/usuarios/cadastrar', 'vendedor-inicio'],
    ['vendedor', '/admin/veiculos', 'vendedor-inicio'],
    ['vendedor', '/dashboard', 'vendedor-inicio'],
    ['admin', '/vendedor', 'dashboard'],
    ['admin', '/vendedor/vendas', 'dashboard'],
  ] as const)('%s em %s é redirecionado para %s', async (perfil, caminho, destino) => {
    const { router } = await prepararNavegacao({ token: 't', perfil })
    expect((await ir(router, caminho)).name).toBe(destino)
  })

  it.each([
    ['admin', '/admin/veiculos/cadastrar', 'admin-cadastrar-veiculo'],
    ['admin', '/admin/clientes/5/editar', 'admin-editar-cliente'],
    ['vendedor', '/vendedor/clientes/cadastrar', 'vendedor-cadastrar-cliente'],
    ['vendedor', '/vendedor/veiculos', 'vendedor-veiculos'],
  ] as const)('%s acessa %s', async (perfil, caminho, nome) => {
    const { router } = await prepararNavegacao({ token: 't', perfil })
    expect((await ir(router, caminho)).name).toBe(nome)
  })

  it.each([
    ['admin', 'dashboard'],
    ['vendedor', 'vendedor-inicio'],
  ] as const)('%s autenticado que abre a tela de login vai para o seu painel (UC01-FA1)', async (perfil, destino) => {
    const { router } = await prepararNavegacao({ token: 't', perfil })
    expect((await ir(router, '/')).name).toBe(destino)
  })

  it('cada rota define um título exibido no layout', async () => {
    const { router } = await prepararNavegacao({})
    const semTitulo = router
      .getRoutes()
      .filter((r) => r.name && !r.meta.titulo)
      .map((r) => String(r.name))
    expect(semTitulo).toEqual([])
  })
})
