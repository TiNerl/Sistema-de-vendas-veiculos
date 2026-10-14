import { api } from '@/services/api'
import type { PerfilUsuario } from '@/services/auth.service'

export interface Usuario {
  id_usuario: number
  nome: string
  cpf: string
  perfil: PerfilUsuario
  ativo: boolean
}

export interface NovoUsuario {
  nome: string
  cpf: string
  senha: string
  perfil: PerfilUsuario
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const resposta = await api.get<Usuario[]>('/usuarios')
  return resposta.data
}

export async function cadastrarUsuario(dados: NovoUsuario): Promise<Usuario> {
  const resposta = await api.post<Usuario>('/usuarios', dados)
  return resposta.data
}

export async function inativarUsuario(id: number, cpf: string): Promise<Usuario> {
  const resposta = await api.patch<Usuario>(`/usuarios/${id}/inativar`, { cpf })
  return resposta.data
}

export function mensagemErroApi(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    const message = error.response.data.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }

  return fallback
}
