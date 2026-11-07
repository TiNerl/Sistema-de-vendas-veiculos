/**
 * UC01 Autenticar · UC18 Encerrar sessão — store Pinia `auth`.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { login, obterPerfil } from '@/services/auth.service'
import { erroApi } from '../../support/montar'

jest.mock('@/services/auth.service', () => ({ login: jest.fn(), obterPerfil: jest.fn() }))
const loginMock = login as jest.MockedFunction<typeof login>
const perfilMock = obterPerfil as jest.MockedFunction<typeof obterPerfil>

describe('useAuthStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('inicia autenticado quando já existe token na sessão da aba', () => {
    sessionStorage.setItem('accessToken', 'token-salvo')
    setActivePinia(createPinia())

    const auth = useAuthStore()
    expect(auth.token).toBe('token-salvo')
    expect(auth.autenticado).toBe(true)
    expect(auth.usuario).toBeNull()
  })

  it('entrar: grava o token no sessionStorage e carrega o perfil', async () => {
    loginMock.mockResolvedValue({ accessToken: 'jwt-novo' })
    perfilMock.mockResolvedValue({ id: 1, cpf: '11144477735', perfil: 'admin', nome: 'Admin' })
    const auth = useAuthStore()

    await auth.entrar({ cpf: '11144477735', senha: 'segredo1' })

    expect(loginMock).toHaveBeenCalledWith({ cpf: '11144477735', senha: 'segredo1' })
    expect(sessionStorage.getItem('accessToken')).toBe('jwt-novo')
    expect(auth.usuario?.perfil).toBe('admin')
    expect(auth.autenticado).toBe(true)
    expect(auth.carregando).toBe(false)
    expect(auth.erro).toBeNull()
  })

  it('entrar com 401: mostra mensagem de credenciais e limpa qualquer sessão', async () => {
    sessionStorage.setItem('accessToken', 'antigo')
    loginMock.mockRejectedValue(erroApi(401, 'Credenciais inválidas'))
    const auth = useAuthStore()

    await expect(auth.entrar({ cpf: '1', senha: 'x' })).rejects.toThrow()

    expect(auth.erro).toBe('CPF ou senha inválidos. Verifique seus dados e tente novamente.')
    expect(auth.autenticado).toBe(false)
    expect(auth.token).toBeNull()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(auth.carregando).toBe(false)
  })

  it.each([
    ['erro HTTP 500', erroApi(500, 'Internal server error')],
    ['falha de rede (não-Axios)', new TypeError('Failed to fetch')],
  ])('entrar com %s: mensagem genérica, sem expor detalhes técnicos', async (_caso, erro) => {
    loginMock.mockRejectedValue(erro)
    const auth = useAuthStore()

    await expect(auth.entrar({ cpf: '1', senha: 'x' })).rejects.toBe(erro)
    expect(auth.erro).toBe('Não foi possível concluir o acesso. Tente novamente.')
  })

  it('carregarPerfil sem token não chama a API e marca como não autenticado', async () => {
    const auth = useAuthStore()

    await expect(auth.carregarPerfil()).resolves.toBe(false)
    expect(perfilMock).not.toHaveBeenCalled()
    expect(auth.autenticado).toBe(false)
  })

  it('sair: remove token, usuário e o item do sessionStorage', async () => {
    loginMock.mockResolvedValue({ accessToken: 'jwt' })
    perfilMock.mockResolvedValue({ id: 2, cpf: '52998224725', perfil: 'vendedor' })
    const auth = useAuthStore()
    await auth.entrar({ cpf: '52998224725', senha: 'segredo1' })

    auth.sair()

    expect(auth.token).toBeNull()
    expect(auth.usuario).toBeNull()
    expect(auth.autenticado).toBe(false)
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })
})
