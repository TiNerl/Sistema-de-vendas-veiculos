import { reactive } from 'vue'

const sessao = reactive({
    token: '',
    perfil: '',
})

export function useAuthStore() {
    function definirSessao(token: string, perfil: string) {
        sessao.token = token
        sessao.perfil = perfil
    }

    function limparSessao() {
        sessao.token = ''
        sessao.perfil = ''
    }

    return {
        sessao,
        definirSessao,
        limparSessao,
    }
}