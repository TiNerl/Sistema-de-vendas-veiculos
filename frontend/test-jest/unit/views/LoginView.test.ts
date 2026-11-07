/**
 * UC01 Autenticar usuário — tela de login (validação, envio, redirecionamento seguro).
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import { flushPromises } from '@vue/test-utils'
import LoginView from '@/views/LoginView.vue'
import { login, obterPerfil } from '@/services/auth.service'
import { erroApi, montar } from '../../support/montar'

jest.mock('@/services/auth.service', () => ({ login: jest.fn(), obterPerfil: jest.fn() }))
const loginMock = login as jest.MockedFunction<typeof login>
const perfilMock = obterPerfil as jest.MockedFunction<typeof obterPerfil>

async function preencherEEnviar(wrapper: Awaited<ReturnType<typeof montar>>['wrapper'], cpf: string, senha: string) {
  await wrapper.get('#login-cpf').setValue(cpf)
  await wrapper.get('#login-senha').setValue(senha)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    sessionStorage.clear()
    loginMock.mockResolvedValue({ accessToken: 'jwt' })
    perfilMock.mockResolvedValue({ id: 1, cpf: '11144477735', perfil: 'admin' })
  })

  it.each([
    ['vazio', ''],
    ['curto', '123'],
    ['todos os dígitos iguais', '111.111.111-11'],
    ['dígito verificador errado', '111.444.777-36'],
  ])('rejeita CPF %s sem chamar a API', async (_caso, cpf) => {
    const { wrapper } = await montar(LoginView, { caminho: '/' })

    await preencherEEnviar(wrapper, cpf, 'segredo1')

    expect(wrapper.get('#login-cpf-erro').text()).toBe('Informe um CPF válido.')
    expect(wrapper.get('#login-cpf').attributes('aria-invalid')).toBe('true')
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('exige a senha', async () => {
    const { wrapper } = await montar(LoginView, { caminho: '/' })
    await preencherEEnviar(wrapper, '111.444.777-35', '   ')
    expect(wrapper.get('#login-senha-erro').text()).toBe('Informe sua senha.')
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('limpa a mensagem de erro do campo assim que o usuário volta a digitar', async () => {
    const { wrapper } = await montar(LoginView, { caminho: '/' })
    await preencherEEnviar(wrapper, '123', '')
    await wrapper.get('#login-cpf').trigger('input')
    expect(wrapper.find('#login-cpf-erro').exists()).toBe(false)
  })

  it('envia o CPF somente com dígitos e redireciona o administrador ao /dashboard', async () => {
    const { wrapper, router } = await montar(LoginView, { caminho: '/' })

    await preencherEEnviar(wrapper, '111.444.777-35', 'segredo1')

    expect(loginMock).toHaveBeenCalledWith({ cpf: '11144477735', senha: 'segredo1' })
    expect(router.currentRoute.value.fullPath).toBe('/dashboard')
  })

  it('redireciona o vendedor ao /vendedor', async () => {
    perfilMock.mockResolvedValue({ id: 2, cpf: '52998224725', perfil: 'vendedor' })
    const { wrapper, router } = await montar(LoginView, { caminho: '/' })
    await preencherEEnviar(wrapper, '529.982.247-25', 'segredo1')
    expect(router.currentRoute.value.fullPath).toBe('/vendedor')
  })

  it('respeita ?redirect interno (volta para a página que exigiu login)', async () => {
    const { wrapper, router } = await montar(LoginView, { caminho: '/?redirect=/admin/clientes', padrao: '/' })
    await preencherEEnviar(wrapper, '111.444.777-35', 'segredo1')
    expect(router.currentRoute.value.fullPath).toBe('/admin/clientes')
  })

  it.each(['//site-malicioso.com', 'https://site-malicioso.com'])(
    'ignora ?redirect=%s (proteção contra open redirect)',
    async (destino) => {
      const { wrapper, router } = await montar(LoginView, {
        caminho: `/?redirect=${encodeURIComponent(destino)}`,
        padrao: '/',
      })
      await preencherEEnviar(wrapper, '111.444.777-35', 'segredo1')
      expect(router.currentRoute.value.fullPath).toBe('/dashboard')
    },
  )

  it('exibe alerta acessível com a mensagem da store quando as credenciais são recusadas', async () => {
    loginMock.mockRejectedValue(erroApi(401, 'Credenciais inválidas'))
    const { wrapper, router } = await montar(LoginView, { caminho: '/' })

    await preencherEEnviar(wrapper, '111.444.777-35', 'errada')

    expect(wrapper.get('[role="alert"]').text()).toContain('CPF ou senha inválidos')
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('alterna a visibilidade da senha com botão acessível', async () => {
    const { wrapper } = await montar(LoginView, { caminho: '/' })
    const botao = wrapper.get('button.password-toggle')

    expect(wrapper.get('#login-senha').attributes('type')).toBe('password')
    expect(botao.attributes('aria-label')).toBe('Mostrar senha')
    await botao.trigger('click')
    expect(wrapper.get('#login-senha').attributes('type')).toBe('text')
    expect(botao.attributes('aria-pressed')).toBe('true')
  })

  it('desabilita o botão e mostra "Entrando..." durante a requisição (evita duplo envio)', async () => {
    let concluir!: (v: { accessToken: string }) => void
    loginMock.mockReturnValue(new Promise((resolve) => (concluir = resolve)))
    const { wrapper } = await montar(LoginView, { caminho: '/' })

    await wrapper.get('#login-cpf').setValue('111.444.777-35')
    await wrapper.get('#login-senha').setValue('segredo1')
    await wrapper.get('form').trigger('submit')

    const botao = wrapper.get('button[type="submit"]')
    expect(botao.attributes('disabled')).toBeDefined()
    expect(botao.text()).toBe('Entrando...')
    await wrapper.get('form').trigger('submit')
    expect(loginMock).toHaveBeenCalledTimes(1)

    concluir({ accessToken: 'jwt' })
    await flushPromises()
  })
})
