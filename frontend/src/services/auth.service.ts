
import { api } from './api'

export interface CredenciaisLogin {
  cpf: string
  senha: string
}

export interface RespostaLogin {
  accessToken: string
}

export async function login(
  credenciais: CredenciaisLogin,
): Promise<RespostaLogin> {
  const resposta = await api.post<RespostaLogin>(
    '/auth/login',
    credenciais,
  )

  return resposta.data
}