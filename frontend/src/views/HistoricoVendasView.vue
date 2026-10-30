<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { listarVendas } from '@/services/vendas.service'
import type { VendaRegistrada, FiltrosVenda } from '@/services/vendas.service'
import { listarClientes } from '@/services/clientes.service'
import type { Cliente } from '@/services/clientes.service'

const auth = useAuthStore()
const route = useRoute()

const vendas = ref<VendaRegistrada[]>([])
const clientes = ref<Cliente[]>([])
const carregando = ref(false)
const erro = ref('')
const erroClientes = ref('')
const vendaParaCancelar = ref<VendaRegistrada | null>(null)
const justificativaCancelamento = ref('')

function clienteIdDaRota(valor: unknown): string {
  const id = typeof valor === 'string' ? Number(valor) : Number.NaN
  return Number.isSafeInteger(id) && id > 0 ? String(id) : ''
}

const filtroClienteId = ref<string>(clienteIdDaRota(route.query.cliente_id))
const filtroDataInicio = ref<string>('')
const filtroDataFim = ref<string>('')

const eAdmin = computed(() => auth.usuario?.perfil === 'admin')
const vendasVisiveis = computed(() => {
  if (eAdmin.value) return vendas.value
  const usuarioId = auth.usuario?.id
  return vendas.value.filter((venda) => venda.usuario?.id_usuario === usuarioId)
})

function moeda(valor: number | string | undefined): string {
  const numero = Number(valor ?? 0)
  if (!Number.isFinite(numero)) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero)
}

function formatarData(dataIso: string): string {
  if (!dataIso) return '-'
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return '-'
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarPagamento(formaPagamento: VendaRegistrada['forma_pagamento']): string {
  return formaPagamento ? formaPagamento.replace(/_/g, ' ').toUpperCase() : 'Não informado'
}

function formatarPercentual(valor: number | string | null): string {
  if (valor === null) return 'Não informado'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 'Não informado'
  return `${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function abrirCancelamento(venda: VendaRegistrada) {
  vendaParaCancelar.value = venda
  justificativaCancelamento.value = ''
}

function fecharCancelamento() {
  vendaParaCancelar.value = null
  justificativaCancelamento.value = ''
}

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(' ')
  }
  return 'Não foi possível carregar as vendas. Tente novamente.'
}

async function buscarVendas() {
  if (filtroDataInicio.value && filtroDataFim.value && filtroDataInicio.value > filtroDataFim.value) {
    erro.value = 'A data inicial não pode ser posterior à data final.'
    return
  }

  carregando.value = true
  erro.value = ''

  try {
    const params: FiltrosVenda = {}
    if (filtroClienteId.value) params.cliente_id = Number(filtroClienteId.value)
    if (filtroDataInicio.value) params.dataInicio = filtroDataInicio.value
    if (filtroDataFim.value) params.dataFim = filtroDataFim.value

    vendas.value = await listarVendas(params)
  } catch (error) {
    erro.value = mensagemErro(error)
    vendas.value = []
  } finally {
    carregando.value = false
  }
}

async function limparFiltros() {
  filtroClienteId.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  await buscarVendas()
}

onMounted(async () => {
  try {
    clientes.value = await listarClientes()
  } catch (error) {
    erroClientes.value = mensagemErro(error)
  }
  await buscarVendas()
})

watch(
  () => route.query.cliente_id,
  (clienteId) => {
    filtroClienteId.value = clienteIdDaRota(clienteId)
    void buscarVendas()
  },
)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">{{ eAdmin ? 'MÓDULO DE GESTÃO' : 'ÁREA DO VENDEDOR' }}</span>
        <h1>Histórico de Vendas</h1>
        <p>Consulte o histórico de vendas realizadas e aplique os filtros necessários.</p>
      </div>
    </div>

    <p v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</p>
    <p v-if="erroClientes" class="alert alert--error notice" role="alert">
      Não foi possível carregar a lista de clientes para o filtro: {{ erroClientes }}
    </p>

    <div class="card form-card mb-4">
      <h2>Filtros de consulta</h2>
      <form class="filters-grid" @submit.prevent="buscarVendas">
        <div class="field">
          <label for="filtro-cliente">Cliente</label>
          <select id="filtro-cliente" v-model="filtroClienteId">
            <option value="">Todos os clientes</option>
            <option v-for="cliente in clientes" :key="cliente.id_cliente" :value="String(cliente.id_cliente)">
              {{ cliente.nome }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="filtro-data-inicio">Data inicial</label>
          <input
            id="filtro-data-inicio"
            v-model="filtroDataInicio"
            type="date"
            :max="filtroDataFim || undefined"
          />
        </div>

        <div class="field">
          <label for="filtro-data-fim">Data final</label>
          <input
            id="filtro-data-fim"
            v-model="filtroDataFim"
            type="date"
            :min="filtroDataInicio || undefined"
          />
        </div>

        <div class="form-actions align-end">
          <button class="button button--primary" type="submit" :disabled="carregando">
            {{ carregando ? 'Buscando...' : 'Filtrar' }}
          </button>
          <button class="button button--secondary" type="button" @click="limparFiltros" :disabled="carregando">
            Limpar
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <p v-if="carregando" class="loading-state" role="status">Carregando histórico de vendas...</p>

      <div v-else-if="erro" class="empty-state">
        <p>Não foi possível atualizar o histórico.</p>
      </div>

      <div v-else-if="vendasVisiveis.length === 0" class="empty-state">
        <p>Nenhuma venda encontrada para os filtros aplicados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th># ID</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Veículo</th>
              <th v-if="eAdmin">Vendedor</th>
              <th>Valor do veículo</th>
              <th>Desconto</th>
              <th>Comissão (%)</th>
              <th>Valor da comissão</th>
              <th>Forma de pagamento</th>
              <th>Valor Final</th>
              <th>Status</th>
              <th v-if="eAdmin">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venda in vendasVisiveis" :key="venda.id_venda">
              <td>#{{ venda.id_venda }}</td>
              <td>{{ formatarData(venda.data_venda) }}</td>
              <td>{{ venda.cliente?.nome ?? 'N/A' }}</td>
              <td>
                <template v-if="venda.veiculo">
                  {{ venda.veiculo.marca }} {{ venda.veiculo.modelo }} ({{ venda.veiculo.placa }})
                </template>
                <template v-else>N/A</template>
              </td>
              <td v-if="eAdmin">{{ venda.usuario?.nome ?? 'N/A' }}</td>
              <td>{{ moeda(venda.valor_veiculo) }}</td>
              <td>{{ moeda(venda.valor_desconto ?? 0) }}</td>
              <td>{{ formatarPercentual(venda.percentual_comissao) }}</td>
              <td>{{ moeda(venda.valor_comissao ?? undefined) }}</td>
              <td>{{ formatarPagamento(venda.forma_pagamento) }}</td>
              <td><strong>{{ moeda(venda.valor_final) }}</strong></td>
              <td>
                <span :class="['badge', venda.status === 'concluida' ? 'badge--success' : 'badge--warning']">
                  {{ venda.status }}
                </span>
              </td>
              <td v-if="eAdmin">
                <button
                  v-if="venda.status === 'concluida'"
                  class="table-action"
                  type="button"
                  :aria-label="`Cancelar venda ${venda.id_venda}`"
                  @click="abrirCancelamento(venda)"
                >
                  Cancelar venda
                </button>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="vendaParaCancelar"
      class="modal-backdrop"
      @click.self="fecharCancelamento"
      @keydown.esc="fecharCancelamento"
    >
      <section
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-venda-titulo"
        aria-describedby="cancelar-venda-descricao"
      >
        <h2 id="cancelar-venda-titulo">Confirmar cancelamento da venda</h2>
        <p id="cancelar-venda-descricao" class="confirm-copy">
          Venda #{{ vendaParaCancelar.id_venda }} — {{ vendaParaCancelar.cliente?.nome ?? 'Cliente não informado' }},
          valor {{ moeda(vendaParaCancelar.valor_final) }}.
        </p>
        <div class="field">
          <label for="justificativa-cancelamento">Justificativa do cancelamento</label>
          <textarea
            id="justificativa-cancelamento"
            v-model="justificativaCancelamento"
            rows="4"
            required
            maxlength="1000"
            placeholder="Informe o motivo do cancelamento"
          ></textarea>
        </div>
        <p class="alert alert--info" role="status">
          A API ainda não disponibiliza o cancelamento de vendas. A justificativa não será enviada
          nem salva.
        </p>
        <div class="dialog-actions">
          <button class="button button--secondary" type="button" @click="fecharCancelamento">
            Voltar
          </button>
          <button
            class="button button--danger"
            type="button"
            disabled
            :title="justificativaCancelamento.trim() ? 'Aguardando suporte da API' : 'Informe uma justificativa obrigatória'"
          >
            Confirmar cancelamento
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.mb-4 {
  margin-bottom: 1.5rem;
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}
.align-end {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: capitalize;
}
.badge--success {
  background-color: #d1fae5;
  color: #065f46;
}
.badge--warning {
  background-color: #fef3c7;
  color: #92400e;
}

.field textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text);
  background: var(--color-white);
  font: inherit;
  resize: vertical;
}

.field textarea:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgb(210 161 58 / 17%);
  outline: none;
}
</style>