import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  login as realizarLogin,
  obterPerfil,
} from '@/services/auth.service'
import type { CredenciaisLogin } from '@/services/auth.service'
import type { UsuarioAutenticado } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(sessionStorage.getItem('accessToken'))

  const autenticado = ref(Boolean(token.value))
  const usuario = ref<UsuarioAutenticado | null>(null)
  const carregando = ref(false)
  const erro = ref<string | null>(null)

  async function carregarPerfil() {
    if (!token.value) {
      autenticado.value = false
      usuario.value = null
      return false
    }

    const perfil = await obterPerfil()
    usuario.value = perfil
    autenticado.value = true
    return true
  }

  async function entrar(credenciais: CredenciaisLogin) {
    carregando.value = true
    erro.value = null

    try {
      const resposta = await realizarLogin(credenciais)
      token.value = resposta.accessToken
      sessionStorage.setItem('accessToken', resposta.accessToken)
      await carregarPerfil()
    } catch (error) {
      token.value = null
      usuario.value = null
      autenticado.value = false
      sessionStorage.removeItem('accessToken')

      if (isAxiosError(error)) {
        erro.value =
          error.response?.status === 401
            ? 'CPF ou senha inválidos. Verifique seus dados e tente novamente.'
            : 'Não foi possível concluir o acesso. Tente novamente.'
      } else {
        erro.value = 'Não foi possível concluir o acesso. Tente novamente.'
      }
      throw error
    } finally {
      carregando.value = false
    }
  }

  function sair() {
    token.value = null
    autenticado.value = false
    usuario.value = null
    sessionStorage.removeItem('accessToken')
  }

  return {
    token,
    autenticado,
    usuario,
    carregando,
    erro,
    entrar,
    sair,
    carregarPerfil,
  }
})
