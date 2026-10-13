import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as realizarLogin } from '@/services/auth.service'
import type { CredenciaisLogin } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    sessionStorage.getItem('accessToken'),
  )

  const autenticado = ref(Boolean(token.value))
  const carregando = ref(false)
  const erro = ref<string | null>(null)

  async function entrar(credenciais: CredenciaisLogin) {
    carregando.value = true
    erro.value = null

    try {
      const resposta = await realizarLogin(credenciais)

      token.value = resposta.accessToken
      sessionStorage.setItem('accessToken', resposta.accessToken)
      autenticado.value = true
    } catch {
      erro.value = 'Usuário ou senha inválidos. Por favor, tente novamente.'
      throw new Error(erro.value)
    } finally {
      carregando.value = false
    }
  }

  function sair() {
    token.value = null
    autenticado.value = false
    sessionStorage.removeItem('accessToken')
  }

  return {
    token,
    autenticado,
    carregando,
    erro,
    entrar,
    sair,
  }
})