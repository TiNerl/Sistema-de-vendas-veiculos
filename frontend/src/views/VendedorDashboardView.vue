<script setup lang="ts">
const atalhos = [
  {
    titulo: 'Clientes',
    descricao: 'Consulte e acompanhe os clientes da concessionária.',
    destino: '/vendedor/clientes',
    acao: 'Consultar clientes',
  },
  {
    titulo: 'Veículos disponíveis',
    descricao: 'Acesse a área de veículos e consulte o estoque.',
    destino: '/vendedor/veiculos',
    acao: 'Consultar veículos',
  },
  {
    titulo: 'Vendas',
    descricao: 'Acesse as funcionalidades relacionadas às vendas.',
    destino: '/vendedor/vendas',
    acao: 'Acessar vendas',
  },
]
</script>

<template>
  <section>
    <div class="dashboard-welcome">
      <span class="eyebrow">ÁREA DO VENDEDOR</span>
      <h1>Bem-vindo ao AutoSeller</h1>
      <p>
        Organize seu atendimento e encontre rapidamente as ferramentas para acompanhar clientes,
        veículos e vendas.
      </p>
    </div>

    <div class="seller-shortcuts" aria-label="Atalhos do vendedor">
      <RouterLink
        v-for="atalho in atalhos"
        :key="atalho.destino"
        class="dashboard-link seller-shortcut"
        :to="atalho.destino"
      >
        <strong>{{ atalho.titulo }}</strong>
        <span>{{ atalho.descricao }}</span>
        <span class="seller-shortcut-action">
          {{ atalho.acao }}
          <span aria-hidden="true">→</span>
        </span>
      </RouterLink>
    </div>

    <p class="seller-guidance">
      Selecione uma opção para começar. Os dados e operações estarão disponíveis conforme os
      módulos forem habilitados.
    </p>
  </section>
</template>
