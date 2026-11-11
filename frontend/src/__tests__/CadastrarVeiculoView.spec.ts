import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import CadastrarVeiculoView from '@/views/CadastrarVeiculoView.vue'
import {
  atualizarVeiculo,
  buscarVeiculo,
  cadastrarVeiculo,
} from '@/services/veiculos.service'
import { useAuthStore } from '@/stores/auth'
import type { Veiculo } from '@/types/veiculo'

vi.mock('@/services/veiculos.service', () => ({
  atualizarVeiculo: vi.fn(),
  buscarVeiculo: vi.fn(),
  cadastrarVeiculo: vi.fn(),
}))

const veiculo: Veiculo = {
  id_veiculo: 7,
  marca: 'Toyota',
  modelo: 'Corolla',
  versao: 'XEi',
  ano: 2024,
  cor: 'Prata',
  quilometragem: 12000,
  combustivel: 'flex',
  cambio: 'automatico',
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  preco: '145000.00',
  status: 'disponivel',
}

async function criarRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/veiculos', component: { template: '<div />' } },
      { path: '/admin/veiculos/cadastrar', component: CadastrarVeiculoView },
      { path: '/admin/veiculos/:id/editar', component: CadastrarVeiculoView },
    ],
  })
  await router.push(path)
  await router.isReady()
  return router
}

describe('CadastrarVeiculoView', () => {
  beforeEach(() => {
    vi.mocked(atualizarVeiculo).mockReset()
    vi.mocked(buscarVeiculo).mockReset()
    vi.mocked(cadastrarVeiculo).mockReset()
    setActivePinia(createPinia())
    useAuthStore().usuario = { id: 1, cpf: '12345678901', perfil: 'admin' }
  })

  it('valida e envia dados normalizados ao cadastrar veículo', async () => {
    const router = await criarRouter('/admin/veiculos/cadastrar')
    const wrapper = mount(CadastrarVeiculoView, {
      global: { plugins: [router] },
    })

    await wrapper.get('#veiculo-marca').setValue(' Toyota ')
    await wrapper.get('#veiculo-modelo').setValue(' Corolla ')
    await wrapper.get('#veiculo-versao').setValue(' XEi ')
    await wrapper.get('#veiculo-ano').setValue('2024')
    await wrapper.get('#veiculo-cor').setValue(' Prata ')
    await wrapper.get('#veiculo-quilometragem').setValue('12000')
    await wrapper.get('#veiculo-combustivel').setValue('flex')
    await wrapper.get('#veiculo-cambio').setValue('automatico')
    await wrapper.get('#veiculo-placa').setValue('abc-1d23')
    await wrapper.get('#veiculo-chassi').setValue('9bwzzz377vt004251')
    await wrapper.get('#veiculo-renavam').setValue('123.456.789-01')
    await wrapper.get('#veiculo-preco').setValue('145000')
    vi.mocked(cadastrarVeiculo).mockResolvedValue(veiculo)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(cadastrarVeiculo).toHaveBeenCalledWith({
      marca: 'Toyota',
      modelo: 'Corolla',
      versao: 'XEi',
      ano: 2024,
      cor: 'Prata',
      quilometragem: 12000,
      combustivel: 'flex',
      cambio: 'automatico',
      placa: 'ABC1D23',
      chassi: '9BWZZZ377VT004251',
      renavam: '12345678901',
      preco: 145000,
    })
    expect(router.currentRoute.value.query.veiculoSalvo).toBe('cadastrado')
  })

  it('carrega e envia alterações usando o ID da rota', async () => {
    vi.mocked(buscarVeiculo).mockResolvedValue(veiculo)
    vi.mocked(atualizarVeiculo).mockResolvedValue({
      ...veiculo,
      modelo: 'Corolla Cross',
    })

    const router = await criarRouter('/admin/veiculos/7/editar')
    const wrapper = mount(CadastrarVeiculoView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(buscarVeiculo).toHaveBeenCalledWith(7)
    expect((wrapper.get('#veiculo-modelo').element as HTMLInputElement).value).toBe('Corolla')

    await wrapper.get('#veiculo-modelo').setValue('Corolla Cross')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(atualizarVeiculo).toHaveBeenCalledWith(7, {
      marca: 'Toyota',
      modelo: 'Corolla Cross',
      versao: 'XEi',
      ano: 2024,
      cor: 'Prata',
      quilometragem: 12000,
      combustivel: 'flex',
      cambio: 'automatico',
      placa: 'ABC1D23',
      chassi: '9BWZZZ377VT004251',
      renavam: '12345678901',
      preco: 145000,
    })
  })
})
