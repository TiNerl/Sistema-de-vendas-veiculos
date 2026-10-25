<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuAberto = ref(false)

const administrador = computed(() => auth.usuario?.perfil === 'admin')
const tituloPagina = computed(() => route.meta.titulo ?? 'AutoSaller')
const identificadorUsuario = computed(
  () => auth.usuario?.cpf ?? 'Usuário autenticado',
)
const perfilUsuario = computed(() =>
  auth.usuario?.perfil === 'admin' ? 'Administrador' : 'Vendedor',
)

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
        to="/dashboard"
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
        <span class="nav-label">Menu principal</span>
        <div class="sidebar-nav">
          <RouterLink
            class="sidebar-link"
            exact-active-class="sidebar-link--current"
            to="/dashboard"
            @click="menuAberto = false"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" />
            </svg>
            <span>Início</span>
          </RouterLink>
        </div>

        <template v-if="administrador">
          <span class="nav-label">Gestão de usuários</span>
          <div class="sidebar-nav nav-group">
            <RouterLink
              class="sidebar-link"
              exact-active-class="sidebar-link--current"
              to="/admin/usuarios"
              @click="menuAberto = false"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-4v6m3-3h-6" />
              </svg>
              <span>Lista de usuários</span>
            </RouterLink>
            <RouterLink
              class="sidebar-link"
              exact-active-class="sidebar-link--current"
              to="/admin/usuarios/cadastrar"
              @click="menuAberto = false"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 1 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11-3v8m4-4h-8" />
              </svg>
              <span>Cadastrar usuário</span>
            </RouterLink>
            <RouterLink
              class="sidebar-link"
              exact-active-class="sidebar-link--current"
              to="/admin/usuarios/inativar"
              @click="menuAberto = false"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm15-4H14" />
              </svg>
              <span>Inativar usuário</span>
            </RouterLink>
          </div>
        </template>
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
            <span class="topbar-context">AutoSaller / {{ tituloPagina }}</span>
          </div>
        </div>

        <div class="topbar-user">
          <div class="user-meta">
            <strong>{{ identificadorUsuario }}</strong>
            <span>{{ perfilUsuario }}</span>
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
