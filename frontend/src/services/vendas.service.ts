import { api } from '@/services/api'

export type FormaPagamento = 'a_vista' | 'pix' | 'financiamento' | 'consorcio'

export interface FiltrosVenda {
  cliente_id?: number
  dataInicio?: string
  dataFim?: string
}

export interface NovaVenda {
  id_cliente: number
  id_veiculo: number
  id_usuario_responsavel?: number
  forma_pagamento: FormaPagamento
  percentual_desconto?: number
}

export interface VendaRegistrada {
  id_venda: number
  valor_veiculo: string | number
  percentual_desconto: string | number | null
  valor_desconto: string | number | null
  valor_final: string | number
  forma_pagamento: FormaPagamento | null
  percentual_comissao: string | number | null
  valor_comissao: string | number | null
  status: 'pendente' | 'concluida' | 'cancelada'
  data_venda: string
  cliente?: { id_cliente: number; nome: string; cpf?: string }
  veiculo?: { id_veiculo: number; marca: string; modelo: string; versao: string; placa: string }
  usuario?: { id_usuario: number; nome: string }
  registrado_por?: { id_usuario: number; nome: string } | null
}

export async function cadastrarVenda(dados: NovaVenda): Promise<VendaRegistrada> {
  const resposta = await api.post<VendaRegistrada>('/vendas', dados)
  return resposta.data
}

export async function listarVendas(filtros?: FiltrosVenda): Promise<VendaRegistrada[]> {
  const resposta = await api.get<VendaRegistrada[]>('/vendas', {
    params: filtros,
  })
  return resposta.data
}

export async function aprovarVenda(id: number): Promise<VendaRegistrada> {
  const resposta = await api.patch<VendaRegistrada>(`/vendas/${id}/aprovar`)
  return resposta.data
}

export async function rejeitarVenda(id: number): Promise<VendaRegistrada> {
  const resposta = await api.patch<VendaRegistrada>(`/vendas/${id}/rejeitar`)
  return resposta.data
}