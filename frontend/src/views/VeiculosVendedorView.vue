<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { listarVeiculos } from '@/services/veiculos.service'
import type { Veiculo, StatusVeiculo } from '@/types/veiculo'

const veiculos = ref<Veiculo[]>([])
const busca = ref('')
const filtroStatus = ref<StatusVeiculo | ''>('')
const carregando = ref(false)
const erro = ref('')

const veiculosFiltrados = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')

  return veiculos.value.filter((veiculo) => {
    const correspondeBusca =
      !termo ||
      `${veiculo.marca} ${veiculo.modelo} ${veiculo.versao}`
        .toLocaleLowerCase('pt-BR')
        .includes(termo) ||
      veiculo.placa.toLocaleLowerCase('pt-BR').includes(termo)
    const correspondeStatus = !filtroStatus.value || veiculo.status === filtroStatus.value

    return correspondeBusca && correspondeStatus
  })
})

async function carregarVeiculos() {
  carregando.value = true
  erro.value = ''

  try {
    veiculos.value = await listarVeiculos()
  } catch (error) {
    erro.value = isAxiosError(error)
      ? (typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Não foi possível carregar os veículos. Tente novamente.')
      : 'Não foi possível carregar os veículos. Tente novamente.'
  } finally {
    carregando.value = false
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

function precoLegivel(preco: Veiculo['preco']): string {
  const valor = Number(preco)
  return Number.isFinite(valor)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    : '—'
}

onMounted(carregarVeiculos)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ÁREA DO VENDEDOR</span>
        <h1>Veículos e estoque</h1>
        <p>Consulte os veículos cadastrados e sua disponibilidade.</p>
      </div>
    </div>

    <div v-if="erro" class="alert alert--error notice" role="alert">
      {{ erro }}
      <button class="inline-retry" type="button" @click="carregarVeiculos">Tentar novamente</button>
    </div>

    <section class="card filter-card" aria-label="Filtros de veículos">
      <div class="filters">
        <div class="field search-field">
          <label for="busca-veiculos">Pesquisar</label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="busca-veiculos"
            v-model="busca"
            type="search"
            placeholder="Marca, modelo ou placa"
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="filtro-status-veiculos">Disponibilidade</label>
          <select id="filtro-status-veiculos" v-model="filtroStatus">
            <option value="">Todos os status</option>
            <option value="disponivel">Disponível</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
            <option value="em_manutencao">Em manutenção</option>
          </select>
        </div>
      </div>

      <p v-if="carregando" class="loading-state" role="status">Carregando veículos...</p>
      <div v-else-if="!erro && veiculosFiltrados.length === 0" class="empty-state">
        {{
          veiculos.length
            ? 'Nenhum veículo corresponde aos filtros.'
            : 'Nenhum veículo cadastrado.'
        }}
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Veículo</th>
              <th scope="col">Ano</th>
              <th scope="col">Quilometragem</th>
              <th scope="col">Preço</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="veiculo in veiculosFiltrados" :key="veiculo.id_veiculo">
              <td class="user-primary">{{ veiculo.marca }} {{ veiculo.modelo }} {{ veiculo.versao }}</td>
              <td>{{ veiculo.ano }}</td>
              <td>{{ new Intl.NumberFormat('pt-BR').format(veiculo.quilometragem) }} km</td>
              <td>{{ precoLegivel(veiculo.preco) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="
                    veiculo.status === 'disponivel'
                      ? 'status-badge--active'
                      : 'status-badge--inactive'
                  "
                >
                  {{ statusLegivel(veiculo.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
