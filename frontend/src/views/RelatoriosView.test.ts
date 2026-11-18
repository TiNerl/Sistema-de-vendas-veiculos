import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RelatoriosView from '@/views/RelatoriosView.vue'
import type {
  FiltrosRelatorio,
  FiltrosRelatorioDesempenho,
  RelatorioDesempenhoVendedor,
  RelatorioEstoque,
  RelatorioFaturamentoMensal,
} from '@/services/relatorios.service'
import type { Usuario } from '@/services/usuarios.service'

const mocks = vi.hoisted(() => ({
  auth: { usuario: null as null | { perfil: 'admin' | 'vendedor' } },
  listarUsuarios: vi.fn<() => Promise<Usuario[]>>(),
  obterRelatorioDesempenho: vi.fn<
    (filtros?: FiltrosRelatorioDesempenho) => Promise<RelatorioDesempenhoVendedor[]>
  >(),
  obterRelatorioEstoque: vi.fn<() => Promise<RelatorioEstoque[]>>(),
  obterRelatorioFaturamento: vi.fn<
    (filtros?: FiltrosRelatorio) => Promise<RelatorioFaturamentoMensal[]>
  >(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mocks.auth,
}))

vi.mock('@/services/usuarios.service', () => ({
  listarUsuarios: mocks.listarUsuarios,
}))

vi.mock('@/services/relatorios.service', () => ({
  obterRelatorioDesempenho: mocks.obterRelatorioDesempenho,
  obterRelatorioEstoque: mocks.obterRelatorioEstoque,
  obterRelatorioFaturamento: mocks.obterRelatorioFaturamento,
}))

const usuarios: Usuario[] = [
  { id_usuario: 1, nome: 'Ana Silva', cpf: '111', perfil: 'vendedor', ativo: true },
  { id_usuario: 2, nome: 'Bruno Souza', cpf: '222', perfil: 'vendedor', ativo: true },
  { id_usuario: 3, nome: 'Carla Lima', cpf: '333', perfil: 'vendedor', ativo: false },
  { id_usuario: 4, nome: 'Admin', cpf: '444', perfil: 'admin', ativo: true },
]

const desempenho: RelatorioDesempenhoVendedor[] = usuarios.slice(0, 2).map((usuario) => ({
  id_usuario: usuario.id_usuario,
  nome_usuario: usuario.nome,
  quantidade_vendas: 2,
  faturamento_total: 10000,
  comissao_total: 500,
}))

async function abrirDesempenho() {
  const wrapper = mount(RelatoriosView)
  await flushPromises()
  await wrapper.get('.reports-selector button:nth-child(3)').trigger('click')
  await flushPromises()
  return wrapper
}

describe('RelatoriosView — desempenho por vendedor', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.auth.usuario = { perfil: 'admin' }
    mocks.listarUsuarios.mockResolvedValue(usuarios)
    mocks.obterRelatorioDesempenho.mockImplementation(async (filtros = {}) =>
      filtros.id_usuario === undefined
        ? desempenho
        : desempenho.filter((linha) => linha.id_usuario === filtros.id_usuario),
    )
    mocks.obterRelatorioEstoque.mockResolvedValue([])
    mocks.obterRelatorioFaturamento.mockResolvedValue([])
  })

  it('mantém a visão consolidada e filtra pelo identificador selecionado', async () => {
    const wrapper = await abrirDesempenho()

    expect(mocks.listarUsuarios).toHaveBeenCalledOnce()
    expect(mocks.obterRelatorioDesempenho).toHaveBeenCalledWith({})
    expect(wrapper.get('tbody').text()).toContain('Ana Silva')
    expect(wrapper.get('tbody').text()).toContain('Bruno Souza')
    expect(wrapper.get('#relatorio-vendedor').text()).toContain('Ana Silva')
    expect(wrapper.get('#relatorio-vendedor').text()).toContain('Bruno Souza')
    expect(wrapper.get('#relatorio-vendedor').text()).not.toContain('Carla Lima')
    expect(wrapper.get('#relatorio-vendedor').element).toBeTruthy()

    await wrapper.get('#relatorio-vendedor').setValue('2')
    await flushPromises()

    expect(mocks.obterRelatorioDesempenho).toHaveBeenLastCalledWith({ id_usuario: 2 })
    expect(wrapper.text()).toContain('Vendedor selecionado: Bruno Souza')
    expect(wrapper.get('tbody').text()).toContain('Bruno Souza')
    expect(wrapper.get('tbody').text()).not.toContain('Ana Silva')

    await wrapper.get('#relatorio-vendedor').setValue('1')
    await flushPromises()
    expect(mocks.obterRelatorioDesempenho).toHaveBeenLastCalledWith({ id_usuario: 1 })
    expect(wrapper.get('tbody').text()).toContain('Ana Silva')
    expect(wrapper.get('tbody').text()).not.toContain('Bruno Souza')
    wrapper.unmount()
  })

  it('mostra mensagem informativa quando o vendedor selecionado não tem resultados', async () => {
    mocks.obterRelatorioDesempenho.mockImplementation(async (filtros = {}) =>
      filtros.id_usuario === undefined ? desempenho : [],
    )
    const wrapper = await abrirDesempenho()

    await wrapper.get('#relatorio-vendedor').setValue('2')
    await flushPromises()

    expect(wrapper.get('.empty-state').text()).toContain(
      'Nenhum dado de desempenho encontrado para Bruno Souza',
    )
    expect(wrapper.find('tbody').exists()).toBe(false)
    wrapper.unmount()
  })

  it('não mostra o filtro nem lista usuários para perfil Vendedor', async () => {
    mocks.auth.usuario = { perfil: 'vendedor' }
    const wrapper = await abrirDesempenho()

    expect(wrapper.find('#relatorio-vendedor').exists()).toBe(false)
    expect(mocks.listarUsuarios).not.toHaveBeenCalled()
    expect(mocks.obterRelatorioDesempenho).toHaveBeenCalledWith({})
    wrapper.unmount()
  })
})
