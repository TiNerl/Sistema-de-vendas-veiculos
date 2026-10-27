import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VeiculosVendedorView from '@/views/VeiculosVendedorView.vue'
import { listarVeiculos } from '@/services/veiculos.service'

vi.mock('@/services/veiculos.service', () => ({
  listarVeiculos: vi.fn(),
}))

const veiculosDeTeste = [
  {
    id_veiculo: 1,
    marca: 'Toyota',
    modelo: 'Corolla',
    versao: 'XEi',
    ano: 2024,
    cor: 'Prata',
    quilometragem: 12000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'ABC1D23',
    chassi: '12345678901234567',
    renavam: '12345678901',
    preco: '145000.00',
    status: 'disponivel' as const,
  },
  {
    id_veiculo: 2,
    marca: 'Honda',
    modelo: 'Civic',
    versao: 'Touring',
    ano: 2023,
    cor: 'Preto',
    quilometragem: 18000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'DEF4G56',
    chassi: '76543210987654321',
    renavam: '10987654321',
    preco: '158000.00',
    status: 'reservado' as const,
  },
]

describe('VeiculosVendedorView', () => {
  beforeEach(() => {
    vi.mocked(listarVeiculos).mockReset()
  })

  it('carrega veículos reais e permite filtrar por texto e status', async () => {
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)

    const wrapper = mount(VeiculosVendedorView)
    await flushPromises()

    expect(wrapper.text()).toContain('Toyota Corolla XEi')
    expect(wrapper.text()).toContain('R$ 145.000,00')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)

    await wrapper.get('#busca-veiculos').setValue('civic')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Honda Civic Touring')

    await wrapper.get('#busca-veiculos').setValue('')
    await wrapper.get('#filtro-status-veiculos').setValue('disponivel')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Toyota Corolla XEi')
  })
})
