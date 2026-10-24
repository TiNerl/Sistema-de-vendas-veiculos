const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function mensagemDeErro(dados: unknown, fallback: string): string {
    if (typeof dados === 'object' && dados !== null && 'message' in dados) {
        const detalhe = (dados as { message: unknown }).message
        if (typeof detalhe === 'string') return detalhe
        if (Array.isArray(detalhe)) return detalhe.join('. ')
    }
    return fallback
}

export async function requisitar<T>(
    caminho: string,
    opcoes: RequestInit = {},
    token?: string,
): Promise<T> {
    const headers = new Headers(opcoes.headers)

    if (opcoes.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const resposta = await fetch(`${apiUrl}${caminho}`, {
        ...opcoes,
        headers,
    })

    const dados: unknown = await resposta.json().catch(() => null)

    if (!resposta.ok) {
        throw new Error(mensagemDeErro(dados, 'Não foi possível concluir a solicitação.'))
    }

    return dados as T
}