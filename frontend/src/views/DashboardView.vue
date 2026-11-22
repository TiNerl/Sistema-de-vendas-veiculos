<script setup lang="ts">
const atalhos = [
  {
    titulo: 'Estoque de veículos',
    descricao: 'Consulte o estoque, cadastre veículos e mantenha os dados atualizados.',
    destino: '/admin/veiculos',
    acao: 'Gerenciar estoque',
    icone: 'M3 13l2-6h14l2 6v6h-3v-2H6v2H3v-6Zm2 0h14M7 16h.1M17 16h.1',
  },
  {
    titulo: 'Clientes',
    descricao: 'Consulte os clientes cadastrados e gerencie seus dados.',
    destino: '/admin/clientes',
    acao: 'Gerenciar clientes',
    icone:
      'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-2v6m3-3h-6',
  },
  {
    titulo: 'Histórico de vendas',
    descricao: 'Acompanhe as vendas realizadas pela concessionária.',
    destino: '/admin/vendas',
    acao: 'Consultar vendas',
    icone: 'M4 19V5m0 14h16M8 15v-4m4 4V7m4 8v-6',
  },
  {
    titulo: 'Aprovação de descontos',
    descricao: 'Analise e gerencie as solicitações de desconto dos vendedores.',
    destino: '/admin/descontos',
    acao: 'Analisar solicitações',
    icone: 'M12 3v18m6-14H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',
  },
  {
    titulo: 'Relatórios',
    descricao: 'Acesse os relatórios de faturamento, estoque e desempenho.',
    destino: '/admin/relatorios',
    acao: 'Consultar relatórios',
    icone: 'M7 3h10l4 4v14H3V3h4Zm5 6v8m-4-4h8',
  },
  {
    titulo: 'Lista de usuários',
    descricao: 'Consulte os usuários cadastrados e sua situação de acesso.',
    destino: '/admin/usuarios',
    acao: 'Consultar usuários',
    icone:
      'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  },
]
</script>

<template>
  <section>
    <div class="dashboard-welcome">
      <span class="eyebrow">PAINEL DE CONTROLE</span>
      <h1>Bem-vindo ao AutoSeller</h1>
      <p>
        Sua concessionária, organizada em um só lugar. Acesse as ferramentas disponíveis para
        administrar as operações.
      </p>
    </div>

    <div class="dashboard-links admin-shortcuts" aria-label="Atalhos do administrador">
      <RouterLink
        v-for="atalho in atalhos"
        :key="atalho.destino"
        class="dashboard-link dashboard-shortcut"
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
  </section>
</template>
