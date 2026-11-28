<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { listarRegistrosAuditoria } from '@/services/auditoria.service'
import type { RegistroAuditoria } from '@/services/auditoria.service'

const registros = ref<RegistroAuditoria[]>([])
const carregando = ref(false)
const erro = ref('')
const filtroUsuario = ref('')
const filtroAcao = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const pesquisaRecurso = ref('')
const erroFiltros = ref('')
const registroSelecionado = ref<RegistroAuditoria | null>(null)

const usuarios = computed(() => {
  const usuariosUnicos = new Map<number, string>()
  for (const registro of registros.value) {
    usuariosUnicos.set(registro.ator.id_usuario, registro.ator.nome)
  }
  return [...usuariosUnicos.entries()]
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
})

const acoes = computed(() => [...new Set(registros.value.map((registro) => registro.acao))].sort())

const filtrosAplicados = computed(
  () =>
    Boolean(filtroUsuario.value) ||
    Boolean(filtroAcao.value) ||
    Boolean(filtroDataInicio.value) ||
    Boolean(filtroDataFim.value) ||
    Boolean(pesquisaRecurso.value.trim()),
)

const registrosFiltrados = computed(() => {
  const termo = pesquisaRecurso.value.trim().toLocaleLowerCase('pt-BR')
  const inicio = filtroDataInicio.value ? new Date(`${filtroDataInicio.value}T00:00:00`) : null
  const fim = filtroDataFim.value ? new Date(`${filtroDataFim.value}T23:59:59.999`) : null

  return registros.value.filter((registro) => {
    if (filtroUsuario.value && String(registro.ator.id_usuario) !== filtroUsuario.value) {
      return false
    }
    if (filtroAcao.value && registro.acao !== filtroAcao.value) return false

    const dataOperacao = new Date(registro.criadaEm)
    if (inicio && dataOperacao < inicio) return false
    if (fim && dataOperacao > fim) return false

    if (termo) {
      const textoRecurso = [
        registro.recursoTipo,
        registro.recursoId,
        ...Object.values(registro.detalhes ?? {}).map(valorDetalhe),
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
      if (!textoRecurso.includes(termo)) return false
    }
    return true
  })
})

function valorDetalhe(valor: unknown): string {
  if (typeof valor === 'string') return valor
  if (valor === null || typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor)
  }
  return JSON.stringify(valor)
}

function rotuloAcao(acao: string): string {
  const rotulos: Record<string, string> = {
    VENDA_APROVADA: 'Venda aprovada',
    VENDA_REJEITADA: 'Venda rejeitada',
    USUARIO_CADASTRADO: 'Usuário cadastrado',
    USUARIO_INATIVADO: 'Usuário inativado',
    VEICULO_CADASTRADO: 'Veículo cadastrado',
  }
  return rotulos[acao] ?? acao.replace(/_/g, ' ').toLocaleLowerCase('pt-BR')
}

function classeAcao(acao: string): string {
  if (acao === 'VENDA_APROVADA' || acao === 'USUARIO_CADASTRADO') return 'audit-action--success'
  if (acao === 'VENDA_REJEITADA') return 'audit-action--danger'
  if (acao === 'USUARIO_INATIVADO') return 'audit-action--warning'
  return 'audit-action--neutral'
}

function descricaoRecurso(registro: RegistroAuditoria): string {
  const detalhes = registro.detalhes ?? {}
  if (registro.recursoTipo === 'veiculo') {
    const veiculo = [detalhes.marca, detalhes.modelo].filter(Boolean).join(' ')
    return [veiculo, detalhes.placa].filter(Boolean).join(' · ') || `Veículo #${registro.recursoId}`
  }
  if (registro.recursoTipo === 'usuario' && typeof detalhes.nome === 'string') {
    return detalhes.nome
  }
  return `${registro.recursoTipo} #${registro.recursoId}`
}

function formatarData(dataIso: string): string {
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return 'Data inválida'
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarHorario(dataIso: string): string {
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return '--:--'
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarDataCompleta(dataIso: string): string {
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return 'Data inválida'
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function rotuloDetalhe(chave: string): string {
  const rotulos: Record<string, string> = {
    statusAnterior: 'Status anterior',
    statusAtual: 'Status atual',
    nome: 'Nome',
    perfil: 'Perfil',
    marca: 'Marca',
    modelo: 'Modelo',
    ano: 'Ano',
    placa: 'Placa',
  }
  return rotulos[chave] ?? chave.replace(/([A-Z])/g, ' $1').replace(/^./, (letra) => letra.toUpperCase())
}

const detalhesSelecionados = computed(() =>
  Object.entries(registroSelecionado.value?.detalhes ?? {}),
)

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(' ')
  }
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível carregar os registros de auditoria. Tente novamente.'
}

async function buscarRegistros() {
  carregando.value = true
  erro.value = ''

  try {
    registros.value = await listarRegistrosAuditoria()
  } catch (error) {
    erro.value = mensagemErro(error)
    registros.value = []
  } finally {
    carregando.value = false
  }
}

function aplicarFiltros() {
  erroFiltros.value = ''
  if (filtroDataInicio.value && filtroDataFim.value && filtroDataInicio.value > filtroDataFim.value) {
    erroFiltros.value = 'A data inicial não pode ser posterior à data final.'
  }
}

function limparFiltros() {
  filtroUsuario.value = ''
  filtroAcao.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  pesquisaRecurso.value = ''
  erroFiltros.value = ''
}

onMounted(buscarRegistros)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">MÓDULO DE GESTÃO</span>
        <h1>Auditoria</h1>
        <p>Consulte as operações registradas pelos usuários no sistema.</p>
      </div>
      <button
        class="button button--secondary"
        type="button"
        :disabled="carregando"
        @click="buscarRegistros"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 7v5h-5M4 17v-5h5m-4-1a7 7 0 0 1 12-4l3 3M4 14l3 3a7 7 0 0 0 12-4" />
        </svg>
        {{ carregando ? 'Atualizando...' : 'Atualizar' }}
      </button>
    </div>

    <p v-if="erro" class="alert alert--error audit-notice" role="alert">
      {{ erro }}
      <button class="button button--secondary" type="button" @click="buscarRegistros">
        Tentar novamente
      </button>
    </p>
    <p v-if="erroFiltros" class="alert alert--error audit-notice" role="alert">
      {{ erroFiltros }}
    </p>

    <div class="card audit-filters">
      <div class="audit-card-heading">
        <div>
          <h2>Filtros de consulta</h2>
          <p>Combine os critérios para localizar operações específicas.</p>
        </div>
      </div>
      <form class="audit-filter-grid" @submit.prevent="aplicarFiltros">
        <div class="field">
          <label for="audit-user-filter">Usuário responsável</label>
          <select id="audit-user-filter" v-model="filtroUsuario">
            <option value="">Todos os usuários</option>
            <option v-for="usuario in usuarios" :key="usuario.id" :value="String(usuario.id)">
              {{ usuario.nome }} (#{{ usuario.id }})
            </option>
          </select>
        </div>
        <div class="field">
          <label for="audit-action-filter">Tipo de operação</label>
          <select id="audit-action-filter" v-model="filtroAcao">
            <option value="">Todas as operações</option>
            <option v-for="acao in acoes" :key="acao" :value="acao">
              {{ rotuloAcao(acao) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="audit-date-start">Data inicial</label>
          <input
            id="audit-date-start"
            v-model="filtroDataInicio"
            type="date"
            :max="filtroDataFim || undefined"
            @change="aplicarFiltros"
          />
        </div>
        <div class="field">
          <label for="audit-date-end">Data final</label>
          <input
            id="audit-date-end"
            v-model="filtroDataFim"
            type="date"
            :min="filtroDataInicio || undefined"
            @change="aplicarFiltros"
          />
        </div>
        <div class="field audit-search">
          <label for="audit-resource-filter">Registro ou descrição afetada</label>
          <input
            id="audit-resource-filter"
            v-model="pesquisaRecurso"
            type="search"
            placeholder="Buscar ID, nome, placa ou detalhe"
          />
        </div>
        <div class="audit-filter-actions">
          <button class="button button--gold" type="submit">Aplicar filtros</button>
          <button class="button button--secondary" type="button" @click="limparFiltros">
            Limpar
          </button>
        </div>
      </form>
    </div>

    <div class="card audit-results">
      <div class="audit-card-heading audit-results-heading">
        <div>
          <h2>Operações registradas</h2>
          <p v-if="!carregando && !erro">
            {{ registrosFiltrados.length }} de {{ registros.length }} registros
          </p>
        </div>
      </div>

      <p v-if="carregando" class="loading-state" role="status">
        <span class="spinner" aria-hidden="true"></span>
        Carregando registros de auditoria...
      </p>
      <div v-else-if="erro" class="empty-state">
        <p>Não foi possível atualizar a consulta.</p>
      </div>
      <div v-else-if="registros.length === 0" class="empty-state">
        <p>Nenhuma operação de auditoria foi registrada.</p>
      </div>
      <div v-else-if="registrosFiltrados.length === 0" class="empty-state">
        <p>
          {{
            filtrosAplicados
              ? 'Nenhuma operação encontrada para os critérios selecionados.'
              : 'Nenhuma operação encontrada.'
          }}
        </p>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table audit-table">
          <thead>
            <tr>
              <th>Data e horário</th>
              <th>Usuário responsável</th>
              <th>Operação</th>
              <th>Registro afetado</th>
              <th>Descrição</th>
              <th><span class="visually-hidden">Detalhes</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registro in registrosFiltrados" :key="registro.id">
              <td class="audit-date">
                <strong>{{ formatarData(registro.criadaEm) }}</strong>
                <span>{{ formatarHorario(registro.criadaEm) }}</span>
              </td>
              <td>
                <strong>{{ registro.ator.nome }}</strong>
                <span class="audit-secondary">ID {{ registro.ator.id_usuario }}</span>
              </td>
              <td>
                <span :class="['audit-action', classeAcao(registro.acao)]">
                  {{ rotuloAcao(registro.acao) }}
                </span>
              </td>
              <td>
                <strong>{{ registro.recursoTipo }} #{{ registro.recursoId }}</strong>
              </td>
              <td>{{ descricaoRecurso(registro) }}</td>
              <td class="audit-details-cell">
                <button
                  class="button button--secondary audit-details-button"
                  type="button"
                  :aria-label="`Ver detalhes da operação ${rotuloAcao(registro.acao)} #${registro.id}`"
                  @click="registroSelecionado = registro"
                >
                  Ver detalhes
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="registroSelecionado"
      class="audit-modal-backdrop"
      @click.self="registroSelecionado = null"
      @keydown.esc="registroSelecionado = null"
    >
      <section
        class="audit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
        tabindex="-1"
      >
        <div class="audit-modal-heading">
          <div>
            <span class="eyebrow">REGISTRO #{{ registroSelecionado.id }}</span>
            <h2 id="audit-modal-title">{{ rotuloAcao(registroSelecionado.acao) }}</h2>
          </div>
          <button
            class="icon-button"
            type="button"
            aria-label="Fechar detalhes"
            @click="registroSelecionado = null"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <dl class="audit-detail-list">
          <div>
            <dt>Usuário responsável</dt>
            <dd>{{ registroSelecionado.ator.nome }} (ID {{ registroSelecionado.ator.id_usuario }})</dd>
          </div>
          <div>
            <dt>Data e horário</dt>
            <dd>{{ formatarDataCompleta(registroSelecionado.criadaEm) }}</dd>
          </div>
          <div>
            <dt>Registro afetado</dt>
            <dd>{{ registroSelecionado.recursoTipo }} #{{ registroSelecionado.recursoId }}</dd>
          </div>
          <div v-for="[chave, valor] in detalhesSelecionados" :key="chave">
            <dt>{{ rotuloDetalhe(chave) }}</dt>
            <dd>{{ valorDetalhe(valor) }}</dd>
          </div>
          <div v-if="detalhesSelecionados.length === 0">
            <dt>Detalhes adicionais</dt>
            <dd>Não foram informados detalhes adicionais para esta operação.</dd>
          </div>
        </dl>
        <div class="audit-modal-actions">
          <button
            class="button button--secondary"
            type="button"
            @click="registroSelecionado = null"
          >
            Fechar
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.audit-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.audit-notice .button {
  flex: 0 0 auto;
  min-height: 36px;
}

.audit-filters,
.audit-results {
  margin-bottom: 20px;
}

.audit-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.audit-card-heading h2 {
  margin: 0;
  font-size: 1.05rem;
}

.audit-card-heading p {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.audit-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  gap: 16px;
}

.audit-search {
  grid-column: span 2;
}

.audit-filter-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  grid-column: span 2;
}

.audit-results-heading {
  margin-bottom: 8px;
}

.audit-table {
  min-width: 860px;
}

.audit-table td > strong,
.audit-date strong {
  display: block;
}

.audit-date span,
.audit-secondary {
  display: block;
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.audit-action {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.audit-action--success {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.audit-action--danger {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.audit-action--warning {
  color: #80621d;
  background: #fbf3dc;
}

.audit-action--neutral {
  color: #405673;
  background: #edf3f9;
}

.audit-details-cell {
  text-align: right;
}

.audit-details-button {
  min-height: 34px;
  padding: 0 10px;
  font-size: 0.8rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.audit-modal-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 24px;
  background: rgb(11 25 48 / 55%);
}

.audit-modal {
  width: min(100%, 600px);
  max-height: min(760px, 90vh);
  overflow-y: auto;
  padding: 26px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-popover);
}

.audit-modal-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.audit-modal-heading h2 {
  margin: 6px 0 0;
  font-size: 1.3rem;
}

.audit-detail-list {
  display: grid;
  gap: 0;
  margin: 0;
}

.audit-detail-list > div {
  display: grid;
  grid-template-columns: minmax(130px, 0.7fr) minmax(0, 1.3fr);
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid #edf1f6;
}

.audit-detail-list dt {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.audit-detail-list dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  font-weight: 600;
}

.audit-modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 900px) {
  .audit-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .audit-filter-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .audit-search,
  .audit-filter-actions {
    grid-column: auto;
  }

  .audit-filter-actions {
    justify-content: stretch;
  }

  .audit-filter-actions .button {
    flex: 1;
  }

  .audit-notice {
    align-items: flex-start;
    flex-direction: column;
  }

  .audit-modal-backdrop {
    padding: 12px;
  }

  .audit-modal {
    padding: 20px;
  }

  .audit-detail-list > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 5px;
  }
}
</style>
