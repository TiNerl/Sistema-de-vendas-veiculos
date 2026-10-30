<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { listarClientes } from '@/services/clientes.service'
import type { Cliente } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import type { Veiculo } from '@/types/veiculo'

const auth = useAuthStore()
const eAdmin = computed(() => auth.usuario?.perfil === 'admin')
const clientes = ref<Cliente[]>([])
const veiculos = ref<Veiculo[]>([])
const clienteId = ref('')
const veiculoId = ref('')
const percentual = ref(10)
const carregando = ref(false)
const erro = ref('')

const veiculosDisponiveis = computed(() =>
  veiculos.value.filter((veiculo) => veiculo.status === 'disponivel' && veiculo.id_veiculo),
)

const veiculoSelecionado = computed(() =>
  veiculosDisponiveis.value.find((veiculo) => veiculo.id_veiculo === Number(veiculoId.value)),
)

const valorVeiculo = computed(() => Number(veiculoSelecionado.value?.preco ?? 0))
const valorDesconto = computed(() => (valorVeiculo.value * percentual.value) / 100)

function moeda(valor: number | string): string {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero)
}

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }
  return 'Não foi possível carregar os dados para a solicitação.'
}

async function carregarDados() {
  carregando.value = true
  erro.value = ''

  try {
    const [listaClientes, listaVeiculos] = await Promise.all([listarClientes(), listarVeiculos()])
    clientes.value = listaClientes.filter((cliente) => cliente.ativo)
    veiculos.value = listaVeiculos
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  if (!eAdmin.value) void carregarDados()
})
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">{{ eAdmin ? 'GESTÃO DE VENDAS' : 'ÁREA DO VENDEDOR' }}</span>
        <h1>Solicitações de desconto</h1>
        <p>
          {{
            eAdmin
              ? 'Revise os pedidos de desconto enviados pelos vendedores.'
              : 'Solicite aprovação para descontos de 10% ou mais antes de concluir a venda.'
          }}
        </p>
      </div>
    </div>

    <div class="alert alert--info notice" role="status">
      A API ainda não oferece operações para criar ou decidir solicitações. Esta interface não
      envia, salva nem aprova pedidos; os controles permanecem desabilitados para evitar registrar
      a venda antes da aprovação.
    </div>

    <template v-if="!eAdmin">
      <p v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</p>

      <form class="card form-card discount-request-form" @submit.prevent>
        <p v-if="carregando" class="loading-state" role="status">
          Carregando clientes e veículos disponíveis...
        </p>
        <template v-else>
          <div class="form-section-heading">
            <h2>Nova solicitação</h2>
            <p>Informe o cliente, o veículo e o percentual solicitado.</p>
          </div>

          <div class="field">
            <label for="desconto-cliente">Cliente</label>
            <select id="desconto-cliente" v-model="clienteId" required>
              <option disabled value="">Selecione um cliente ativo</option>
              <option
                v-for="cliente in clientes"
                :key="cliente.id_cliente"
                :value="String(cliente.id_cliente)"
              >
                {{ cliente.nome }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="desconto-veiculo">Veículo</label>
            <select id="desconto-veiculo" v-model="veiculoId" required>
              <option disabled value="">Selecione um veículo disponível</option>
              <option
                v-for="veiculo in veiculosDisponiveis"
                :key="veiculo.id_veiculo"
                :value="String(veiculo.id_veiculo)"
              >
                {{ veiculo.marca }} {{ veiculo.modelo }} {{ veiculo.versao }} — {{ moeda(veiculo.preco) }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="desconto-percentual">Percentual solicitado</label>
            <div class="discount-percent-input">
              <input
                id="desconto-percentual"
                v-model.number="percentual"
                type="number"
                min="10"
                max="100"
                step="0.01"
                required
              />
              <span aria-hidden="true">%</span>
            </div>
            <p class="field-help">Solicitações devem ser de pelo menos 10%.</p>
          </div>

          <section class="sale-summary" aria-label="Resumo da solicitação de desconto">
            <h2>Resumo do pedido</h2>
            <dl>
              <div><dt>Valor do veículo</dt><dd>{{ moeda(valorVeiculo) }}</dd></div>
              <div>
                <dt>Percentual solicitado</dt>
                <dd>{{ percentual.toLocaleString('pt-BR') }}%</dd>
              </div>
              <div><dt>Valor do desconto</dt><dd>{{ moeda(valorDesconto) }}</dd></div>
              <div>
                <dt>Situação</dt>
                <dd><span class="status-badge status-badge--inactive">Rascunho — não enviado</span></dd>
              </div>
            </dl>
          </section>

          <div class="form-actions">
            <button
              class="button button--primary"
              type="button"
              disabled
              title="A API de solicitações ainda não está disponível."
            >
              Solicitar aprovação
            </button>
          </div>
        </template>
      </form>
    </template>

    <template v-else>
      <section class="card discount-queue" aria-labelledby="fila-descontos-titulo">
        <div class="form-section-heading">
          <h2 id="fila-descontos-titulo">Fila de aprovação</h2>
          <p>Percentual, valor do desconto e situação das solicitações.</p>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Vendedor</th>
                <th scope="col">Cliente</th>
                <th scope="col">Veículo</th>
                <th scope="col">Percentual</th>
                <th scope="col">Valor</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="7" class="empty-state">
                  A fila ficará disponível quando a API de solicitações for implementada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="approval-actions" aria-label="Ações administrativas">
          <button class="button button--primary" type="button" disabled>Aprovar solicitação</button>
          <button class="button button--secondary" type="button" disabled>Reprovar solicitação</button>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.discount-request-form,
.discount-queue {
  display: grid;
  gap: 1.25rem;
}

.discount-percent-input {
  position: relative;
}

.discount-percent-input input {
  padding-right: 2.5rem;
}

.discount-percent-input span {
  position: absolute;
  top: 50%;
  right: 1rem;
  color: var(--color-muted);
  transform: translateY(-50%);
}

.approval-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
}
</style>
