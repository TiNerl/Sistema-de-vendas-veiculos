import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientesView from '@/views/ClientesView.vue'
import HistoricoVendasView from '@/views/HistoricoVendasView.vue'

const mocks = vi.hoisted(() => ({
  auth: {
    usuario: null as null | { perfil: 'admin' | 'vendedor'; id?: number },
  },
  route: { query: {} as Record<string, unknown> },
  push: vi.fn(),
  listarClientes: vi.fn(),
  inativarCliente: vi.fn(),
  listarVendas: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
  useRoute: () => mocks.route,
}))
vi.mock('@/services/clientes.service', () => ({
  listarClientes: mocks.listarClientes,
  inativarCliente: mocks.inativarCliente,
}))
vi.mock('@/services/vendas.service', () => ({ listarVendas: mocks.listarVendas }))

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

const cliente = {
  id_cliente: 41,
  nome: 'Cliente de teste',
  cpf: '12345678901',
  email: 'cliente@example.com',
  telefone: '11999999999',
  endereco: 'Rua de teste',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01001000',
  documento: '12345678901',
  ativo: true,
  data_criacao: '2026-01-01',
  atualizado_em: '2026-01-01',
}

async function abrirDetalhes() {
  const wrapper = mount(ClientesView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  await wrapper.get('button[aria-label="Ver detalhes de Cliente de teste"]').trigger('click')
  return wrapper
}

describe('navegação do histórico de compras do cliente', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.auth.usuario = { perfil: 'admin' }
    mocks.route.query = {}
    mocks.listarClientes.mockResolvedValue([cliente])
    mocks.listarVendas.mockResolvedValue([])
  })

  it.each([
    ['admin', '/admin/vendas?cliente_id=41'],
    ['vendedor', '/vendedor/vendas/historico?cliente_id=41'],
  ] as const)(
    'abre o histórico diretamente para o perfil %s e o cliente selecionado',
    async (perfil, destino) => {
      mocks.auth.usuario = { perfil }
      const wrapper = await abrirDetalhes()

      const linkHistorico = wrapper
        .findAll('a')
        .find((link) => link.text() === 'Histórico de compras')

      expect(linkHistorico?.attributes('href')).toBe(destino)
      expect(wrapper.text()).not.toContain('Consultar vendas deste cliente')
    },
  )

  it('carrega automaticamente as vendas filtradas pelo cliente recebido na rota', async () => {
    mocks.route.query = { cliente_id: '41' }
    const wrapper = mount(HistoricoVendasView, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    await flushPromises()

    expect(mocks.listarVendas).toHaveBeenCalledWith({ cliente_id: 41 })
    expect((wrapper.get('#filtro-cliente').element as HTMLSelectElement).value).toBe('41')
  })
})
