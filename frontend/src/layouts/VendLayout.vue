<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuAberto = ref(false)

const tituloPagina = computed(() => route.meta.titulo ?? 'AutoSaller')
const identificadorUsuario = computed(
  () => auth.usuario?.nome ?? auth.usuario?.cpf ?? 'Usuário autenticado',
)

const itensNavegacao = [
  {
    label: 'Clientes',
    to: '/vendedor/clientes',
    icon: 'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-2v6m3-3h-6',
  },
  {
    label: 'Veículos / estoque',
    to: '/vendedor/veiculos',
    icon: 'M3 13l2-6h14l2 6v6h-3v-2H6v2H3v-6Zm2 0h14M7 16h.1M17 16h.1',
  },
  {
    label: 'Vendas',
    to: '/vendedor/vendas',
    icon: 'M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6',
  },
  {
    label: 'Test drives',
    to: '/vendedor/test-drives',
    icon: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    label: 'Relatórios',
    to: '/vendedor/relatorios',
    icon: 'M7 3h10l4 4v14H3V3h4Zm5 6v8m-4-4h8',
  },
]

async function sair() {
  auth.sair()
  menuAberto.value = false
  await router.replace({ name: 'login' })
}
</script>

<template>
  <div class="admin-layout">
    <button
      v-if="menuAberto"
      class="mobile-backdrop"
      type="button"
      aria-label="Fechar menu"
      @click="menuAberto = false"
    ></button>

    <aside class="sidebar" :class="{ 'sidebar--open': menuAberto }">
      <RouterLink
        class="sidebar-brand"
        to="/vendedor"
        aria-label="AutoSaller, ir para início"
        @click="menuAberto = false"
      >
        <span class="sidebar-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M8 31.5 12.4 19a4 4 0 0 1 3.8-2.7h15.6a4 4 0 0 1 3.8 2.7L40 31.5v7h-4v-4H12v4H8v-7Z" />
            <path d="M13 27h22m-19-15 8-5 8 5" />
          </svg>
        </span>
        <span>AutoSaller</span>
      </RouterLink>

      <nav aria-label="Navegação principal">
        <span class="nav-label">Área do vendedor</span>
        <div class="sidebar-nav">
          <RouterLink
            class="sidebar-link seller-home-link"
            exact-active-class="sidebar-link--current"
            to="/vendedor"
            @click="menuAberto = false"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" />
            </svg>
            <span>Início</span>
          </RouterLink>
          <RouterLink
            v-for="item in itensNavegacao"
            :key="item.to"
            class="sidebar-link"
            exact-active-class="sidebar-link--current"
            :to="item.to"
            @click="menuAberto = false"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="item.icon" />
            </svg>
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">Gestão segura da sua concessionária</div>
    </aside>

    <div class="admin-main">
      <header class="topbar">
        <div class="topbar-leading">
          <button
            class="icon-button mobile-menu-toggle"
            type="button"
            :aria-expanded="menuAberto"
            aria-label="Abrir menu de navegação"
            @click="menuAberto = !menuAberto"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 class="topbar-title">{{ tituloPagina }}</h1>
            <span class="topbar-context">AutoSaller / Área do vendedor</span>
          </div>
        </div>

        <div class="topbar-user">
          <div class="user-meta">
            <strong>{{ identificadorUsuario }}</strong>
            <span>Vendedor</span>
          </div>
          <button class="signout-button" type="button" @click="sair">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
