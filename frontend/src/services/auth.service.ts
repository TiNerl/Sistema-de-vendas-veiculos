import { requisitar } from './api'

export type Usuario = {
    perfil: string
}

type RespostaLogin = {
    accessToken: string
}

export function fazerLogin(cpf: string, senha: string): Promise<RespostaLogin> {
    return requisitar<RespostaLogin>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha }),
    })
}

export function consultarPerfil(token: string): Promise<Usuario> {
    return requisitar<Usuario>('/auth/perfil', {}, token)
}