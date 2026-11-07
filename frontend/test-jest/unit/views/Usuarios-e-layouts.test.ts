/**
 * UC02 Cadastrar usuário · UC03 Inativar usuário · UC04 Consultar usuários · UC18 Encerrar sessão.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import { flushPromises } from '@vue/test-utils'
import CadastrarUsuarioView from '@/views/CadastrarUsuarioView.vue'
import ListaUsuariosView from '@/views/ListaUsuariosView.vue'
import InativarUsuarioView from '@/views/InativarUsuarioView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import VendLayout from '@/layouts/VendLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import VendedorDashboardView from '@/views/VendedorDashboardView.vue'
import ModuloVendedorView from '@/views/ModuloVendedorView.vue'
import { cadastrarUsuario, inativarUsuario, listarUsuarios, type Usuario } from '@/services/usuarios.service'
import { erroApi, montar } from '../../support/montar'

jest.mock('@/services/usuarios.service', () => ({
  ...jest.requireActual('@/services/usuarios.service'),
  cadastrarUsuario: jest.fn(), inativarUsuario: jest.fn(), listarUsuarios: jest.fn(),
}))
const cadastrarMock = cadastrarUsuario as jest.MockedFunction<typeof cadastrarUsuario>
const inativarMock = inativarUsuario as jest.MockedFunction<typeof inativarUsuario>
const listarMock = listarUsuarios as jest.MockedFunction<typeof listarUsuarios>

const usuarios: Usuario[] = [
  { id_usuario: 1, nome: 'Admin Teste', cpf: '11144477735', perfil: 'admin', ativo: true },
  { id_usuario: 2, nome: 'Ana Vendedora', cpf: '52998224725', perfil: 'vendedor', ativo: true },
  { id_usuario: 3, nome: 'Bruno Bloqueado', cpf: '39053344705', perfil: 'vendedor', ativo: false },
]

describe('CadastrarUsuarioView (UC02)', () => {
  type W = Awaited<ReturnType<typeof montar>>['wrapper']
  async function preencher(w: W, extra: Record<string, string> = {}) {
    const c = { 'novo-nome': ' Ana Vendedora ', 'novo-cpf': '529.982.247-25', 'nova-senha': 'segredo1', 'confirmar-senha': 'segredo1', ...extra }
    for (const [id, v] of Object.entries(c)) await w.get(`#${id}`).setValue(v)
  }
  const enviar = async (w: W) => { await w.get('form').trigger('submit'); await flushPromises() }

  beforeEach(() => {
    cadastrarMock.mockResolvedValue(usuarios[1]!)
  })

  it('cadastra vendedor (perfil padrão) com CPF só em dígitos e sem enviar a confirmação de senha', async () => {
    const { wrapper } = await montar(CadastrarUsuarioView, { caminho: '/admin/usuarios/cadastrar', perfil: 'admin' })
    await preencher(wrapper)
    await enviar(wrapper)
    expect(cadastrarMock).toHaveBeenCalledWith({ nome: 'Ana Vendedora', cpf: '52998224725', senha: 'segredo1', perfil: 'vendedor' })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('permite escolher o perfil Administrador', async () => {
    const { wrapper } = await montar(CadastrarUsuarioView, { caminho: '/admin/usuarios/cadastrar', perfil: 'admin' })
    await preencher(wrapper)
    await wrapper.get('#novo-perfil').setValue('admin')
    await enviar(wrapper)
    expect(cadastrarMock).toHaveBeenCalledWith(expect.objectContaining({ perfil: 'admin' }))
  })

  it.each([
    ['novo-nome', '   ', 'novo-nome-erro', 'Informe o nome completo.'],
    ['novo-cpf', '', 'novo-cpf-erro', 'Informe o CPF.'],
    ['novo-cpf', '123.456.789-00', 'novo-cpf-erro', 'Informe um CPF válido.'],
    ['nova-senha', '12345', 'nova-senha-ajuda', 'A senha deve ter pelo menos 6 caracteres.'],
    ['confirmar-senha', 'outra123', 'confirmar-senha-erro', 'As senhas não coincidem.'],
  ])('valida #%s = "%s"', async (campo, valor, idErro, mensagem) => {
    const { wrapper } = await montar(CadastrarUsuarioView, { caminho: '/admin/usuarios/cadastrar', perfil: 'admin' })
    await preencher(wrapper, { [campo]: valor })
    await enviar(wrapper)
    expect(wrapper.get(`#${idErro}`).text()).toBe(mensagem)
    expect(cadastrarMock).not.toHaveBeenCalled()
  })

  it('exibe o erro devolvido pela API', async () => {
    cadastrarMock.mockRejectedValue(erroApi(500, 'Internal server error'))
    const { wrapper } = await montar(CadastrarUsuarioView, { caminho: '/admin/usuarios/cadastrar', perfil: 'admin' })
    await preencher(wrapper)
    await enviar(wrapper)
    expect(wrapper.get('[role="alert"]').text()).toBe('Internal server error')
  })
})

describe('ListaUsuariosView (UC04)', () => {
  beforeEach(() => {
    listarMock.mockResolvedValue(usuarios)
  })
  const nomes = (w: Awaited<ReturnType<typeof montar>>['wrapper']) =>
    w.findAll('tbody tr').map((tr) => tr.find('td').text())

  it('lista todos e filtra por nome, CPF, perfil e situação (no cliente)', async () => {
    const { wrapper } = await montar(ListaUsuariosView, { caminho: '/admin/usuarios', perfil: 'admin' })
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)

    await wrapper.get('#busca-usuarios').setValue('ana')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    await wrapper.get('#busca-usuarios').setValue('390.533')
    expect(wrapper.text()).toContain('Bruno Bloqueado')

    await wrapper.get('#busca-usuarios').setValue('')
    await wrapper.get('#filtro-perfil').setValue('vendedor')
    await wrapper.get('#filtro-situacao').setValue('ativo')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(nomes(wrapper).join()).toContain('Ana')
    await wrapper.get('#filtro-situacao').setValue('inativo')
    expect(wrapper.text()).toContain('Bruno Bloqueado')
  })

  it('mostra erro quando a lista não carrega', async () => {
    listarMock.mockRejectedValue(erroApi(403, 'Forbidden resource'))
    const { wrapper } = await montar(ListaUsuariosView, { caminho: '/admin/usuarios', perfil: 'admin' })
    expect(wrapper.get('[role="alert"]').text()).toBe('Forbidden resource')
  })
})

describe('InativarUsuarioView (UC03)', () => {
  beforeEach(() => {
    listarMock.mockResolvedValue(usuarios)
    inativarMock.mockResolvedValue({ ...usuarios[1]!, ativo: false })
  })

  it('lista apenas usuários ativos', async () => {
    const { wrapper } = await montar(InativarUsuarioView, { caminho: '/admin/usuarios/inativar', perfil: 'admin' })
    expect(wrapper.text()).not.toContain('Bruno Bloqueado')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('só habilita a confirmação quando o CPF redigitado confere, e então inativa', async () => {
    const { wrapper } = await montar(InativarUsuarioView, { caminho: '/admin/usuarios/inativar', perfil: 'admin' })
    const linhaAna = wrapper.findAll('tbody tr').find((tr) => tr.text().includes('Ana Vendedora'))!
    await linhaAna.get('button').trigger('click')

    const confirmar = () => wrapper.findAll('[role="dialog"] button').find((b) => b.text().includes('Confirmar'))!
    await wrapper.get('#cpf-confirmacao').setValue('111.444.777-35')
    expect(confirmar().attributes('disabled')).toBeDefined()

    await wrapper.get('#cpf-confirmacao').setValue('529.982.247-25')
    expect(confirmar().attributes('disabled')).toBeUndefined()
    await confirmar().trigger('click')
    await flushPromises()

    expect(inativarMock).toHaveBeenCalledWith(2, '52998224725')
    expect(wrapper.get('[role="status"]').text()).toBe('O usuário Ana Vendedora foi inativado.')
  })

  it('exibe o erro da API (ex.: usuário já inativo)', async () => {
    inativarMock.mockRejectedValue(erroApi(409, 'Usuario já está inativo'))
    const { wrapper } = await montar(InativarUsuarioView, { caminho: '/admin/usuarios/inativar', perfil: 'admin' })
    await wrapper.findAll('tbody tr')[1]!.get('button').trigger('click')
    await wrapper.get('#cpf-confirmacao').setValue('52998224725')
    await wrapper.findAll('[role="dialog"] button').find((b) => b.text().includes('Confirmar'))!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Usuario já está inativo')
  })

  it('pré-seleciona o usuário indicado em ?usuario=', async () => {
    const { wrapper } = await montar(InativarUsuarioView, {
      caminho: '/admin/usuarios/inativar?usuario=2', padrao: '/admin/usuarios/inativar', perfil: 'admin',
    })
    expect(wrapper.html()).toContain('Ana Vendedora')
  })
})

describe('Layouts e painéis (UC18 Encerrar sessão)', () => {
  it.each([
    ['AdminLayout', AdminLayout, 'admin', '/dashboard'],
    ['VendLayout', VendLayout, 'vendedor', '/vendedor'],
  ] as const)('%s mostra o usuário e "Sair" encerra a sessão', async (_n, layout, perfil, caminho) => {
    sessionStorage.setItem('accessToken', 'token-de-teste')
    const { wrapper, router, auth } = await montar(layout, { caminho, perfil })
    expect(wrapper.text()).toContain(perfil === 'admin' ? 'Admin Teste' : 'Vendedora Teste')

    const sair = wrapper.findAll('button').find((b) => /sair/i.test(b.text() + (b.attributes('aria-label') ?? '')))!
    await sair.trigger('click')
    await flushPromises()

    expect(auth.usuario).toBeNull()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('o botão de menu móvel abre e fecha a navegação', async () => {
    const { wrapper } = await montar(VendLayout, { caminho: '/vendedor', perfil: 'vendedor' })
    const toggle = wrapper.get('button.mobile-menu-toggle')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    await wrapper.get('[aria-label="Fechar menu"]').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it.each([
    ['DashboardView', DashboardView, 'admin'],
    ['VendedorDashboardView', VendedorDashboardView, 'vendedor'],
    ['ModuloVendedorView', ModuloVendedorView, 'vendedor'],
  ] as const)('%s renderiza sem erros', async (_n, view, perfil) => {
    const { wrapper } = await montar(view, { caminho: '/painel', perfil })
    expect(wrapper.find('h1').exists()).toBe(true)
  })
})
