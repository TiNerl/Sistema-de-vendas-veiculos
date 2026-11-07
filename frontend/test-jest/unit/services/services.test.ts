/**
 * Camada de serviços do frontend: contratos REST com o backend.
 * O cliente HTTP (`api`) é substituído por um dublê para inspecionar URL, verbo e corpo.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import { api } from '@/services/api'
import * as authService from '@/services/auth.service'
import * as clientesService from '@/services/clientes.service'
import * as usuariosService from '@/services/usuarios.service'
import * as veiculosService from '@/services/veiculos.service'
import { novoVeiculo, rotuloCombustivel, opcoesStatus } from '@/types/veiculo'
import { erroApi } from '../../support/montar'

jest.mock('@/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}))
const http = api as unknown as Record<'get' | 'post' | 'patch', jest.Mock>

describe('serviços HTTP do frontend', () => {
  beforeEach(() => {
    for (const verbo of ['get', 'post', 'patch'] as const) http[verbo].mockResolvedValue({ data: 'ok' })
  })

  it('auth: POST /auth/login e GET /auth/perfil', async () => {
    await expect(authService.login({ cpf: '1', senha: '2' })).resolves.toBe('ok')
    await authService.obterPerfil()
    expect(http.post).toHaveBeenCalledWith('/auth/login', { cpf: '1', senha: '2' })
    expect(http.get).toHaveBeenCalledWith('/auth/perfil')
  })

  it('clientes: envia ?busca apenas quando há termo', async () => {
    await clientesService.listarClientes()
    await clientesService.listarClientes('maria')
    expect(http.get).toHaveBeenNthCalledWith(1, '/clientes', { params: undefined })
    expect(http.get).toHaveBeenNthCalledWith(2, '/clientes', { params: { busca: 'maria' } })
  })

  it('clientes: buscar, cadastrar, atualizar (PATCH parcial) e inativar', async () => {
    await clientesService.buscarCliente(3)
    await clientesService.cadastrarCliente({ nome: 'A' } as never)
    await clientesService.atualizarCliente(3, { telefone: '84999990000' })
    await expect(clientesService.inativarCliente(3)).resolves.toBeUndefined()
    expect(http.get).toHaveBeenCalledWith('/clientes/3')
    expect(http.post).toHaveBeenCalledWith('/clientes', { nome: 'A' })
    expect(http.patch).toHaveBeenCalledWith('/clientes/3', { telefone: '84999990000' })
    expect(http.patch).toHaveBeenCalledWith('/clientes/3/inativar')
  })

  it('usuários: listar, cadastrar e inativar com confirmação de CPF no corpo', async () => {
    await usuariosService.listarUsuarios()
    await usuariosService.cadastrarUsuario({ nome: 'B', cpf: '52998224725', senha: 'segredo1', perfil: 'vendedor' })
    await usuariosService.inativarUsuario(4, '52998224725')
    expect(http.get).toHaveBeenCalledWith('/usuarios')
    expect(http.post).toHaveBeenCalledWith('/usuarios', expect.objectContaining({ perfil: 'vendedor' }))
    expect(http.patch).toHaveBeenCalledWith('/usuarios/4/inativar', { cpf: '52998224725' })
  })

  it('veículos: normaliza placa (sem hífen, maiúsculas), chassi e converte preço para número', async () => {
    const dados = { ...novoVeiculo(), placa: 'abc-1d23', chassi: '9bwzzz377vt004251', preco: '145000.50' }

    await veiculosService.cadastrarVeiculo(dados)
    await veiculosService.atualizarVeiculo(7, dados)

    const esperado = expect.objectContaining({ placa: 'ABC1D23', chassi: '9BWZZZ377VT004251', preco: 145000.5 })
    expect(http.post).toHaveBeenCalledWith('/veiculos', esperado)
    expect(http.patch).toHaveBeenCalledWith('/veiculos/7', esperado)
  })

  it('veículos: listar envia filtros como query string; status usa sub-recurso', async () => {
    await veiculosService.listarVeiculos({ marca: 'Fiat', precoMax: 80000 })
    await veiculosService.listarVeiculos()
    await veiculosService.buscarVeiculo(7)
    await veiculosService.atualizarStatusVeiculo(7, 'em_manutencao')
    expect(http.get).toHaveBeenNthCalledWith(1, '/veiculos', { params: { marca: 'Fiat', precoMax: 80000 } })
    expect(http.get).toHaveBeenNthCalledWith(2, '/veiculos', { params: {} })
    expect(http.get).toHaveBeenCalledWith('/veiculos/7')
    expect(http.patch).toHaveBeenCalledWith('/veiculos/7/status', { status: 'em_manutencao' })
  })
})

describe('mensagemErroApi', () => {
  it.each([
    ['mensagem única', erroApi(409, 'CPF duplicado'), 'CPF duplicado'],
    ['lista de validação', erroApi(400, ['cpf inválido', 'email inválido']), 'cpf inválido email inválido'],
    ['sem corpo', new Error('rede'), 'Padrão'],
    ['message não textual', erroApi(400, [1, 2] as unknown as string[]), 'Padrão'],
  ])('%s', (_caso, erro, esperado) => {
    expect(usuariosService.mensagemErroApi(erro, 'Padrão')).toBe(esperado)
  })
})

describe('tipos e utilitários de veículo', () => {
  it('rotuloCombustivel traduz valores conhecidos e devolve o original para desconhecidos', () => {
    expect(rotuloCombustivel('eletrico')).toBe('Elétrico')
    expect(rotuloCombustivel('gnv')).toBe('gnv')
  })

  it('novoVeiculo cria formulário vazio com o ano corrente', () => {
    expect(novoVeiculo()).toMatchObject({ marca: '', ano: new Date().getFullYear(), preco: 0 })
  })

  it('opções de status cobrem os 4 estados do backend', () => {
    expect(opcoesStatus.map((o) => o.valor)).toEqual(['disponivel', 'reservado', 'vendido', 'em_manutencao'])
  })
})
