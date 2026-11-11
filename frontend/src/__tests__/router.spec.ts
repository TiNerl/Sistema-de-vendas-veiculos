import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

describe('controle de acesso das rotas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.setItem('accessToken', 'token-de-teste')
  })

  it('direciona vendedor para sua área ao acessar o painel administrativo', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }

    await router.push('/dashboard?case=seller-dashboard')

    expect(router.currentRoute.value.name).toBe('vendedor-inicio')
  })

  it('direciona administrador para seu painel ao acessar a área do vendedor', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 1, cpf: '11111111111', perfil: 'admin' }

    await router.push('/vendedor?case=admin-vendedor')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('impede que vendedor abra diretamente uma rota exclusiva do administrador', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }

    await router.push('/admin/usuarios?case=seller-admin')

    expect(router.currentRoute.value.name).toBe('vendedor-inicio')
  })

  it('permite que vendedor acesse a listagem de clientes', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }

    await router.push('/vendedor/clientes?case=seller-clientes')

    expect(router.currentRoute.value.name).toBe('vendedor-clientes')
  })

  it('permite que administrador acesse a listagem de clientes', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 1, cpf: '11111111111', perfil: 'admin' }

    await router.push('/admin/clientes?case=admin-clientes')

    expect(router.currentRoute.value.name).toBe('admin-clientes')
  })

  // Testes da branch feature/FRONTEND-valores-e-descontos
  it('permite que vendedor acesse suas solicitações de desconto', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }

    await router.push('/vendedor/descontos?case=seller-descontos')

    expect(router.currentRoute.value.name).toBe('vendedor-solicitacoes-desconto')
  })

  it('permite que somente administrador acesse a fila de aprovação', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 1, cpf: '11111111111', perfil: 'admin' }

    await router.push('/admin/descontos?case=admin-descontos')

    expect(router.currentRoute.value.name).toBe('admin-solicitacoes-desconto')
  })

  // Testes da branch dev
  it('permite que vendedor acesse a listagem do estoque', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }

    await router.push('/vendedor/veiculos?case=seller-vehicles')

    expect(router.currentRoute.value.name).toBe('vendedor-veiculos')
  })

  it('permite que administrador acesse a listagem do estoque', async () => {
    const auth = useAuthStore()
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = { id: 1, cpf: '11111111111', perfil: 'admin' }

    await router.push('/admin/veiculos?case=admin-vehicles')

    expect(router.currentRoute.value.name).toBe('admin-veiculos')
  })
})