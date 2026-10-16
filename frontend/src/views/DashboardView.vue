<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const perfilNome = computed(() =>
  auth.usuario?.perfil === 'admin' ? 'administrador' : 'vendedor',
)
</script>

<template>
  <section>
    <div class="dashboard-welcome">
      <span class="eyebrow">PAINEL DE CONTROLE</span>
      <h1>Bem-vindo ao AutoSaller</h1>
      <p>
        Sua concessionária, organizada em um só lugar. Acesse as ferramentas disponíveis para seu
        perfil de {{ perfilNome }}.
      </p>
    </div>

    <div class="dashboard-links">
      <RouterLink
        v-if="auth.usuario?.perfil === 'admin'"
        class="dashboard-link"
        to="/admin/usuarios"
      >
        <strong>Lista de usuários</strong>
        <span>Consulte os usuários cadastrados e sua situação de acesso.</span>
      </RouterLink>
      <RouterLink
        v-if="auth.usuario?.perfil === 'admin'"
        class="dashboard-link"
        to="/admin/usuarios/cadastrar"
      >
        <strong>Cadastrar usuário</strong>
        <span>Adicione administradores ou vendedores à equipe.</span>
      </RouterLink>
      <RouterLink
        v-if="auth.usuario?.perfil === 'admin'"
        class="dashboard-link"
        to="/admin/usuarios/inativar"
      >
        <strong>Inativar usuário</strong>
        <span>Bloqueie o acesso sem apagar os registros relacionados.</span>
      </RouterLink>
      <div v-if="auth.usuario?.perfil !== 'admin'" class="dashboard-link">
        <strong>Acesso de vendedor</strong>
        <span>Seu perfil atual permite acessar as áreas disponibilizadas à equipe de vendas.</span>
      </div>
    </div>
  </section>
</template>
