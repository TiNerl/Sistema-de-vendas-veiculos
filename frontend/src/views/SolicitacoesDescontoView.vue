<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import {
  aprovarVenda,
  listarVendas,
  rejeitarVenda,
} from '@/services/vendas.service'
import type { VendaRegistrada } from '@/services/vendas.service'

const auth = useAuthStore()
const eAdmin = computed(() => auth.usuario?.perfil === 'admin')
const vendas = ref<VendaRegistrada[]>([])
const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')
const idAcaoEmAndamento = ref<number | null>(null)
const decisaoAberta = ref<{ venda: VendaRegistrada; tipo: 'aprovar' | 'reprovar' } | null>(null)

const minhasSolicitacoes = computed(() =>
  vendas.value.filter(
    (venda) =>
      venda.usuario?.id_usuario === auth.usuario?.id &&
      Number(venda.percentual_desconto) > 10,
  ),
)

const vendasPendentes = computed(() =>
  vendas.value.filter((venda) => venda.status === 'pendente'),
)

function moeda(valor: number | string | null): string {
  if (valor === null) return 'Não informado'
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero)
}

function formatarData(dataIso: string): string {
  const data = new Date(dataIso)
  if (!dataIso || Number.isNaN(data.getTime())) return 'Não informada'
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function rotuloStatus(status: VendaRegistrada['status']): string {
  if (status === 'concluida') return 'Concluída'
  if (status === 'cancelada') return 'Reprovada'
  return 'Pendente'
}

async function carregarVendas() {
  carregando.value = true
  erro.value = ''

  try {
    vendas.value = await listarVendas()
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    carregando.value = false
  }
}

function abrirDecisao(venda: VendaRegistrada, tipo: 'aprovar' | 'reprovar') {
  if (!eAdmin.value || venda.status !== 'pendente' || idAcaoEmAndamento.value !== null) return
  decisaoAberta.value = { venda, tipo }
}

async function executarDecisao() {
  const decisao = decisaoAberta.value
  if (
    !eAdmin.value ||
    !decisao ||
    decisao.venda.status !== 'pendente' ||
    idAcaoEmAndamento.value !== null
  ) {
    return
  }

  const idVenda = decisao.venda.id_venda
  idAcaoEmAndamento.value = idVenda
  erro.value = ''
  sucesso.value = ''

  try {
    const vendaAtualizada =
      decisao.tipo === 'aprovar'
        ? await aprovarVenda(idVenda)
        : await rejeitarVenda(idVenda)

    vendas.value = vendas.value.map((venda) =>
      venda.id_venda === vendaAtualizada.id_venda ? vendaAtualizada : venda,
    )
    sucesso.value =
      decisao.tipo === 'aprovar'
        ? `Venda #${idVenda} aprovada com sucesso.`
        : `Venda #${idVenda} reprovada com sucesso.`
    decisaoAberta.value = null
    await carregarVendas()
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    idAcaoEmAndamento.value = null
  }
}

onMounted(() => {
  void carregarVendas()
})
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">{{ eAdmin ? 'GESTÃO DE VENDAS' : 'ÁREA DO VENDEDOR' }}</span>
        <h1>{{ eAdmin ? 'Aprovação de descontos' : 'Minhas solicitações' }}</h1>
        <p>
          {{
            eAdmin
              ? 'Revise as vendas pendentes de aprovação e decida sobre o desconto solicitado.'
              : 'Acompanhe as vendas registradas que aguardam aprovação de desconto.'
          }}
        </p>
      </div>
    </div>

    <p v-if="sucesso" class="alert alert--success notice" role="status">{{ sucesso }}</p>
    <div v-if="erro" class="alert alert--error notice" role="alert">
      {{ erro }}
      <button class="inline-retry" type="button" :disabled="carregando" @click="carregarVendas">
        Tentar novamente
      </button>
    </div>

    <section
      v-if="eAdmin"
      class="card discount-queue"
      aria-labelledby="fila-descontos-titulo"
    >
      <div class="form-section-heading">
        <h2 id="fila-descontos-titulo">Vendas pendentes</h2>
        <p>As solicitações são as próprias vendas registradas com status pendente.</p>
      </div>

      <p v-if="carregando" class="loading-state" role="status">
        Carregando vendas pendentes...
      </p>
      <div v-else-if="!erro && vendasPendentes.length === 0" class="empty-state">
        Não há vendas aguardando aprovação.
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Venda</th>
              <th scope="col">Data</th>
              <th scope="col">Vendedor</th>
              <th scope="col">Cliente</th>
              <th scope="col">Veículo</th>
              <th scope="col">Desconto solicitado</th>
              <th scope="col">Valor do desconto</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venda in vendasPendentes" :key="venda.id_venda">
              <td>#{{ venda.id_venda }}</td>
              <td>{{ formatarData(venda.data_venda) }}</td>
              <td>{{ venda.usuario?.nome ?? 'Não informado' }}</td>
              <td>{{ venda.cliente?.nome ?? 'Não informado' }}</td>
              <td>
                {{ venda.veiculo?.marca ?? '' }} {{ venda.veiculo?.modelo ?? 'Não informado' }}
                {{ venda.veiculo?.placa ? `(${venda.veiculo.placa})` : '' }}
              </td>
              <td>{{ venda.percentual_desconto ?? 'Não informado' }}%</td>
              <td>{{ moeda(venda.valor_desconto) }}</td>
              <td>
                <div class="approval-actions">
                  <button
                    class="button button--primary"
                    type="button"
                    :disabled="idAcaoEmAndamento !== null"
                    @click="abrirDecisao(venda, 'aprovar')"
                  >
                    Aprovar
                  </button>
                  <button
                    class="button button--danger"
                    type="button"
                    :disabled="idAcaoEmAndamento !== null"
                    @click="abrirDecisao(venda, 'reprovar')"
                  >
                    Reprovar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="card discount-queue" aria-labelledby="minhas-solicitacoes-titulo">
      <div class="form-section-heading">
        <h2 id="minhas-solicitacoes-titulo">Acompanhamento de vendas</h2>
        <p>
          Solicitações de desconto são criadas automaticamente pelo registro da venda e aparecem
          aqui com a situação retornada pela API.
        </p>
      </div>

      <p v-if="carregando" class="loading-state" role="status">
        Carregando suas solicitações...
      </p>
      <div v-else-if="!erro && minhasSolicitacoes.length === 0" class="empty-state">
        Nenhuma solicitação de desconto encontrada.
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Venda</th>
              <th scope="col">Data</th>
              <th scope="col">Cliente</th>
              <th scope="col">Veículo</th>
              <th scope="col">Percentual</th>
              <th scope="col">Valor do desconto</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venda in minhasSolicitacoes" :key="venda.id_venda">
              <td>#{{ venda.id_venda }}</td>
              <td>{{ formatarData(venda.data_venda) }}</td>
              <td>{{ venda.cliente?.nome ?? 'Não informado' }}</td>
              <td>
                {{ venda.veiculo?.marca ?? '' }} {{ venda.veiculo?.modelo ?? 'Não informado' }}
                {{ venda.veiculo?.placa ? `(${venda.veiculo.placa})` : '' }}
              </td>
              <td>{{ venda.percentual_desconto ?? 'Não informado' }}%</td>
              <td>{{ moeda(venda.valor_desconto) }}</td>
              <td>
                <span :class="['status-badge', `status-badge--${venda.status}`]">
                  {{ rotuloStatus(venda.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="decisaoAberta && eAdmin"
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
          {{ decisaoAberta.tipo === 'aprovar' ? 'Aprovar venda' : 'Reprovar venda' }}
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
          >
            Voltar
          </button>
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
.discount-queue {
  display: grid;
  gap: 1.25rem;
}

.approval-actions {
  display: flex;
  gap: 0.5rem;
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
