<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ÁREA DO VENDEDOR</span>
        <h1>{{ route.meta.titulo }}</h1>
        <p>Este módulo ainda não está disponível.</p>
      </div>
    </div>

    <div class="card seller-module-notice">
      <strong>Em breve</strong>
      <p>
        A navegação está pronta. As funcionalidades deste módulo serão disponibilizadas em uma
        próxima etapa.
      </p>
      <RouterLink class="button button--secondary" to="/vendedor">
        Voltar ao início
      </RouterLink>
    </div>
  </section>
</template>
