<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import {
  exportarRelatorioDesempenhoCsv,
  exportarRelatorioEstoqueCsv,
  exportarRelatorioFaturamentoCsv,
  obterRelatorioDesempenho,
  obterRelatorioEstoque,
  obterRelatorioFaturamento,
} from '@/services/relatorios.service'
import type {
  FiltrosRelatorio,
  FiltrosRelatorioDesempenho,
  RelatorioDesempenhoVendedor,
  RelatorioEstoque,
  RelatorioFaturamentoMensal,
  StatusEstoque,
} from '@/services/relatorios.service'
import { listarUsuarios } from '@/services/usuarios.service'
import type { Usuario } from '@/services/usuarios.service'
import { useAuthStore } from '@/stores/auth'

type TipoRelatorio = 'faturamento' | 'estoque' | 'desempenho'
type FormatoExportacao = 'pdf' | 'csv'

const auth = useAuthStore()
const faturamento = ref<RelatorioFaturamentoMensal[]>([])
const estoque = ref<RelatorioEstoque[]>([])
const desempenho = ref<RelatorioDesempenhoVendedor[]>([])
const vendedores = ref<Usuario[]>([])
const idVendedorSelecionado = ref<number | ''>('')
const relatorioSelecionado = ref<TipoRelatorio>('faturamento')
const dataInicio = ref('')
const dataFim = ref('')
const filtrosExibidos = ref<FiltrosRelatorio>({})
const erroDatas = ref('')
const erroFaturamento = ref('')
const erroEstoque = ref('')
const erroDesempenho = ref('')
const erroVendedores = ref('')
const erroExportacao = ref('')
const sucessoExportacao = ref('')
const exportando = ref<FormatoExportacao | null>(null)
const carregandoFaturamento = ref(false)
const carregandoEstoque = ref(false)
const carregandoDesempenho = ref(false)
const carregandoVendedores = ref(false)
let requisicaoDesempenho = 0
const vendedorSelecionado = computed(() =>
  vendedores.value.find((vendedor) => vendedor.id_usuario === idVendedorSelecionado.value),
)
const mensagemVaziaDesempenho = computed(() =>
  vendedorSelecionado.value
    ? `Nenhum dado de desempenho encontrado para ${vendedorSelecionado.value.nome} no período.`
    : 'Nenhum dado de desempenho encontrado para o período.',
)
const carregandoPeriodo = computed(() => carregandoFaturamento.value || carregandoDesempenho.value)
const carregandoSelecionado = computed(() => {
  if (relatorioSelecionado.value === 'faturamento') return carregandoFaturamento.value
  if (relatorioSelecionado.value === 'estoque') return carregandoEstoque.value
  return carregandoDesempenho.value
})
const erroSelecionado = computed(() => {
  if (relatorioSelecionado.value === 'faturamento') return erroFaturamento.value
  if (relatorioSelecionado.value === 'estoque') return erroEstoque.value
  return erroDesempenho.value
})
const quantidadeSelecionada = computed(() => {
  if (relatorioSelecionado.value === 'faturamento') return faturamento.value.length
  if (relatorioSelecionado.value === 'estoque') return estoque.value.length
  return desempenho.value.length
})
const podeExportar = computed(
  () =>
    !carregandoSelecionado.value &&
    !erroSelecionado.value &&
    quantidadeSelecionada.value > 0 &&
    exportando.value === null,
)

const titulosRelatorio: Record<TipoRelatorio, string> = {
  faturamento: 'Faturamento',
  estoque: 'Posição de estoque',
  desempenho: 'Desempenho por vendedor',
}

function filtrosDesempenhoSelecionados(
  filtros: FiltrosRelatorio = filtrosSelecionados(),
): FiltrosRelatorioDesempenho {
  return {
    ...filtros,
    ...(auth.usuario?.perfil === 'admin' && idVendedorSelecionado.value !== ''
      ? { id_usuario: idVendedorSelecionado.value }
      : {}),
  }
}

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

async function buscarVendedores() {
  carregandoVendedores.value = true
  erroVendedores.value = ''
  try {
    vendedores.value = (await listarUsuarios()).filter(
      (usuario) => usuario.perfil === 'vendedor' && usuario.ativo,
    )
  } catch (error) {
    vendedores.value = []
    erroVendedores.value = mensagemErro(error, 'vendedores')
  } finally {
    carregandoVendedores.value = false
  }
}

async function buscarDesempenho(filtros: FiltrosRelatorioDesempenho = {}) {
  const requisicaoAtual = ++requisicaoDesempenho
  carregandoDesempenho.value = true
  erroDesempenho.value = ''
  desempenho.value = []
  try {
    const resultado = await obterRelatorioDesempenho(filtros)
    if (requisicaoAtual === requisicaoDesempenho) desempenho.value = resultado
  } catch (error) {
    if (requisicaoAtual === requisicaoDesempenho) {
      desempenho.value = []
      erroDesempenho.value = mensagemErro(error, 'desempenho')
    }
  } finally {
    if (requisicaoAtual === requisicaoDesempenho) carregandoDesempenho.value = false
  }
}

function filtrosSelecionados(): FiltrosRelatorio {
  return {
    ...(dataInicio.value ? { dataInicio: dataInicio.value } : {}),
    ...(dataFim.value ? { dataFim: dataFim.value } : {}),
  }
}

function periodoConsultado(): string {
  if (relatorioSelecionado.value === 'estoque') {
    return 'Posição atual (a API não aplica filtro de período ao estoque)'
  }
  if (!filtrosExibidos.value.dataInicio && !filtrosExibidos.value.dataFim) {
    return 'Todo o período disponível'
  }
  return `${filtrosExibidos.value.dataInicio || 'Sem data inicial'} a ${filtrosExibidos.value.dataFim || 'Sem data final'}`
}

function mensagemDaResposta(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('message' in data)) return
  const message = data.message
  if (typeof message === 'string') return message
  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
    return message.join(' ')
  }
}

async function mensagemErroExportacao(error: unknown): Promise<string> {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data instanceof Blob) {
      const texto = await data.text()
      if (texto) {
        try {
          const mensagem = mensagemDaResposta(JSON.parse(texto))
          if (mensagem) return mensagem
        } catch {
          // Use the HTTP status when an error response is not JSON.
        }
      }
    } else {
      const mensagem = mensagemDaResposta(data)
      if (mensagem) return mensagem
    }

    if (!error.response) {
      return 'Falha na comunicação com o servidor durante a exportação. Verifique sua conexão e tente novamente.'
    }
    return `Não foi possível exportar o relatório (HTTP ${error.response.status}). Tente novamente.`
  }

  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível baixar o arquivo CSV. Tente novamente.'
}

function selecionarRelatorio(tipo: TipoRelatorio) {
  relatorioSelecionado.value = tipo
  erroExportacao.value = ''
  sucessoExportacao.value = ''
}

async function exportarCsv() {
  if (!podeExportar.value) return

  exportando.value = 'csv'
  erroExportacao.value = ''
  sucessoExportacao.value = ''
  let url: string | undefined
  let link: HTMLAnchorElement | undefined
  let downloadIniciado = false

  try {
    const exportadores = {
      faturamento: () => exportarRelatorioFaturamentoCsv(filtrosExibidos.value),
      estoque: exportarRelatorioEstoqueCsv,
      desempenho: () =>
        exportarRelatorioDesempenhoCsv(filtrosDesempenhoSelecionados(filtrosExibidos.value)),
    }
    const { arquivo, nomeArquivo } = await exportadores[relatorioSelecionado.value]()
    url = URL.createObjectURL(arquivo)
    link = document.createElement('a')
    link.href = url
    link.download = nomeArquivo
    document.body.append(link)
    link.click()
    downloadIniciado = true
    sucessoExportacao.value = 'O download do relatório CSV foi iniciado.'
  } catch (error) {
    if (url) URL.revokeObjectURL(url)
    erroExportacao.value = await mensagemErroExportacao(error)
  } finally {
    link?.remove()
    if (url && downloadIniciado) {
      const urlParaRevogar = url
      window.setTimeout(() => URL.revokeObjectURL(urlParaRevogar), 1000)
    }
    exportando.value = null
  }
}

async function exportarPdf() {
  if (!podeExportar.value) return

  exportando.value = 'pdf'
  erroExportacao.value = ''
  sucessoExportacao.value = ''
  try {
    await nextTick()
    if (typeof window.print !== 'function') {
      throw new Error('Impressão não disponível neste navegador.')
    }
    window.print()
  } catch {
    erroExportacao.value =
      'Não foi possível preparar o PDF. Tente novamente ou use a impressão do navegador.'
  } finally {
    exportando.value = null
  }
}

async function atualizarRelatorios() {
  erroDatas.value = ''
  if (dataInicio.value && dataFim.value && dataInicio.value > dataFim.value) {
    erroDatas.value = 'A data inicial não pode ser posterior à data final.'
    return
  }

  const filtros = filtrosSelecionados()
  filtrosExibidos.value = filtros
  await Promise.all([
    buscarFaturamento(filtros),
    buscarDesempenho(filtrosDesempenhoSelecionados(filtros)),
  ])
}

async function limparFiltros() {
  dataInicio.value = ''
  dataFim.value = ''
  erroDatas.value = ''
  await atualizarRelatorios()
}

onMounted(() => {
  const consultas = [buscarFaturamento(), buscarEstoque(), buscarDesempenho()]
  if (auth.usuario?.perfil === 'admin') consultas.push(buscarVendedores())
  void Promise.all(consultas)
})

watch(idVendedorSelecionado, () => {
  if (auth.usuario?.perfil !== 'admin') return
  void buscarDesempenho(filtrosDesempenhoSelecionados(filtrosExibidos.value))
})
</script>

<template>
  <section class="reports-page">
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

    <nav class="reports-selector" aria-label="Selecionar relatório">
      <button
        v-for="(titulo, tipo) in titulosRelatorio"
        :key="tipo"
        class="button"
        :class="relatorioSelecionado === tipo ? 'button--gold' : 'button--secondary'"
        type="button"
        :aria-pressed="relatorioSelecionado === tipo"
        @click="selecionarRelatorio(tipo)"
      >
        {{ titulo }}
      </button>
    </nav>

    <section
      class="card report-card report-print-surface"
      :aria-labelledby="`relatorio-${relatorioSelecionado}`"
    >
      <header class="report-print-heading">
        <div class="report-heading">
          <div>
            <span class="eyebrow">RELATÓRIO</span>
            <h2 :id="`relatorio-${relatorioSelecionado}`">
              {{ titulosRelatorio[relatorioSelecionado] }}
            </h2>
            <p
              v-if="
                auth.usuario?.perfil === 'admin' &&
                relatorioSelecionado === 'desempenho' &&
                vendedorSelecionado
              "
              class="report-filter-summary"
            >
              Vendedor selecionado: {{ vendedorSelecionado.nome }}
            </p>
          </div>
          <div class="report-export-actions">
            <button
              class="button button--secondary"
              type="button"
              :disabled="!podeExportar"
              @click="exportarPdf"
            >
              {{ exportando === 'pdf' ? 'Preparando PDF...' : 'Exportar PDF' }}
            </button>
            <button
              class="button button--secondary"
              type="button"
              :disabled="!podeExportar"
              @click="exportarCsv"
            >
              {{ exportando === 'csv' ? 'Gerando CSV...' : 'Exportar CSV / Excel' }}
            </button>
          </div>
        </div>
        <p class="report-period">Período consultado: {{ periodoConsultado() }}</p>
      </header>

      <p v-if="erroExportacao" class="alert alert--error report-export-error" role="alert">
        {{ erroExportacao }}
      </p>
      <p v-if="sucessoExportacao" class="alert alert--success notice" role="status">
        {{ sucessoExportacao }}
      </p>

      <div v-if="relatorioSelecionado === 'faturamento'">
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
      </div>

      <div v-else-if="relatorioSelecionado === 'desempenho'">
        <div v-if="auth.usuario?.perfil === 'admin'" class="field performance-vendor-filter">
          <label for="relatorio-vendedor">Filtrar por vendedor</label>
          <select
            id="relatorio-vendedor"
            v-model.number="idVendedorSelecionado"
            :disabled="carregandoVendedores"
          >
            <option value="">Todos os vendedores</option>
            <option
              v-for="vendedor in vendedores"
              :key="vendedor.id_usuario"
              :value="vendedor.id_usuario"
            >
              {{ vendedor.nome }}
            </option>
          </select>
          <p v-if="erroVendedores" class="field-error" role="alert">{{ erroVendedores }}</p>
          <p v-else-if="!carregandoVendedores && vendedores.length === 0" class="field-hint">
            Não há vendedores ativos cadastrados.
          </p>
        </div>
        <p v-if="erroDesempenho" class="alert alert--error" role="alert">
          {{ erroDesempenho }}
        </p>
        <p v-else-if="carregandoDesempenho" class="loading-state" role="status">
          Carregando desempenho...
        </p>
        <p v-else-if="desempenho.length === 0" class="empty-state">
          {{ mensagemVaziaDesempenho }}
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
      </div>

      <div v-else>
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
      </div>
    </section>
  </section>
</template>

<style scoped>
.reports-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

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

.performance-vendor-filter {
  max-width: 420px;
  margin-bottom: var(--space-4);
}

.performance-vendor-filter .field-hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.report-filter-summary {
  margin: var(--space-2) 0 0;
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

.report-card {
  min-width: 0;
  padding: clamp(18px, 3vw, 26px);
}

.report-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
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

.report-period {
  margin: -8px 0 var(--space-5);
  color: var(--color-muted);
  font-size: 0.875rem;
}

.report-export-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.report-export-error {
  margin-bottom: var(--space-4);
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

  .report-heading {
    flex-direction: column;
  }

  .report-export-actions {
    width: 100%;
    justify-content: stretch;
  }

  .report-export-actions .button {
    flex: 1;
  }
}

@media print {
  :global(body *) {
    visibility: hidden !important;
  }

  .report-print-surface,
  .report-print-surface * {
    visibility: visible !important;
  }

  .report-print-surface {
    position: absolute;
    inset: 0;
    width: 100%;
    padding: 0;
    border: 0;
    box-shadow: none;
  }

  .report-export-actions,
  .report-export-error {
    display: none !important;
  }

  .report-period {
    color: #333;
  }

  .data-table th,
  .data-table td {
    color: #111;
    border-color: #bbb;
  }
}
</style>
