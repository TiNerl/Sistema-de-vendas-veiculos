<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { listarClientes } from '@/services/clientes.service'
import type { Cliente } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import type { Veiculo } from '@/types/veiculo'
import {
  aprovarVenda,
  cadastrarVenda,
  listarVendas,
  rejeitarVenda,
} from '@/services/vendas.service'
import type { FormaPagamento, VendaRegistrada } from '@/services/vendas.service'

const auth = useAuthStore()
const eAdmin = computed(() => auth.usuario?.perfil === 'admin')
const clientes = ref<Cliente[]>([])
const veiculos = ref<Veiculo[]>([])
const clienteId = ref('')
const veiculoId = ref('')
const percentual = ref(10)
const carregando = ref(false)
const erro = ref('')
const erroSolicitacoes = ref('')
const sucesso = ref('')
const solicitacoes = ref<VendaRegistrada[]>([])
const carregandoSolicitacoes = ref(false)
const enviandoSolicitacao = ref(false)
const idAcaoEmAndamento = ref<number | null>(null)
const decisaoAberta = ref<{ venda: VendaRegistrada; tipo: 'aprovar' | 'reprovar' } | null>(null)
const formaPagamento = ref<FormaPagamento>('a_vista')

const veiculosDisponiveis = computed(() =>
  veiculos.value.filter((veiculo) => veiculo.status === 'disponivel' && veiculo.id_veiculo),
)

const veiculoSelecionado = computed(() =>
  veiculosDisponiveis.value.find((veiculo) => veiculo.id_veiculo === Number(veiculoId.value)),
)

const valorVeiculo = computed(() => Number(veiculoSelecionado.value?.preco ?? 0))
const valorDesconto = computed(() => (valorVeiculo.value * percentual.value) / 100)
const podeEnviar = computed(
  () =>
    Boolean(clienteId.value) &&
    Boolean(veiculoId.value) &&
    Number.isFinite(percentual.value) &&
    percentual.value > 10 &&
    percentual.value <= 100 &&
    !enviandoSolicitacao.value,
)
const minhasSolicitacoes = computed(() =>
  solicitacoes.value.filter((venda) => venda.usuario?.id_usuario === auth.usuario?.id),
)
const solicitacoesPendentes = computed(() =>
  solicitacoes.value.filter((venda) => venda.status === 'pendente'),
)

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
  return 'Não foi possível concluir a operação. Tente novamente.'
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

async function carregarSolicitacoes() {
  carregandoSolicitacoes.value = true
  erroSolicitacoes.value = ''

  try {
    solicitacoes.value = await listarVendas()
  } catch (error) {
    erroSolicitacoes.value = mensagemErro(error)
    solicitacoes.value = []
  } finally {
    carregandoSolicitacoes.value = false
  }
}

async function enviarSolicitacao() {
  if (!podeEnviar.value) {
    erro.value = percentual.value === 10
      ? 'O backend só envia para aprovação descontos superiores a 10%.'
      : 'Informe cliente, veículo e um desconto maior que 10% e de até 100%.'
    return
  }

  enviandoSolicitacao.value = true
  erro.value = ''
  sucesso.value = ''

  try {
    const venda = await cadastrarVenda({
      id_cliente: Number(clienteId.value),
      id_veiculo: Number(veiculoId.value),
      forma_pagamento: formaPagamento.value,
      percentual_desconto: percentual.value,
    })

    if (venda.status === 'pendente') {
      sucesso.value = `Solicitação da venda #${venda.id_venda} enviada para aprovação.`
    } else {
      sucesso.value = `Venda #${venda.id_venda} foi registrada pela API com status "${venda.status}".`
    }

    clienteId.value = ''
    veiculoId.value = ''
    percentual.value = 10
    formaPagamento.value = 'a_vista'
    await Promise.all([carregarSolicitacoes(), carregarDados()])
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    enviandoSolicitacao.value = false
  }
}

async function executarDecisao() {
  const decisao = decisaoAberta.value
  if (!decisao || idAcaoEmAndamento.value !== null) return

  idAcaoEmAndamento.value = decisao.venda.id_venda
  erroSolicitacoes.value = ''
  sucesso.value = ''

  try {
    if (decisao.tipo === 'aprovar') {
      await aprovarVenda(decisao.venda.id_venda)
      sucesso.value = `Solicitação da venda #${decisao.venda.id_venda} aprovada.`
    } else {
      await rejeitarVenda(decisao.venda.id_venda)
      sucesso.value = `Solicitação da venda #${decisao.venda.id_venda} reprovada.`
    }
    decisaoAberta.value = null
    await carregarSolicitacoes()
  } catch (error) {
    erroSolicitacoes.value = mensagemErro(error)
  } finally {
    idAcaoEmAndamento.value = null
  }
}

onMounted(() => {
  void carregarSolicitacoes()
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
              : 'Envie descontos superiores a 10% para aprovação antes de concluir a venda.'
          }}
        </p>
      </div>
    </div>

    <template v-if="!eAdmin">
      <p v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</p>
      <p v-if="sucesso" class="alert alert--success notice" role="status">{{ sucesso }}</p>

      <form class="card form-card discount-request-form" @submit.prevent="enviarSolicitacao">
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
            <label for="desconto-forma-pagamento">Forma de pagamento</label>
            <select id="desconto-forma-pagamento" v-model="formaPagamento" required>
              <option value="a_vista">À vista</option>
              <option value="pix">PIX</option>
              <option value="financiamento">Financiamento</option>
              <option value="consorcio">Consórcio</option>
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
            <p class="field-help">
              A API envia para aprovação somente descontos superiores a 10%; exatamente 10% é
              registrado como venda concluída.
            </p>
          </div>

          <section class="sale-summary" aria-label="Resumo da solicitação de desconto">
            <h2>Resumo do pedido</h2>
            <dl>
              <div><dt>Valor do veículo</dt><dd>{{ moeda(valorVeiculo) }}</dd></div>
              <div>
                <dt>Percentual solicitado</dt>
                <dd>{{ Number(percentual || 0).toLocaleString('pt-BR') }}%</dd>
              </div>
              <div><dt>Valor do desconto</dt><dd>{{ moeda(valorDesconto) }}</dd></div>
            </dl>
          </section>

          <div class="form-actions">
            <button class="button button--primary" type="submit" :disabled="!podeEnviar">
              {{ enviandoSolicitacao ? 'Enviando solicitação...' : 'Solicitar aprovação' }}
            </button>
          </div>
        </template>
      </form>

      <section class="card discount-queue" aria-labelledby="minhas-solicitacoes-titulo">
        <div class="form-section-heading">
          <h2 id="minhas-solicitacoes-titulo">Minhas solicitações</h2>
          <p>Acompanhe a situação das vendas enviadas para aprovação.</p>
        </div>
        <p v-if="erroSolicitacoes" class="alert alert--error notice" role="alert">
          {{ erroSolicitacoes }}
          <button class="inline-retry" type="button" @click="carregarSolicitacoes">
            Tentar novamente
          </button>
        </p>
        <p v-if="carregandoSolicitacoes" class="loading-state" role="status">
          Carregando suas solicitações...
        </p>
        <div v-else-if="!erroSolicitacoes && minhasSolicitacoes.length === 0" class="empty-state">
          Nenhuma solicitação encontrada.
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Venda</th>
                <th scope="col">Cliente</th>
                <th scope="col">Veículo</th>
                <th scope="col">Percentual</th>
                <th scope="col">Valor do desconto</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="solicitacao in minhasSolicitacoes" :key="solicitacao.id_venda">
                <td>#{{ solicitacao.id_venda }}</td>
                <td>{{ solicitacao.cliente?.nome ?? 'N/A' }}</td>
                <td>
                  {{ solicitacao.veiculo?.marca ?? '' }} {{ solicitacao.veiculo?.modelo ?? 'N/A' }}
                  {{ solicitacao.veiculo?.placa ? `(${solicitacao.veiculo.placa})` : '' }}
                </td>
                <td>{{ solicitacao.percentual_desconto ?? 'N/A' }}%</td>
                <td>{{ moeda(solicitacao.valor_desconto ?? 0) }}</td>
                <td><span :class="['status-badge', `status-badge--${solicitacao.status}`]">
                  {{ solicitacao.status }}
                </span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <template v-else>
      <p v-if="sucesso" class="alert alert--success notice" role="status">{{ sucesso }}</p>
      <p v-if="erroSolicitacoes" class="alert alert--error notice" role="alert">
        {{ erroSolicitacoes }}
        <button class="inline-retry" type="button" @click="carregarSolicitacoes">
          Tentar novamente
        </button>
      </p>
      <section class="card discount-queue" aria-labelledby="fila-descontos-titulo">
        <div class="form-section-heading">
          <h2 id="fila-descontos-titulo">Fila de aprovação</h2>
          <p>Percentual, valor do desconto e situação das solicitações.</p>
        </div>

        <p v-if="carregandoSolicitacoes" class="loading-state" role="status">
          Carregando solicitações pendentes...
        </p>
        <div v-if="!carregandoSolicitacoes && !erroSolicitacoes" class="table-wrap">
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
              <tr v-if="solicitacoesPendentes.length === 0">
                <td colspan="7" class="empty-state">Não há solicitações pendentes.</td>
              </tr>
              <tr v-for="solicitacao in solicitacoesPendentes" :key="solicitacao.id_venda">
                <td>{{ solicitacao.usuario?.nome ?? 'N/A' }}</td>
                <td>{{ solicitacao.cliente?.nome ?? 'N/A' }}</td>
                <td>
                  {{ solicitacao.veiculo?.marca ?? '' }} {{ solicitacao.veiculo?.modelo ?? 'N/A' }}
                  {{ solicitacao.veiculo?.placa ? `(${solicitacao.veiculo.placa})` : '' }}
                </td>
                <td>{{ solicitacao.percentual_desconto ?? 'N/A' }}%</td>
                <td>{{ moeda(solicitacao.valor_desconto ?? 0) }}</td>
                <td><span class="status-badge status-badge--pendente">Pendente</span></td>
                <td>
                  <div class="approval-actions">
                    <button
                      class="button button--primary"
                      type="button"
                      :disabled="idAcaoEmAndamento !== null"
                      @click="decisaoAberta = { venda: solicitacao, tipo: 'aprovar' }"
                    >Aprovar</button>
                    <button
                      class="button button--danger"
                      type="button"
                      :disabled="idAcaoEmAndamento !== null"
                      @click="decisaoAberta = { venda: solicitacao, tipo: 'reprovar' }"
                    >Reprovar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <div
      v-if="decisaoAberta"
      class="modal-backdrop"
      @click.self="decisaoAberta = null"
      @keydown.esc="decisaoAberta = null"
    >
      <section
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decisao-desconto-titulo"
      >
        <h2 id="decisao-desconto-titulo">
          {{ decisaoAberta.tipo === 'aprovar' ? 'Aprovar solicitação' : 'Reprovar solicitação' }}
        </h2>
        <p class="confirm-copy">
          Confirma {{ decisaoAberta.tipo === 'aprovar' ? 'a aprovação' : 'a reprovação' }} da venda
          #{{ decisaoAberta.venda.id_venda }} de
          {{ decisaoAberta.venda.cliente?.nome ?? 'cliente não informado' }}?
        </p>
        <div class="dialog-actions">
          <button
            class="button button--secondary"
            type="button"
            :disabled="idAcaoEmAndamento !== null"
            @click="decisaoAberta = null"
          >Voltar</button>
          <button
            :class="['button', decisaoAberta.tipo === 'aprovar' ? 'button--primary' : 'button--danger']"
            type="button"
            :disabled="idAcaoEmAndamento !== null"
            @click="executarDecisao"
          >
            {{
              idAcaoEmAndamento !== null
                ? 'Processando...'
                : decisaoAberta.tipo === 'aprovar'
                  ? 'Confirmar aprovação'
                  : 'Confirmar reprovação'
            }}
          </button>
        </div>
      </section>
    </div>
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

.status-badge--pendente {
  color: #92400e;
  background: #fef3c7;
}

.status-badge--concluida {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.status-badge--cancelada {
  color: #78879b;
  background: #eef1f5;
}
</style>
