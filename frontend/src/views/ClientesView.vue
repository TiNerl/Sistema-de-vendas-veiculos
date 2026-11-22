<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { useRouter } from 'vue-router'
import { inativarCliente, listarClientes } from '@/services/clientes.service'
import type { Cliente } from '@/services/clientes.service'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const clientes = ref<Cliente[]>([])
const busca = ref('')
const clienteSelecionado = ref<Cliente | null>(null)
const clienteParaInativar = ref<Cliente | null>(null)
const carregando = ref(false)
const inativando = ref(false)
const erro = ref('')
const erroInativacao = ref('')
const mensagemSucesso = ref('')

let temporizadorBusca: ReturnType<typeof setTimeout> | undefined
let requisicaoAtual = 0

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const message: unknown = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }
  return 'Não foi possível carregar os clientes. Tente novamente.'
}

async function carregarClientes(termo: string) {
  const requisicao = ++requisicaoAtual
  carregando.value = true
  erro.value = ''

  try {
    const resultados = await listarClientes(termo || undefined)
    if (requisicao === requisicaoAtual) clientes.value = resultados
  } catch (error) {
    if (requisicao === requisicaoAtual) erro.value = mensagemErro(error)
  } finally {
    if (requisicao === requisicaoAtual) carregando.value = false
  }
}

function tentarNovamente() {
  if (temporizadorBusca) clearTimeout(temporizadorBusca)
  void carregarClientes(normalizarBusca(busca.value))
}

function normalizarBusca(valor: string): string {
  const termo = valor.trim()
  const somenteDigitos = termo.replace(/\D/g, '')
  return /^\d[\d.\-/\s]*$/.test(termo) && somenteDigitos ? somenteDigitos : termo
}

function formatarCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11) return cpf
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length === 11) {
    return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digitos.length === 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return telefone
}

function formatarCep(cep: string): string {
  const digitos = cep.replace(/\D/g, '')
  return digitos.length === 8 ? digitos.replace(/(\d{5})(\d{3})/, '$1-$2') : cep
}

function rotaEdicao(id: number): string {
  return auth.usuario?.perfil === 'vendedor'
    ? `/vendedor/clientes/${id}/editar`
    : `/admin/clientes/${id}/editar`
}

function rotaHistorico(clienteId: number): string {
  const rota = auth.usuario?.perfil === 'vendedor'
    ? '/vendedor/vendas/historico'
    : '/admin/vendas'
  return `${rota}?cliente_id=${clienteId}`
}

function abrirConfirmacaoInativacao(cliente: Cliente) {
  clienteParaInativar.value = cliente
  erroInativacao.value = ''
  mensagemSucesso.value = ''
}

function fecharConfirmacaoInativacao() {
  if (!inativando.value) clienteParaInativar.value = null
}

function mensagemErroInativacao(error: unknown): string {
  if (isAxiosError(error)) {
    const message: unknown = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }
  return 'Não foi possível inativar o cliente. Tente novamente.'
}

async function confirmarInativacao() {
  const cliente = clienteParaInativar.value
  if (!cliente || !cliente.ativo || inativando.value) return

  inativando.value = true
  erroInativacao.value = ''
  mensagemSucesso.value = ''

  try {
    await inativarCliente(cliente.id_cliente)
    clienteParaInativar.value = null
    mensagemSucesso.value = `${cliente.nome} foi inativado. O histórico de compras foi preservado.`
    await carregarClientes(normalizarBusca(busca.value))
  } catch (error) {
    erroInativacao.value = mensagemErroInativacao(error)
  } finally {
    inativando.value = false
  }
}

watch(busca, (valor) => {
  if (temporizadorBusca) clearTimeout(temporizadorBusca)
  temporizadorBusca = setTimeout(() => {
    void carregarClientes(normalizarBusca(valor))
  }, 300)
})

onMounted(() => {
  void carregarClientes('')
})

onUnmounted(() => {
  if (temporizadorBusca) clearTimeout(temporizadorBusca)
  requisicaoAtual += 1
})
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">GESTÃO DE CLIENTES</span>
        <h1>Clientes</h1>
        <p>Consulte os clientes cadastrados e seus dados de contato.</p>
      </div>
      <RouterLink
        class="button button--gold"
        :to="auth.usuario?.perfil === 'vendedor' ? '/vendedor/clientes/cadastrar' : '/admin/clientes/cadastrar'"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14m-7-7h14" />
        </svg>
        Cadastrar cliente
      </RouterLink>
    </div>

    <div v-if="erro" class="alert alert--error notice" role="alert">
      {{ erro }}
      <button class="inline-retry" type="button" @click="tentarNovamente">
        Tentar novamente
      </button>
    </div>
    <div v-if="mensagemSucesso" class="alert alert--success notice" role="status">
      {{ mensagemSucesso }}
    </div>
    <section class="card filter-card" aria-label="Pesquisa de clientes">
      <div class="field search-field client-search">
        <label for="busca-clientes">Pesquisar clientes</label>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          id="busca-clientes"
          v-model="busca"
          type="search"
          placeholder="Nome, CPF ou e-mail"
          autocomplete="off"
        />
      </div>

      <p v-if="carregando" class="loading-state" role="status">Carregando clientes...</p>
      <div v-else-if="!erro && clientes.length === 0" class="empty-state">
        {{ busca.trim() ? 'Nenhum cliente encontrado para essa pesquisa.' : 'Nenhum cliente cadastrado.' }}
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">CPF</th>
              <th scope="col">Telefone</th>
              <th scope="col">E-mail</th>
              <th scope="col">Situação</th>
              <th scope="col">Detalhes</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in clientes" :key="cliente.id_cliente">
              <td class="user-primary">{{ cliente.nome }}</td>
              <td>{{ formatarCpf(cliente.cpf) }}</td>
              <td>{{ formatarTelefone(cliente.telefone) }}</td>
              <td>{{ cliente.email }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="cliente.ativo ? 'status-badge--active' : 'status-badge--inactive'"
                >
                  {{ cliente.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <button
                  class="table-action"
                  type="button"
                  :aria-label="`Ver detalhes de ${cliente.nome}`"
                  @click="clienteSelecionado = cliente"
                >
                  Ver detalhes
                </button>
              </td>
              <td>
                <button
                  class="table-action"
                  type="button"
                  :aria-label="`Editar ${cliente.nome}`"
                  @click="router.push(rotaEdicao(cliente.id_cliente))"
                >
                  Editar
                </button>
                <span v-if="cliente.ativo" aria-hidden="true"> · </span>
                <button
                  v-if="cliente.ativo"
                  class="table-action"
                  type="button"
                  :aria-label="`Inativar ${cliente.nome}`"
                  :disabled="inativando"
                  @click="abrirConfirmacaoInativacao(cliente)"
                >
                  Inativar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="clienteSelecionado"
      class="modal-backdrop"
      @click.self="clienteSelecionado = null"
      @keydown.esc="clienteSelecionado = null"
    >
      <section
        class="confirm-dialog client-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cliente-detalhes-titulo"
      >
        <div class="client-details-heading">
          <div>
            <span class="eyebrow">CADASTRO DO CLIENTE</span>
            <h2 id="cliente-detalhes-titulo">{{ clienteSelecionado.nome }}</h2>
          </div>
          <button
            class="icon-button"
            type="button"
            aria-label="Fechar detalhes"
            @click="clienteSelecionado = null"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <dl class="client-details-grid">
          <div>
            <dt>CPF</dt>
            <dd>{{ formatarCpf(clienteSelecionado.cpf) }}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>{{ clienteSelecionado.ativo ? 'Ativo' : 'Inativo' }}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{{ formatarTelefone(clienteSelecionado.telefone) }}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{{ clienteSelecionado.email }}</dd>
          </div>
          <div class="client-details-address">
            <dt>Endereço</dt>
            <dd>
              {{ clienteSelecionado.endereco }}, {{ clienteSelecionado.cidade }} -
              {{ clienteSelecionado.estado }}, CEP {{ formatarCep(clienteSelecionado.cep) }}
            </dd>
          </div>
        </dl>

        <div class="history-section">
          <RouterLink
            class="button button--secondary"
            :to="rotaHistorico(clienteSelecionado.id_cliente)"
          >
            Histórico de compras
          </RouterLink>
        </div>

        <div class="dialog-actions">
          <RouterLink
            class="button button--gold"
            :to="rotaEdicao(clienteSelecionado.id_cliente)"
          >
            Editar cliente
          </RouterLink>
          <button
            class="button button--secondary"
            type="button"
            @click="clienteSelecionado = null"
          >
            Fechar
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="clienteParaInativar"
      class="modal-backdrop"
      @click.self="fecharConfirmacaoInativacao"
    >
      <section
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-inativacao-cliente-titulo"
        aria-describedby="confirmar-inativacao-cliente-descricao"
      >
        <h2 id="confirmar-inativacao-cliente-titulo">Confirmar inativação</h2>
        <p id="confirmar-inativacao-cliente-descricao" class="confirm-copy">
          Confirma a inativação de
          <span class="confirm-name">{{ clienteParaInativar.nome }}</span>?
          A situação cadastral será alterada, sem excluir vendas ou o histórico de compras.
        </p>
        <div v-if="erroInativacao" class="alert alert--error" role="alert">
          {{ erroInativacao }}
        </div>
        <div class="dialog-actions">
          <button
            class="button button--secondary"
            type="button"
            :disabled="inativando"
            @click="fecharConfirmacaoInativacao"
          >
            Cancelar
          </button>
          <button
            class="button button--danger"
            type="button"
            :disabled="inativando"
            @click="confirmarInativacao"
          >
            <span v-if="inativando" class="spinner" aria-hidden="true"></span>
            {{ inativando ? 'Inativando...' : 'Confirmar inativação' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
