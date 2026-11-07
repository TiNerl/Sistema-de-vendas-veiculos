/**
 * Utilitário para montar uma view com Pinia, Vue Router em memória e um
 * usuário autenticado opcional — o mínimo necessário para renderizar as telas.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { PerfilUsuario } from '@/services/auth.service'

const vazio = { template: '<div class="pagina-destino" />' }

export interface OpcoesMontagem {
  /** Caminho inicial (ex.: '/admin/veiculos?veiculoSalvo=cadastrado'). */
  caminho: string
  /** Padrão de rota que renderiza o componente (ex.: '/admin/veiculos/:id/editar'). */
  padrao?: string
  /** Perfil do usuário autenticado; `null` = ninguém autenticado. */
  perfil?: PerfilUsuario | null
}

export async function montar(componente: Component, opcoes: OpcoesMontagem) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const auth = useAuthStore()
  if (opcoes.perfil) {
    auth.token = 'token-de-teste'
    auth.autenticado = true
    auth.usuario = {
      id: opcoes.perfil === 'admin' ? 1 : 2,
      cpf: opcoes.perfil === 'admin' ? '11144477735' : '52998224725',
      perfil: opcoes.perfil,
      nome: opcoes.perfil === 'admin' ? 'Admin Teste' : 'Vendedora Teste',
    }
  }

  const caminhoSemQuery = opcoes.caminho.split('?')[0] ?? '/'
  const rotas: RouteRecordRaw[] = [
    { path: opcoes.padrao ?? caminhoSemQuery, component: componente },
    { path: '/:pathMatch(.*)*', component: vazio },
  ]
  const router = createRouter({ history: createMemoryHistory(), routes: rotas })
  await router.push(opcoes.caminho)
  await router.isReady()

  const wrapper = mount(componente, { global: { plugins: [pinia, router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router, auth }
}

/** Erro no formato do Axios, como o backend NestJS devolve. */
export function erroApi(status: number, message: string | string[]) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data: { statusCode: status, message } },
  })
}
