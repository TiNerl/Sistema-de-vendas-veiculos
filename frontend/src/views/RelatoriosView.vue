<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import {
  obterRelatorioDesempenho,
  obterRelatorioEstoque,
  obterRelatorioFaturamento,
} from '@/services/relatorios.service'
import type {
  FiltrosRelatorio,
  RelatorioDesempenhoVendedor,
  RelatorioEstoque,
  RelatorioFaturamentoMensal,
  StatusEstoque,
} from '@/services/relatorios.service'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const faturamento = ref<RelatorioFaturamentoMensal[]>([])
const estoque = ref<RelatorioEstoque[]>([])
const desempenho = ref<RelatorioDesempenhoVendedor[]>([])
const dataInicio = ref('')
const dataFim = ref('')
const erroDatas = ref('')
const erroFaturamento = ref('')
const erroEstoque = ref('')
const erroDesempenho = ref('')
const carregandoFaturamento = ref(false)
const carregandoEstoque = ref(false)
const carregandoDesempenho = ref(false)
const carregandoPeriodo = computed(() => carregandoFaturamento.value || carregandoDesempenho.value)

const rotulosStatus: Record<StatusEstoque, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  em_manutencao: 'Em manutenção',
}

function moeda(valor: number | string | undefined): string {
  if (valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero)
}

function numero(valor: number | string | undefined): string {
  if (valor === undefined || valor === '') return '—'
  const numeroConvertido = Number(valor)
  if (!Number.isFinite(numeroConvertido)) return '—'
  return new Intl.NumberFormat('pt-BR').format(numeroConvertido)
}

function mesAno(relatorio: RelatorioFaturamentoMensal): string {
  const mes = Number(relatorio.mes)
  const ano = Number(relatorio.ano)
  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano)) {
    return 'Período não informado'
  }
  return `${String(mes).padStart(2, '0')}/${ano}`
}

function mensagemErro(error: unknown, relatorio: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(' ')
  }
  if (error instanceof Error && error.message) return error.message
  return `Não foi possível carregar o relatório de ${relatorio}. Tente novamente.`
}

async function buscarFaturamento(filtros: FiltrosRelatorio = {}) {
  carregandoFaturamento.value = true
  erroFaturamento.value = ''
  try {
    faturamento.value = await obterRelatorioFaturamento(filtros)
  } catch (error) {
    faturamento.value = []
    erroFaturamento.value = mensagemErro(error, 'faturamento')
  } finally {
    carregandoFaturamento.value = false
  }
}

async function buscarEstoque() {
  carregandoEstoque.value = true
  erroEstoque.value = ''
  try {
    estoque.value = await obterRelatorioEstoque()
  } catch (error) {
    estoque.value = []
    erroEstoque.value = mensagemErro(error, 'estoque')
  } finally {
    carregandoEstoque.value = false
  }
}

async function buscarDesempenho(filtros: FiltrosRelatorio = {}) {
  carregandoDesempenho.value = true
  erroDesempenho.value = ''
  try {
    desempenho.value = await obterRelatorioDesempenho(filtros)
  } catch (error) {
    desempenho.value = []
    erroDesempenho.value = mensagemErro(error, 'desempenho')
  } finally {
    carregandoDesempenho.value = false
  }
}

function filtrosSelecionados(): FiltrosRelatorio {
  return {
    ...(dataInicio.value ? { dataInicio: dataInicio.value } : {}),
    ...(dataFim.value ? { dataFim: dataFim.value } : {}),
  }
}

async function atualizarRelatorios() {
  erroDatas.value = ''
  if (dataInicio.value && dataFim.value && dataInicio.value > dataFim.value) {
    erroDatas.value = 'A data inicial não pode ser posterior à data final.'
    return
  }

  const filtros = filtrosSelecionados()
  await Promise.all([buscarFaturamento(filtros), buscarDesempenho(filtros)])
}

async function limparFiltros() {
  dataInicio.value = ''
  dataFim.value = ''
  erroDatas.value = ''
  await atualizarRelatorios()
}

onMounted(() => {
  void Promise.all([buscarFaturamento(), buscarEstoque(), buscarDesempenho()])
})
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">{{
          auth.usuario?.perfil === 'admin' ? 'MÓDULO DE GESTÃO' : 'ÁREA DO VENDEDOR'
        }}</span>
        <h1>Relatórios</h1>
        <p>Consulte faturamento, posição de estoque e desempenho de vendas.</p>
      </div>
    </div>

    <div class="card reports-filter-card">
      <h2>Período dos relatórios</h2>
      <p class="reports-filter-description">
        O período se aplica ao faturamento e ao desempenho. A posição de estoque não possui filtro
        por período na API.
      </p>
      <form class="reports-filters" @submit.prevent="atualizarRelatorios">
        <div class="field">
          <label for="relatorio-data-inicio">Data inicial</label>
          <input
            id="relatorio-data-inicio"
            v-model="dataInicio"
            type="date"
            :max="dataFim || undefined"
            :aria-invalid="Boolean(erroDatas)"
            aria-describedby="relatorio-erro-datas"
          />
        </div>
        <div class="field">
          <label for="relatorio-data-fim">Data final</label>
          <input
            id="relatorio-data-fim"
            v-model="dataFim"
            type="date"
            :min="dataInicio || undefined"
            :aria-invalid="Boolean(erroDatas)"
            aria-describedby="relatorio-erro-datas"
          />
        </div>
        <div class="reports-filter-actions">
          <button class="button button--gold" type="submit" :disabled="carregandoPeriodo">
            {{ carregandoPeriodo ? 'Atualizando...' : 'Atualizar relatórios' }}
          </button>
          <button
            class="button button--secondary"
            type="button"
            :disabled="carregandoPeriodo"
            @click="limparFiltros"
          >
            Limpar
          </button>
        </div>
      </form>
      <p v-if="erroDatas" id="relatorio-erro-datas" class="field-error" role="alert">
        {{ erroDatas }}
      </p>
    </div>

    <div class="reports-grid">
      <section class="card report-card report-card--wide" aria-labelledby="relatorio-faturamento">
        <div class="report-heading">
          <div>
            <span class="eyebrow">VENDAS CONCLUÍDAS</span>
            <h2 id="relatorio-faturamento">Faturamento</h2>
          </div>
        </div>
        <p v-if="erroFaturamento" class="alert alert--error" role="alert">
          {{ erroFaturamento }}
        </p>
        <p v-else-if="carregandoFaturamento" class="loading-state" role="status">
          Carregando faturamento...
        </p>
        <p v-else-if="faturamento.length === 0" class="empty-state">
          Nenhum dado de faturamento encontrado para o período.
        </p>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Vendas</th>
                <th scope="col">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(linha, indice) in faturamento"
                :key="`${linha.ano}-${linha.mes}-${indice}`"
              >
                <td>{{ mesAno(linha) }}</td>
                <td>{{ numero(linha.quantidade_vendas) }}</td>
                <td>
                  <strong>{{ moeda(linha.faturamento_total) }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card report-card report-card--wide" aria-labelledby="relatorio-desempenho">
        <div class="report-heading">
          <div>
            <span class="eyebrow">RESULTADOS DA EQUIPE</span>
            <h2 id="relatorio-desempenho">Desempenho por vendedor</h2>
          </div>
        </div>
        <p v-if="erroDesempenho" class="alert alert--error" role="alert">
          {{ erroDesempenho }}
        </p>
        <p v-else-if="carregandoDesempenho" class="loading-state" role="status">
          Carregando desempenho...
        </p>
        <p v-else-if="desempenho.length === 0" class="empty-state">
          Nenhum dado de desempenho encontrado para o período.
        </p>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Vendedor</th>
                <th scope="col">Vendas</th>
                <th scope="col">Faturamento</th>
                <th scope="col">Comissão</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vendedor in desempenho" :key="vendedor.id_usuario">
                <td>{{ vendedor.nome_usuario }}</td>
                <td>{{ numero(vendedor.quantidade_vendas) }}</td>
                <td>
                  <strong>{{ moeda(vendedor.faturamento_total) }}</strong>
                </td>
                <td>{{ moeda(vendedor.comissao_total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card report-card" aria-labelledby="relatorio-estoque">
        <div class="report-heading">
          <div>
            <span class="eyebrow">POSIÇÃO ATUAL</span>
            <h2 id="relatorio-estoque">Estoque</h2>
          </div>
        </div>
        <p v-if="erroEstoque" class="alert alert--error" role="alert">{{ erroEstoque }}</p>
        <p v-else-if="carregandoEstoque" class="loading-state" role="status">
          Carregando posição de estoque...
        </p>
        <p v-else-if="estoque.length === 0" class="empty-state">
          Nenhum dado de estoque foi retornado.
        </p>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Situação</th>
                <th scope="col">Veículos</th>
                <th scope="col">Valor total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="linha in estoque" :key="linha.status">
                <td>{{ rotulosStatus[linha.status] ?? linha.status }}</td>
                <td>{{ numero(linha.quantidade_veiculos) }}</td>
                <td>{{ moeda(linha.valor_total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.reports-filter-card {
  margin-bottom: var(--space-6);
}

.reports-filter-card h2,
.report-heading h2 {
  margin: 0;
  font-size: 1.1rem;
}

.reports-filter-description {
  margin: 7px 0 18px;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.reports-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr)) auto;
  align-items: end;
  gap: var(--space-4);
}

.reports-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.reports-filter-card .field-error {
  margin: var(--space-3) 0 0;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: var(--space-5);
}

.report-card {
  min-width: 0;
}

.report-card--wide {
  grid-column: span 2;
}

.report-heading {
  margin-bottom: var(--space-4);
}

.report-heading .eyebrow {
  display: block;
  margin-bottom: 5px;
}

.report-card .alert {
  margin: 0;
}

.report-card .empty-state,
.report-card .loading-state {
  padding: 22px 10px;
}

@media (max-width: 900px) {
  .reports-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reports-filter-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .reports-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .report-card--wide {
    grid-column: auto;
  }

  .reports-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .reports-filter-actions {
    grid-column: auto;
  }

  .reports-filter-actions .button {
    flex: 1;
  }

  .report-card {
    padding: 18px;
  }
}
</style>
