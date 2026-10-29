import { api } from '@/services/api'

export type FormaPagamento = 'a_vista' | 'pix' | 'financiamento' | 'consorcio'

export interface NovaVenda {
  id_cliente: number
  id_veiculo: number
  forma_pagamento: FormaPagamento
  percentual_desconto?: number
}

export interface VendaRegistrada {
  id_venda: number
  valor_veiculo: string | number
  percentual_desconto: string | number | null
  valor_desconto: string | number | null
  valor_final: string | number
  forma_pagamento: FormaPagamento
  percentual_comissao: string | number | null
  valor_comissao: string | number | null
  status: 'pendente' | 'concluida'
  data_venda: string
  cliente?: { id_cliente: number; nome: string }
  veiculo?: { id_veiculo: number; marca: string; modelo: string; versao: string; placa: string }
  usuario?: { id_usuario: number; nome: string }
}

export async function cadastrarVenda(dados: NovaVenda): Promise<VendaRegistrada> {
  const resposta = await api.post<VendaRegistrada>('/vendas', dados)
  return resposta.data
}
