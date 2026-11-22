<script setup lang="ts">
const atalhos = [
  {
    titulo: 'Clientes',
    descricao: 'Consulte e acompanhe os clientes da concessionária.',
    destino: '/vendedor/clientes',
    acao: 'Consultar clientes',
    icone:
      'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-2v6m3-3h-6',
  },
  {
    titulo: 'Veículos disponíveis',
    descricao: 'Acesse a área de veículos e consulte o estoque.',
    destino: '/vendedor/veiculos',
    acao: 'Consultar veículos',
    icone: 'M3 13l2-6h14l2 6v6h-3v-2H6v2H3v-6Zm2 0h14M7 16h.1M17 16h.1',
  },
  {
    titulo: 'Registrar venda',
    descricao: 'Registre uma venda e acompanhe o processo de atendimento.',
    destino: '/vendedor/vendas',
    acao: 'Registrar venda',
    icone: 'M12 4v16m8-8H4',
  },
  {
    titulo: 'Histórico de vendas',
    descricao: 'Consulte as vendas realizadas por você.',
    destino: '/vendedor/vendas/historico',
    acao: 'Consultar histórico',
    icone: 'M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6',
  },
  {
    titulo: 'Minhas solicitações',
    descricao: 'Acompanhe as solicitações de desconto enviadas para aprovação.',
    destino: '/vendedor/descontos',
    acao: 'Acompanhar solicitações',
    icone: 'M12 3v18m6-14H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',
  },
  {
    titulo: 'Relatórios',
    descricao: 'Consulte os relatórios disponíveis para o seu perfil.',
    destino: '/vendedor/relatorios',
    acao: 'Consultar relatórios',
    icone: 'M7 3h10l4 4v14H3V3h4Zm5 6v8m-4-4h8',
  },
]
</script>

<template>
  <section>
    <div class="dashboard-welcome">
      <span class="eyebrow">ÁREA DO VENDEDOR</span>
      <h1>Bem-vindo ao AutoSeller</h1>
      <p>
        Organize seu atendimento e acesse rapidamente clientes, veículos, vendas, solicitações e
        relatórios.
      </p>
    </div>

    <div class="seller-shortcuts" aria-label="Atalhos do vendedor">
      <RouterLink
        v-for="atalho in atalhos"
        :key="atalho.destino"
        class="dashboard-link dashboard-shortcut seller-shortcut"
        :to="atalho.destino"
      >
        <div class="dashboard-shortcut-heading">
          <span class="dashboard-shortcut-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path :d="atalho.icone" />
            </svg>
          </span>
          <strong>{{ atalho.titulo }}</strong>
        </div>
        <span>{{ atalho.descricao }}</span>
        <span class="dashboard-shortcut-action">
          {{ atalho.acao }}
          <span aria-hidden="true">→</span>
        </span>
      </RouterLink>
    </div>

    <p class="seller-guidance">
      Selecione uma opção para acessar as ferramentas disponíveis para o seu perfil.
    </p>
  </section>
</template>
