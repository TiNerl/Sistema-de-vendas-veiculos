<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

function sair() {
  auth.limparSessao()
  router.push('/login')
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho">
      <a class="marca" href="/" aria-label="AutoSaller início">
        <span class="marca-icone" aria-hidden="true">A</span>
        <span>Auto<span class="marca-destaque">Saller</span></span>
      </a>
      <div class="cabecalho-acoes">
        <span class="cabecalho-legenda">GESTÃO DE ESTOQUE</span>
        <button class="botao-sair" type="button" @click="sair">Sair</button>
      </div>
    </header>
    <RouterView />
  </main>
</template>
