import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ClientesView from '@/views/ClientesView.vue'
import { inativarCliente, listarClientes } from '@/services/clientes.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/clientes.service', () => ({
  inativarCliente: vi.fn<typeof inativarCliente>(),
  listarClientes: vi.fn<typeof listarClientes>(),
}))

const clientesDeTeste = [
  {
    id_cliente: 1,
    nome: 'Ana Silva',
    cpf: '12345678901',
    email: 'ana@example.com',
    telefone: '11987654321',
    endereco: 'Rua das Flores, 10',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001000',
    documento: 'RG 123456',
    ativo: true,
    data_criacao: '2026-01-01T12:00:00.000Z',
    atualizado_em: '2026-01-01T12:00:00.000Z',
  },
]

describe('ClientesView', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.mocked(listarClientes).mockReset()
    vi.mocked(inativarCliente).mockReset()
    setActivePinia(createPinia())
    useAuthStore().usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }
  })

  it('lista clientes, consulta os detalhes sem expor o documento e pesquisa com debounce', async () => {
    vi.useFakeTimers()
    vi.mocked(listarClientes).mockResolvedValue(clientesDeTeste)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/clientes', component: { template: '<div />' } }],
    })
    await router.push('/clientes')

    const wrapper = mount(ClientesView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })
    await flushPromises()

    expect(listarClientes).toHaveBeenCalledWith(undefined)
    expect(wrapper.text()).toContain('Ana Silva')
    expect(wrapper.text()).toContain('ana@example.com')

    await wrapper.get('button[aria-label="Ver detalhes de Ana Silva"]').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Rua das Flores, 10')
    expect(wrapper.get('[role="dialog"]').text()).not.toContain('RG 123456')

    await wrapper.get('button[aria-label="Fechar detalhes"]').trigger('click')
    await wrapper.get('#busca-clientes').setValue('123.456.789-01')
    await vi.advanceTimersByTimeAsync(350)
    await flushPromises()

    expect(listarClientes).toHaveBeenLastCalledWith('12345678901')
  })

  it('inativa após confirmação e atualiza a situação com os dados retornados pela API', async () => {
    vi.mocked(listarClientes)
      .mockResolvedValueOnce(clientesDeTeste)
      .mockResolvedValueOnce(clientesDeTeste.map((cliente) => ({ ...cliente, ativo: false })))
    vi.mocked(inativarCliente).mockResolvedValue()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/clientes', component: { template: '<div />' } }],
    })
    await router.push('/clientes')

    const wrapper = mount(ClientesView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })
    await flushPromises()

    await wrapper.get('button[aria-label="Inativar Ana Silva"]').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('sem excluir vendas')
    expect(wrapper.get('tbody').text()).toContain('Ativo')

    await wrapper.get('[role="dialog"] button.button--danger').trigger('click')
    await flushPromises()

    expect(inativarCliente).toHaveBeenCalledWith(1)
    expect(listarClientes).toHaveBeenCalledTimes(2)
    expect(wrapper.get('tbody').text()).toContain('Inativo')
    expect(wrapper.text()).toContain('O histórico de compras foi preservado')
  })

  it('não muda a situação local e informa falha da API ao inativar', async () => {
    vi.mocked(listarClientes).mockResolvedValue(clientesDeTeste)
    vi.mocked(inativarCliente).mockRejectedValue(new Error('Falha de rede'))

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/clientes', component: { template: '<div />' } }],
    })
    await router.push('/clientes')

    const wrapper = mount(ClientesView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })
    await flushPromises()

    await wrapper.get('button[aria-label="Inativar Ana Silva"]').trigger('click')
    await wrapper.get('[role="dialog"] button.button--danger').trigger('click')
    await flushPromises()

    expect(wrapper.get('tbody').text()).toContain('Ativo')
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível inativar o cliente')
  })

  it('abre o histórico de vendas filtrado pelo cliente selecionado', async () => {
    vi.mocked(listarClientes).mockResolvedValue(clientesDeTeste)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/clientes', component: { template: '<div />' } }],
    })
    await router.push('/clientes')

    const wrapper = mount(ClientesView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })
    await flushPromises()

    await wrapper.get('button[aria-label="Ver detalhes de Ana Silva"]').trigger('click')
    await wrapper.get('button[aria-expanded="false"]').trigger('click')

    expect(wrapper.get('.history-section a').attributes('href')).toBe(
      '/vendedor/vendas/historico?cliente_id=1',
    )
  })
})
