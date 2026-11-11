import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import CadastrarClienteView from '@/views/CadastrarClienteView.vue'
import {
  atualizarCliente,
  buscarCliente,
  cadastrarCliente,
  listarClientes,
} from '@/services/clientes.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/clientes.service', () => ({
  atualizarCliente: vi.fn<typeof atualizarCliente>(),
  buscarCliente: vi.fn<typeof buscarCliente>(),
  cadastrarCliente: vi.fn<typeof cadastrarCliente>(),
  listarClientes: vi.fn<typeof listarClientes>(),
}))

const clienteResposta = {
  id_cliente: 7,
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
}

function criarRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/clientes', component: { template: '<div />' } },
      {
        path: '/admin/clientes/cadastrar',
        component: CadastrarClienteView,
      },
      {
        path: '/admin/clientes/:id/editar',
        component: CadastrarClienteView,
      },
    ],
  })
  return router.push(path).then(() => router.isReady()).then(() => router)
}

describe('CadastrarClienteView', () => {
  beforeEach(() => {
    vi.mocked(atualizarCliente).mockReset()
    vi.mocked(buscarCliente).mockReset()
    vi.mocked(cadastrarCliente).mockReset()
    setActivePinia(createPinia())
    useAuthStore().usuario = { id: 1, cpf: '11111111111', perfil: 'admin' }
  })

  it('valida os campos e envia o cadastro ao backend após corrigir os dados', async () => {
    const router = await criarRouter('/admin/clientes/cadastrar')
    const wrapper = mount(CadastrarClienteView, {
      global: { plugins: [router] },
    })

    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Informe de 3 a 100 caracteres.')
    expect(cadastrarCliente).not.toHaveBeenCalled()

    await wrapper.get('#cliente-nome').setValue('Ana Silva')
    await wrapper.get('#cliente-cpf').setValue('123.456.789-01')
    await wrapper.get('#cliente-email').setValue('ana@example.com')
    await wrapper.get('#cliente-telefone').setValue('(11) 98765-4321')
    await wrapper.get('#cliente-endereco').setValue('Rua das Flores, 10')
    await wrapper.get('#cliente-cidade').setValue('São Paulo')
    await wrapper.get('#cliente-estado').setValue('sp')
    await wrapper.get('#cliente-cep').setValue('01001-000')
    await wrapper.get('#cliente-documento').setValue('RG 123456')
    vi.mocked(cadastrarCliente).mockResolvedValue(clienteResposta)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(cadastrarCliente).toHaveBeenCalledWith({
      nome: 'Ana Silva',
      cpf: '12345678901',
      email: 'ana@example.com',
      telefone: '11987654321',
      endereco: 'Rua das Flores, 10',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001000',
      documento: 'RG 123456',
    })
    expect(wrapper.text()).toContain('Cliente cadastrado com sucesso.')
  })

  it('carrega o cliente e envia as alterações pelo identificador da rota', async () => {
    vi.mocked(buscarCliente).mockResolvedValue(clienteResposta)
    vi.mocked(atualizarCliente).mockResolvedValue({
      ...clienteResposta,
      nome: 'Ana Souza',
    })

    const router = await criarRouter('/admin/clientes/7/editar')
    const wrapper = mount(CadastrarClienteView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(buscarCliente).toHaveBeenCalledWith(7)
    expect((wrapper.get('#cliente-nome').element as HTMLInputElement).value).toBe('Ana Silva')

    await wrapper.get('#cliente-nome').setValue('Ana Souza')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(atualizarCliente).toHaveBeenCalledWith(7, {
      nome: 'Ana Souza',
      cpf: '12345678901',
      email: 'ana@example.com',
      telefone: '11987654321',
      endereco: 'Rua das Flores, 10',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001000',
      documento: 'RG 123456',
    })
    expect(wrapper.text()).toContain('Alterações salvas com sucesso.')
  })

  it('não exibe nem envia formulário vazio quando falha ao carregar o cliente', async () => {
    vi.mocked(buscarCliente).mockRejectedValue(new Error('falha'))

    const router = await criarRouter('/admin/clientes/7/editar')
    const wrapper = mount(CadastrarClienteView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível salvar as alterações.')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(atualizarCliente).not.toHaveBeenCalled()
  })
})
