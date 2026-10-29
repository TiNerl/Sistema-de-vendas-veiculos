<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { listarClientes } from '@/services/clientes.service'
import type { Cliente } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import type { Veiculo } from '@/types/veiculo'
import { cadastrarVenda } from '@/services/vendas.service'
import type { FormaPagamento } from '@/services/vendas.service'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const clientes = ref<Cliente[]>([])
const veiculos = ref<Veiculo[]>([])
const idCliente = ref('')
const idVeiculo = ref('')
const formaPagamento = ref<FormaPagamento>('a_vista')
const percentualDesconto = ref(0)
const carregandoDados = ref(false)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')

const veiculosDisponiveis = computed(() =>
  veiculos.value.filter((veiculo) => veiculo.status === 'disponivel'),
)

const veiculoSelecionado = computed(() =>
  veiculosDisponiveis.value.find((veiculo) => veiculo.id_veiculo === Number(idVeiculo.value)),
)

const precoVeiculo = computed(() => Number(veiculoSelecionado.value?.preco ?? 0))
const valorDesconto = computed(() => (precoVeiculo.value * Number(percentualDesconto.value || 0)) / 100)
const valorFinal = computed(() => Math.max(0, precoVeiculo.value - valorDesconto.value))

function moeda(valor: number | string | undefined): string {
  const numero = Number(valor ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero)
}

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(' ')
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

async function carregarDados() {
  carregandoDados.value = true
  erro.value = ''

  try {
    const [listaClientes, listaVeiculos] = await Promise.all([listarClientes(), listarVeiculos()])
    clientes.value = listaClientes.filter((cliente) => cliente.ativo)
    veiculos.value = listaVeiculos
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    carregandoDados.value = false
  }
}

async function registrarVenda() {
  erro.value = ''
  sucesso.value = ''

  if (!idCliente.value || !idVeiculo.value) {
    erro.value = 'Selecione um cliente e um veículo disponível.'
    return
  }

  if (percentualDesconto.value < 0 || percentualDesconto.value > 100) {
    erro.value = 'O desconto deve estar entre 0% e 100%.'
    return
  }

  salvando.value = true
  try {
    const venda = await cadastrarVenda({
      id_cliente: Number(idCliente.value),
      id_veiculo: Number(idVeiculo.value),
      forma_pagamento: formaPagamento.value,
      percentual_desconto: Number(percentualDesconto.value),
    })

    sucesso.value = `Venda #${venda.id_venda} registrada com sucesso. Valor final: ${moeda(venda.valor_final)}.`
    idCliente.value = ''
    idVeiculo.value = ''
    formaPagamento.value = 'a_vista'
    percentualDesconto.value = 0
    await carregarDados()
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    salvando.value = false
  }
}

onMounted(carregarDados)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ÁREA DO VENDEDOR</span>
        <h1>Registrar venda</h1>
        <p>Selecione o cliente e um veículo disponível para registrar a venda.</p>
      </div>
    </div>

    <p v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</p>
    <p v-if="sucesso" class="alert alert--success notice" role="status">{{ sucesso }}</p>

    <form class="card form-card" @submit.prevent="registrarVenda">
      <p v-if="carregandoDados" class="loading-state" role="status">Carregando clientes e veículos...</p>
      <template v-else>
        <div class="form-section-heading">
          <h2>Dados da venda</h2>
          <p>O vendedor responsável é identificado pela sessão autenticada.</p>
        </div>

        <div class="field">
          <label for="vendedor-responsavel">Vendedor responsável</label>
          <input
            id="vendedor-responsavel"
            :value="auth.usuario?.nome ?? auth.usuario?.cpf ?? 'Usuário autenticado'"
            readonly
          />
        </div>

        <div class="field">
          <label for="cliente-venda">Cliente</label>
          <select id="cliente-venda" v-model="idCliente" required>
            <option disabled value="">Selecione um cliente ativo</option>
            <option v-for="cliente in clientes" :key="cliente.id_cliente" :value="String(cliente.id_cliente)">
              {{ cliente.nome }} — CPF {{ cliente.cpf }}
            </option>
          </select>
          <p v-if="clientes.length === 0" class="field-help">Não há clientes ativos disponíveis. Cadastre ou ative um cliente antes de registrar a venda.</p>
        </div>

        <div class="field">
          <label for="veiculo-venda">Veículo disponível</label>
          <select id="veiculo-venda" v-model="idVeiculo" required @change="percentualDesconto = 0">
            <option disabled value="">Selecione um veículo</option>
            <option v-for="veiculo in veiculosDisponiveis" :key="veiculo.id_veiculo" :value="String(veiculo.id_veiculo)">
              {{ veiculo.marca }} {{ veiculo.modelo }} {{ veiculo.versao }} — {{ veiculo.placa }} — {{ moeda(veiculo.preco) }}
            </option>
          </select>
          <p v-if="veiculosDisponiveis.length === 0" class="field-help">Não há veículos disponíveis para venda no estoque.</p>
        </div>

        <div class="field">
          <label for="forma-pagamento">Forma de pagamento</label>
          <select id="forma-pagamento" v-model="formaPagamento" required>
            <option value="a_vista">À vista</option>
            <option value="pix">PIX</option>
            <option value="financiamento">Financiamento</option>
            <option value="consorcio">Consórcio</option>
          </select>
        </div>

        <div class="field">
          <label for="desconto-venda">Desconto (%)</label>
          <input id="desconto-venda" v-model.number="percentualDesconto" type="number" min="0" max="100" step="0.01" required />
        </div>

        <section class="sale-summary" aria-label="Resumo financeiro da venda">
          <h2>Resumo financeiro</h2>
          <dl>
            <div><dt>Valor do veículo</dt><dd>{{ moeda(precoVeiculo) }}</dd></div>
            <div><dt>Desconto</dt><dd>{{ moeda(valorDesconto) }} ({{ Number(percentualDesconto || 0).toLocaleString('pt-BR') }}%)</dd></div>
            <div><dt>Valor final estimado</dt><dd><strong>{{ moeda(valorFinal) }}</strong></dd></div>
          </dl>
        </section>

        <div class="form-actions">
          <RouterLink class="button button--secondary" to="/vendedor">Cancelar</RouterLink>
          <button class="button button--primary" type="submit" :disabled="salvando || clientes.length === 0 || veiculosDisponiveis.length === 0">
            {{ salvando ? 'Registrando venda...' : 'Registrar venda' }}
          </button>
        </div>
      </template>
    </form>
  </section>
</template>