import { api } from '@/services/api'

export interface FiltrosRelatorio {
  dataInicio?: string
  dataFim?: string
}

export interface RelatorioFaturamentoMensal {
  ano: string | number
  mes: string | number
  quantidade_vendas: string | number
  faturamento_total: string | number
}

export type StatusEstoque = 'disponivel' | 'reservado' | 'vendido' | 'em_manutencao'

export interface RelatorioEstoque {
  status: StatusEstoque
  quantidade_veiculos: number
  valor_total: number
}

export interface RelatorioDesempenhoVendedor {
  id_usuario: number | string
  nome_usuario: string
  quantidade_vendas: string | number
  faturamento_total: string | number
  comissao_total: string | number
}

function ehRegistro(dado: unknown): dado is Record<string, unknown> {
  return typeof dado === 'object' && dado !== null && !Array.isArray(dado)
}

function ehNumeroOuTextoNumerico(dado: unknown): dado is number | string {
  if (typeof dado === 'number') return Number.isFinite(dado)
  return typeof dado === 'string' && dado.trim() !== '' && Number.isFinite(Number(dado))
}

function ehStatusEstoque(dado: unknown): dado is StatusEstoque {
  return (
    dado === 'disponivel' || dado === 'reservado' || dado === 'vendido' || dado === 'em_manutencao'
  )
}

function validarLista<T>(
  dados: unknown,
  relatorio: string,
  validarItem: (dado: unknown) => dado is T,
): T[] {
  if (!Array.isArray(dados)) {
    throw new Error(`A resposta do relatório de ${relatorio} está em formato inesperado.`)
  }

  return dados.map((dado: unknown) => {
    if (!validarItem(dado)) {
      throw new Error(`A resposta do relatório de ${relatorio} está em formato inesperado.`)
    }
    return dado
  })
}

export async function obterRelatorioFaturamento(
  filtros: FiltrosRelatorio = {},
): Promise<RelatorioFaturamentoMensal[]> {
  const resposta = await api.get<unknown>('/relatorios/faturamento', {
    params: filtros,
  })

  return validarLista<RelatorioFaturamentoMensal>(
    resposta.data,
    'faturamento',
    (dado): dado is RelatorioFaturamentoMensal =>
      ehRegistro(dado) &&
      ehNumeroOuTextoNumerico(dado.ano) &&
      ehNumeroOuTextoNumerico(dado.mes) &&
      ehNumeroOuTextoNumerico(dado.quantidade_vendas) &&
      ehNumeroOuTextoNumerico(dado.faturamento_total),
  )
}

export async function obterRelatorioEstoque(): Promise<RelatorioEstoque[]> {
  const resposta = await api.get<unknown>('/relatorios/estoque')

  return validarLista<RelatorioEstoque>(
    resposta.data,
    'estoque',
    (dado): dado is RelatorioEstoque =>
      ehRegistro(dado) &&
      ehStatusEstoque(dado.status) &&
      typeof dado.quantidade_veiculos === 'number' &&
      Number.isFinite(dado.quantidade_veiculos) &&
      typeof dado.valor_total === 'number' &&
      Number.isFinite(dado.valor_total),
  )
}

export async function obterRelatorioDesempenho(
  filtros: FiltrosRelatorio = {},
): Promise<RelatorioDesempenhoVendedor[]> {
  const resposta = await api.get<unknown>('/relatorios/desempenho-vendedores', {
    params: filtros,
  })

  return validarLista<RelatorioDesempenhoVendedor>(
    resposta.data,
    'desempenho',
    (dado): dado is RelatorioDesempenhoVendedor =>
      ehRegistro(dado) &&
      ehNumeroOuTextoNumerico(dado.id_usuario) &&
      typeof dado.nome_usuario === 'string' &&
      ehNumeroOuTextoNumerico(dado.quantidade_vendas) &&
      ehNumeroOuTextoNumerico(dado.faturamento_total) &&
      ehNumeroOuTextoNumerico(dado.comissao_total),
  )
}
