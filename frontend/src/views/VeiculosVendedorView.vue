<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute } from 'vue-router'
import {
  atualizarStatusVeiculo,
  listarVeiculos,
  type FiltrosVeiculos,
} from '@/services/veiculos.service'
import { useAuthStore } from '@/stores/auth'
import {
  opcoesCombustivel,
  opcoesStatus,
  rotuloCombustivel,
  type StatusVeiculo,
  type Veiculo,
} from '@/types/veiculo'

type FiltrosVeiculo = {
  marca: string
  modelo: string
  precoMin: string | number
  precoMax: string | number
  anoMin: string | number
  anoMax: string | number
  combustivel: string
  status: StatusVeiculo | ''
}

const filtrosPadrao: FiltrosVeiculo = {
  marca: '',
  modelo: '',
  precoMin: '',
  precoMax: '',
  anoMin: '',
  anoMax: '',
  combustivel: '',
  status: '',
}

const route = useRoute()
const auth = useAuthStore()
const veiculos = ref<Veiculo[]>([])
const filtros = ref<FiltrosVeiculo>({ ...filtrosPadrao })
const filtrosAplicados = ref<FiltrosVeiculo>({ ...filtrosPadrao })
const veiculosFiltrados = computed(() => veiculos.value)
const carregando = ref(false)
const erro = ref('')
const mensagemSucesso = computed(() =>
  route.query.veiculoSalvo === 'editado'
    ? 'Veículo atualizado com sucesso.'
    : route.query.veiculoSalvo === 'cadastrado'
      ? 'Veículo cadastrado com sucesso.'
      : '',
)
const podeGerenciar = computed(() =>
  auth.usuario?.perfil === 'admin' || auth.usuario?.perfil === 'vendedor',
)
const ehAdministrador = computed(() => auth.usuario?.perfil === 'admin')
const rotaLista = computed(() =>
  auth.usuario?.perfil === 'vendedor' ? '/vendedor/veiculos' : '/admin/veiculos',
)
const mensagemValidacao = ref('')
const ultimaConsulta = ref(0)
const veiculoSelecionado = ref<Veiculo | null>(null)
const statusSelecionado = ref<StatusVeiculo>('em_manutencao')
const erroStatus = ref('')
const salvandoStatus = ref(false)
const mensagemStatus = ref('')

function parseNumeroOpcional(valor: string | number): number {
  const texto = String(valor).trim()
  if (!texto) {
    return Number.NaN
  }

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : Number.NaN
}

function validarFiltros(): string | null {
  const precoMin = parseNumeroOpcional(filtros.value.precoMin)
  const precoMax = parseNumeroOpcional(filtros.value.precoMax)
  const anoMin = parseNumeroOpcional(filtros.value.anoMin)
  const anoMax = parseNumeroOpcional(filtros.value.anoMax)

  if (!Number.isNaN(precoMin) && !Number.isNaN(precoMax) && precoMin > precoMax) {
    return 'O preço mínimo não pode ser maior que o preço máximo.'
  }

  if (!Number.isNaN(anoMin) && !Number.isNaN(anoMax) && anoMin > anoMax) {
    return 'O ano inicial não pode ser maior que o ano final.'
  }

  return null
}

function filtrosParaConsulta(): FiltrosVeiculos {
  const atuais = filtrosAplicados.value
  const resultado: FiltrosVeiculos = {}
  const precoMin = parseNumeroOpcional(atuais.precoMin)
  const precoMax = parseNumeroOpcional(atuais.precoMax)
  const anoMin = parseNumeroOpcional(atuais.anoMin)
  const anoMax = parseNumeroOpcional(atuais.anoMax)

  if (atuais.marca.trim()) resultado.marca = atuais.marca.trim()
  if (atuais.modelo.trim()) resultado.modelo = atuais.modelo.trim()
  if (!Number.isNaN(precoMin)) resultado.precoMin = precoMin
  if (!Number.isNaN(precoMax)) resultado.precoMax = precoMax
  if (!Number.isNaN(anoMin)) resultado.anoMin = anoMin
  if (!Number.isNaN(anoMax)) resultado.anoMax = anoMax
  if (atuais.combustivel) resultado.combustivel = atuais.combustivel
  if (atuais.status) resultado.status = atuais.status

  return resultado
}

async function aplicarFiltros() {
  const erroValidacao = validarFiltros()

  if (erroValidacao) {
    mensagemValidacao.value = erroValidacao
    return
  }

  mensagemValidacao.value = ''
  filtrosAplicados.value = { ...filtros.value }
  await carregarVeiculos(filtrosParaConsulta())
}

async function limparFiltros() {
  filtros.value = { ...filtrosPadrao }
  filtrosAplicados.value = { ...filtrosPadrao }
  mensagemValidacao.value = ''
  await carregarVeiculos()
}

function existeBuscaAplicada(): boolean {
  return Object.entries(filtrosAplicados.value).some(([chave, valor]) => {
    if (chave === 'status') return Boolean(valor)
    return typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== '')
  })
}

async function carregarVeiculos(filtrosConsulta: FiltrosVeiculos = {}) {
  const requisicaoAtual = ++ultimaConsulta.value
  carregando.value = true
  erro.value = ''

  try {
    const dados = await listarVeiculos(filtrosConsulta)
    if (requisicaoAtual !== ultimaConsulta.value) {
      return
    }

    veiculos.value = dados
  } catch (error) {
    if (requisicaoAtual !== ultimaConsulta.value) {
      return
    }

    erro.value = isAxiosError(error)
      ? typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Não foi possível carregar os veículos. Tente novamente.'
      : 'Não foi possível carregar os veículos. Tente novamente.'
  } finally {
    if (requisicaoAtual === ultimaConsulta.value) {
      carregando.value = false
    }
  }
}

function statusLegivel(status: StatusVeiculo): string {
  const rotulos: Record<StatusVeiculo, string> = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    vendido: 'Vendido',
    em_manutencao: 'Em manutenção',
  }

  return rotulos[status]
}

function statusPermitidos(status: StatusVeiculo): StatusVeiculo[] {
  if (status === 'disponivel') return ['em_manutencao']
  if (status === 'em_manutencao') return ['disponivel']
  return []
}

function podeAlterarStatus(veiculo: Veiculo): boolean {
  return ehAdministrador.value && statusPermitidos(veiculo.status).length > 0
}

function mensagemErro(error: unknown, fallback: string): string {
  return isAxiosError(error) && typeof error.response?.data?.message === 'string'
    ? error.response.data.message
    : fallback
}

function abrirConfirmacaoStatus(veiculo: Veiculo) {
  veiculoSelecionado.value = veiculo
  statusSelecionado.value = statusPermitidos(veiculo.status)[0] ?? veiculo.status
  erroStatus.value = ''
  mensagemStatus.value = ''
}

function cancelarAlteracaoStatus() {
  veiculoSelecionado.value = null
  erroStatus.value = ''
}

async function confirmarAlteracaoStatus() {
  const veiculo = veiculoSelecionado.value
  if (!veiculo?.id_veiculo) return

  salvandoStatus.value = true
  erroStatus.value = ''

  try {
    await atualizarStatusVeiculo(veiculo.id_veiculo, statusSelecionado.value)
    mensagemStatus.value = `Status do veículo ${veiculo.marca} ${veiculo.modelo} atualizado para ${statusLegivel(statusSelecionado.value)}.`
    veiculoSelecionado.value = null
    await carregarVeiculos(filtrosParaConsulta())
  } catch (error) {
    erroStatus.value = mensagemErro(error, 'Não foi possível alterar o status do veículo.')
  } finally {
    salvandoStatus.value = false
  }
}

function precoLegivel(preco: Veiculo['preco']): string {
  const valor = Number(preco)
  return Number.isFinite(valor)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    : '—'
}

onMounted(() => {
  void carregarVeiculos()
})
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ESTOQUE DE VEÍCULOS</span>
        <h1>Estoque de Veículos</h1>
        <p>Consulte os veículos cadastrados e filtre o estoque por critérios específicos.</p>
      </div>
      <RouterLink
        v-if="podeGerenciar"
        class="button button--gold"
        :to="{ path: `${rotaLista}/cadastrar`, query: route.query }"
      >
        Cadastrar veículo
      </RouterLink>
    </div>

    <div v-if="mensagemSucesso" class="alert alert--success notice" role="status">
      {{ mensagemSucesso }}
    </div>

    <div v-if="erro" class="alert alert--error notice" role="alert">
      {{ erro }}
      <button class="inline-retry" type="button" @click="carregarVeiculos()">Tentar novamente</button>
    </div>

    <div v-if="mensagemStatus" class="alert alert--success notice" role="status">
      {{ mensagemStatus }}
    </div>

    <section class="card filter-card" aria-label="Filtros de veículos">
      <form class="filters" @submit.prevent="aplicarFiltros">
        <div class="field">
          <label for="marca-veiculo">Marca</label>
          <input
            id="marca-veiculo"
            v-model="filtros.marca"
            type="text"
            placeholder="Pesquise pela marca"
            autocomplete="off"
          />
        </div>

        <div class="field">
          <label for="modelo-veiculo">Modelo</label>
          <input
            id="modelo-veiculo"
            v-model="filtros.modelo"
            type="text"
            placeholder="Digite o modelo"
            autocomplete="off"
          />
        </div>

        <div class="field">
          <label for="preco-min">Preço mínimo</label>
          <input id="preco-min" v-model="filtros.precoMin" type="number" min="0" step="0.01" />
        </div>

        <div class="field">
          <label for="preco-max">Preço máximo</label>
          <input id="preco-max" v-model="filtros.precoMax" type="number" min="0" step="0.01" />
        </div>

        <div class="field">
          <label for="ano-min">Ano inicial</label>
          <input id="ano-min" v-model="filtros.anoMin" type="number" min="1886" max="2100" step="1" />
        </div>

        <div class="field">
          <label for="ano-max">Ano final</label>
          <input id="ano-max" v-model="filtros.anoMax" type="number" min="1886" max="2100" step="1" />
        </div>

        <div class="field">
          <label for="combustivel-veiculo">Combustível</label>
          <select id="combustivel-veiculo" v-model="filtros.combustivel">
            <option value="">Todos</option>
            <option v-for="opcao in opcoesCombustivel" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="filtro-status-veiculos">Status</label>
          <select id="filtro-status-veiculos" v-model="filtros.status">
            <option value="">Todos os status</option>
            <option v-for="opcao in opcoesStatus" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </div>

        <div class="filter-actions">
          <button class="primary-button" type="submit">Aplicar filtros</button>
          <button class="secondary-button" type="button" @click="limparFiltros">Limpar filtros</button>
        </div>
      </form>

      <p v-if="mensagemValidacao" class="form-message form-message--error" role="alert">
        {{ mensagemValidacao }}
      </p>

      <p v-if="carregando" class="loading-state" role="status">Carregando veículos...</p>
      <div v-else-if="!erro && veiculosFiltrados.length === 0" class="empty-state">
        {{ existeBuscaAplicada() ? 'Nenhum veículo corresponde aos filtros selecionados.' : 'Nenhum veículo cadastrado.' }}
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Veículo</th>
              <th scope="col">Ano</th>
              <th scope="col">Combustível</th>
              <th scope="col">Quilometragem</th>
              <th scope="col">Preço</th>
              <th scope="col">Status</th>
              <th v-if="podeGerenciar" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="veiculo in veiculosFiltrados" :key="veiculo.id_veiculo">
              <td class="user-primary">
                <div class="vehicle-title">{{ veiculo.marca }} {{ veiculo.modelo }}</div>
                <small>{{ veiculo.versao }}</small>
              </td>
              <td>{{ veiculo.ano }}</td>
              <td>{{ rotuloCombustivel(veiculo.combustivel) }}</td>
              <td>{{ new Intl.NumberFormat('pt-BR').format(veiculo.quilometragem) }} km</td>
              <td>{{ precoLegivel(veiculo.preco) }}</td>
              <td>
                <span class="status-badge" :class="`status-badge--${veiculo.status}`">
                  {{ statusLegivel(veiculo.status) }}
                </span>
              </td>
              <td v-if="podeGerenciar" class="vehicle-actions">
                <RouterLink
                  class="button button--secondary"
                  :to="{
                    path: `${rotaLista}/${veiculo.id_veiculo}/editar`,
                    query: route.query,
                  }"
                >
                  Editar
                </RouterLink>
                <button
                  v-if="podeAlterarStatus(veiculo)"
                  class="button button--secondary status-change-button"
                  type="button"
                  @click="abrirConfirmacaoStatus(veiculo)"
                >
                  Alterar status
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="veiculoSelecionado" class="dialog-backdrop">
      <section
        class="status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-status-titulo"
      >
        <span class="eyebrow">CONFIRMAÇÃO DE ALTERAÇÃO</span>
        <h2 id="confirmacao-status-titulo">Alterar status do veículo</h2>
        <p>
          {{ veiculoSelecionado.marca }} {{ veiculoSelecionado.modelo }}
          ({{ veiculoSelecionado.ano }})
        </p>
        <div class="field">
          <label for="novo-status-veiculo">Novo status</label>
          <select id="novo-status-veiculo" v-model="statusSelecionado">
            <option
              v-for="status in statusPermitidos(veiculoSelecionado.status)"
              :key="status"
              :value="status"
            >
              {{ statusLegivel(status) }}
            </option>
          </select>
        </div>
        <p class="confirmation-message">
          Tem certeza de que deseja alterar o status de
          <strong>{{ statusLegivel(veiculoSelecionado.status) }}</strong> para
          <strong>{{ statusLegivel(statusSelecionado) }}</strong>?
        </p>
        <p v-if="erroStatus" class="status-error" role="alert">{{ erroStatus }}</p>
        <div class="dialog-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="salvandoStatus"
            @click="cancelarAlteracaoStatus"
          >
            Cancelar
          </button>
          <button
            class="primary-button"
            type="button"
            :disabled="salvandoStatus"
            @click="confirmarAlteracaoStatus"
          >
            {{ salvandoStatus ? 'Confirmando...' : 'Confirmar' }}
          </button>
        </div>
      </section>
    </div>

  </section>
</template>

<style scoped>
.status-error {
  color: #9e2c2c !important;
  background: #fff2f0;
  padding: 0.65rem 0.8rem;
  border-radius: 0.6rem;
  font-weight: 600;
}

.vehicle-actions {
  display: flex;
  gap: 0.5rem;
}

.dialog-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(13, 27, 42, 0.55);
}

.status-dialog {
  width: min(100%, 440px);
  padding: 1.5rem;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 60px rgba(13, 27, 42, 0.24);
}

.status-dialog h2 {
  margin: 0.4rem 0;
  color: #183b5f;
}

.status-dialog > p {
  color: #4b5d78;
}

.confirmation-message {
  margin: 1rem 0;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.dialog-actions button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-heading h1 {
  margin: 0.25rem 0;
  color: #0d1b2a;
}

.eyebrow {
  color: #355c7d;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-heading p {
  margin: 0;
  color: #4b5d78;
}

.card {
  background: #fff;
  border: 1px solid #dfe7f2;
  border-radius: 1rem;
  box-shadow: 0 12px 30px rgba(13, 27, 42, 0.04);
}

.filter-card {
  padding: 1.25rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1d3557;
}

.field input,
.field select {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid #c9d6e6;
  border-radius: 0.75rem;
  background: #f8fbff;
  color: #13263d;
  font: inherit;
}

.field input:focus,
.field select:focus {
  outline: 2px solid rgba(21, 67, 118, 0.2);
  border-color: #1f4d7a;
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.primary-button,
.secondary-button,
.inline-retry {
  appearance: none;
  border: none;
  border-radius: 0.75rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.primary-button {
  background: linear-gradient(135deg, #0f3b66, #183f6d);
  color: #fff;
  padding: 0.75rem 1.2rem;
}

.secondary-button {
  background: #edf4ff;
  color: #103a62;
  padding: 0.75rem 1.2rem;
}

.primary-button:hover,
.secondary-button:hover,
.inline-retry:hover {
  filter: brightness(0.98);
}

.form-message {
  margin: 1rem 0 0;
  padding: 0.8rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
}

.form-message--error {
  background: #fff2f0;
  color: #9e2c2c;
  border: 1px solid #f4c5bf;
}

.loading-state,
.empty-state {
  margin: 1rem 0 0;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f4f7fb;
  color: #25476f;
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.data-table th,
.data-table td {
  padding: 0.9rem 0.8rem;
  border-bottom: 1px solid #e5edf7;
  text-align: left;
  vertical-align: middle;
}

.data-table thead th {
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5b7797;
  background: #f6f9fd;
}

.user-primary {
  min-width: 210px;
}

.vehicle-title {
  font-weight: 700;
  color: #183b5f;
}

.user-primary small {
  color: #627b99;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.status-badge--disponivel {
  background: #eafaf2;
  color: #1f7a4c;
  border-color: #bce6cd;
}

.status-badge--reservado {
  background: #fff6dd;
  color: #8b6500;
  border-color: #f2d88b;
}

.status-badge--vendido {
  background: #e8eefc;
  color: #294a9f;
  border-color: #bfd2ff;
}

.status-badge--em_manutencao {
  background: #f9e9f7;
  color: #7a3d7d;
  border-color: #e8c7ef;
}

@media (max-width: 960px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-heading {
    margin-bottom: 1rem;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: stretch;
    flex-direction: column;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
