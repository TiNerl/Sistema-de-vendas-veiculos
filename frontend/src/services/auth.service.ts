
import { api } from './api'

export interface CredenciaisLogin {
  cpf: string
  senha: string
}

export interface RespostaLogin {
  accessToken: string
}

export type PerfilUsuario = 'admin' | 'vendedor'

export interface UsuarioAutenticado {
  id: number
  cpf: string
  perfil: PerfilUsuario
  nome?: string
}

export async function login(
  credenciais: CredenciaisLogin,
): Promise<RespostaLogin> {
  const resposta = await api.post<RespostaLogin>('/auth/login', credenciais)

  return resposta.data
}

export async function obterPerfil(): Promise<UsuarioAutenticado> {
  const resposta = await api.get<UsuarioAutenticado>('/auth/perfil')
  return resposta.data
}