/**
 * UC09 Cadastrar veículo · UC11 Editar veículo — formulário com validação RF-EST-04.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import { flushPromises } from '@vue/test-utils'
import CadastrarVeiculoView from '@/views/CadastrarVeiculoView.vue'
import { atualizarVeiculo, buscarVeiculo, cadastrarVeiculo } from '@/services/veiculos.service'
import type { Veiculo } from '@/types/veiculo'
import { erroApi, montar } from '../../support/montar'

jest.mock('@/services/veiculos.service', () => ({
  atualizarVeiculo: jest.fn(), buscarVeiculo: jest.fn(), cadastrarVeiculo: jest.fn(),
}))
const cadastrarMock = cadastrarVeiculo as jest.MockedFunction<typeof cadastrarVeiculo>
const atualizarMock = atualizarVeiculo as jest.MockedFunction<typeof atualizarVeiculo>
const buscarMock = buscarVeiculo as jest.MockedFunction<typeof buscarVeiculo>

const salvo: Veiculo = {
  id_veiculo: 7, marca: 'Toyota', modelo: 'Corolla', versao: 'XEi', ano: 2024, cor: 'Prata',
  quilometragem: 12000, combustivel: 'flex', cambio: 'automatico', placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251', renavam: '12345678901', preco: '145000.00', status: 'disponivel',
}

type W = Awaited<ReturnType<typeof montar>>['wrapper']
async function preencher(w: W, extra: Record<string, string> = {}) {
  const campos: Record<string, string> = {
    marca: ' Toyota ', modelo: 'Corolla', versao: 'XEi', ano: '2024', cor: 'Prata', quilometragem: '12000',
    combustivel: 'flex', cambio: 'automatico', placa: 'abc-1d23', chassi: '9bwzzz377vt004251',
    renavam: '123.456.789-01', preco: '145000', ...extra,
  }
  for (const [campo, valor] of Object.entries(campos)) await w.get(`#veiculo-${campo}`).setValue(valor)
}
const enviar = async (w: W) => { await w.get('form').trigger('submit'); await flushPromises() }

describe('CadastrarVeiculoView', () => {
  beforeEach(() => {
    cadastrarMock.mockResolvedValue(salvo)
    atualizarMock.mockResolvedValue(salvo)
    buscarMock.mockResolvedValue(salvo)
  })

  it('cadastro: mostra o título correto e envia os dados normalizados', async () => {
    const { wrapper, router } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    expect(wrapper.get('h1').text()).toBe('Cadastrar Veículo')

    await preencher(wrapper)
    await enviar(wrapper)

    expect(cadastrarMock).toHaveBeenCalledWith({
      marca: 'Toyota', modelo: 'Corolla', versao: 'XEi', ano: 2024, cor: 'Prata', quilometragem: 12000,
      combustivel: 'flex', cambio: 'automatico', placa: 'ABC1D23', chassi: '9BWZZZ377VT004251',
      renavam: '12345678901', preco: 145000,
    })
    expect(router.currentRoute.value.fullPath).toBe('/admin/veiculos?veiculoSalvo=cadastrado')
  })

  it('vendedor volta para a listagem da própria área', async () => {
    const { wrapper, router } = await montar(CadastrarVeiculoView, { caminho: '/vendedor/veiculos/cadastrar', perfil: 'vendedor' })
    await preencher(wrapper)
    await enviar(wrapper)
    expect(router.currentRoute.value.path).toBe('/vendedor/veiculos')
  })

  it('formulário vazio: aponta todos os campos obrigatórios e não envia', async () => {
    const { wrapper } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    await enviar(wrapper)

    const erros = wrapper.findAll('.field-error').map((e) => e.text())
    expect(erros).toEqual(expect.arrayContaining([
      'A marca é obrigatória.', 'O modelo é obrigatório.', 'A cor é obrigatória.',
      'Selecione um combustível válido.', 'Selecione um câmbio válido.', 'Informe uma placa válida.',
      'O chassi deve possuir 17 caracteres válidos.', 'Informe um RENAVAM válido.', 'Informe um preço válido.',
    ]))
    expect(cadastrarMock).not.toHaveBeenCalled()
  })

  it.each([
    ['placa', 'AB-12345', 'Informe uma placa válida.'],
    ['chassi', '9BWZZZ377VT00425O', 'O chassi deve possuir 17 caracteres válidos.'],
    ['renavam', '1234567890', 'Informe um RENAVAM válido.'],
    ['ano', '1800', 'Informe um ano válido.'],
    ['quilometragem', '-5', 'A quilometragem não pode ser negativa.'],
    ['preco', '0', 'Informe um preço válido.'],
  ])('rejeita %s = %s', async (campo, valor, mensagem) => {
    const { wrapper } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    await preencher(wrapper, { [campo]: valor })
    await enviar(wrapper)
    expect(wrapper.get(`#veiculo-${campo}-erro`).text()).toBe(mensagem)
    expect(cadastrarMock).not.toHaveBeenCalled()
  })

  /**
   * DEF-10 — "versão" é opcional na tela, mas obrigatória no backend (IsNotEmpty).
   * Este teste documenta o comportamento atual do frontend: envia versao = ''.
   * O backend responderá 400 ("versao should not be empty").
   */
  it('[DEF-10] permite enviar sem versão (o backend recusará com 400)', async () => {
    const { wrapper } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    await preencher(wrapper, { versao: '' })
    await enviar(wrapper)
    expect(cadastrarMock).toHaveBeenCalledWith(expect.objectContaining({ versao: '' }))
  })

  it('exibe a mensagem de conflito do backend (placa/chassi/RENAVAM duplicado)', async () => {
    cadastrarMock.mockRejectedValue(erroApi(409, 'Placa, chassi ou RENAVAM já cadastrado'))
    const { wrapper, router } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    await preencher(wrapper)
    await enviar(wrapper)
    expect(wrapper.get('[role="alert"]').text()).toBe('Placa, chassi ou RENAVAM já cadastrado')
    expect(router.currentRoute.value.path).toBe('/admin/veiculos/cadastrar')
  })

  it('junta mensagens de validação em lista vindas do backend', async () => {
    cadastrarMock.mockRejectedValue(erroApi(400, ['versao should not be empty', 'ano must not be greater than 2026']))
    const { wrapper } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    await preencher(wrapper)
    await enviar(wrapper)
    expect(wrapper.get('[role="alert"]').text()).toBe('versao should not be empty ano must not be greater than 2026')
  })

  describe('edição (UC11)', () => {
    const editar = () => montar(CadastrarVeiculoView, {
      caminho: '/admin/veiculos/7/editar', padrao: '/admin/veiculos/:id/editar', perfil: 'admin',
    })

    it('carrega o veículo e preenche o formulário (preço com 2 casas)', async () => {
      const { wrapper } = await editar()
      expect(buscarMock).toHaveBeenCalledWith(7)
      expect(wrapper.get('h1').text()).toBe('Editar Veículo')
      expect((wrapper.get('#veiculo-marca').element as HTMLInputElement).value).toBe('Toyota')
      expect((wrapper.get('#veiculo-preco').element as HTMLInputElement).value).toBe('145000.00')
    })

    it('salva com PATCH e volta com a mensagem de edição', async () => {
      const { wrapper, router } = await editar()
      await wrapper.get('#veiculo-cor').setValue('Azul')
      await enviar(wrapper)
      expect(atualizarMock).toHaveBeenCalledWith(7, expect.objectContaining({ cor: 'Azul', preco: 145000 }))
      expect(router.currentRoute.value.fullPath).toBe('/admin/veiculos?veiculoSalvo=editado')
    })

    it('mostra "Veículo não encontrado." quando a API devolve 404', async () => {
      buscarMock.mockRejectedValue(erroApi(404, undefined as unknown as string)) // 404 sem mensagem no corpo
      const { wrapper } = await editar()
      expect(wrapper.get('[role="alert"]').text()).toBe('Veículo não encontrado.')
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('recusa identificador inválido na URL sem chamar a API', async () => {
      const { wrapper } = await montar(CadastrarVeiculoView, {
        caminho: '/admin/veiculos/abc/editar', padrao: '/admin/veiculos/:id/editar', perfil: 'admin',
      })
      expect(buscarMock).not.toHaveBeenCalled()
      expect(wrapper.get('[role="alert"]').text()).toBe('O identificador do veículo é inválido.')
    })
  })

  it('botão Cancelar volta para a listagem', async () => {
    const { wrapper, router } = await montar(CadastrarVeiculoView, { caminho: '/admin/veiculos/cadastrar', perfil: 'admin' })
    await wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/admin/veiculos')
  })
})
