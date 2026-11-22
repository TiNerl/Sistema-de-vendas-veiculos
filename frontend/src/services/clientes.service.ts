import { api } from '@/services/api'

export interface Cliente {
  id_cliente: number
  nome: string
  cpf: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  documento: string
  ativo: boolean
  data_criacao: string
  atualizado_em: string
}

export type NovoCliente = Pick<
  Cliente,
  'nome' | 'cpf' | 'email' | 'telefone' | 'endereco' | 'cidade' | 'estado' | 'cep' | 'documento'
>

export type AtualizacaoCliente = Partial<NovoCliente>

export async function listarClientes(busca?: string): Promise<Cliente[]> {
  const resposta = await api.get<Cliente[]>('/clientes', {
    params: busca ? { busca } : undefined,
  })
  return resposta.data
}

export async function buscarCliente(id: number): Promise<Cliente> {
  const resposta = await api.get<Cliente>(`/clientes/${id}`)
  return resposta.data
}

export async function cadastrarCliente(dados: NovoCliente): Promise<Cliente> {
  const resposta = await api.post<Cliente>('/clientes', dados)
  return resposta.data
}

export async function atualizarCliente(
  id: number,
  dados: AtualizacaoCliente,
): Promise<Cliente> {
  const resposta = await api.patch<Cliente>(`/clientes/${id}`, dados)
  return resposta.data
}

export async function inativarCliente(id: number): Promise<void> {
  await api.patch(`/clientes/${id}/inativar`)
}
