<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { listarClientes } from '@/services/clientes.service'
import type { Cliente } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import type { Veiculo } from '@/types/veiculo'
import { cadastrarVenda } from '@/services/vendas.service'
import type { FormaPagamento } from '@/services/vendas.service'
import { listarUsuarios } from '@/services/usuarios.service'
import type { Usuario } from '@/services/usuarios.service'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const clientes = ref<Cliente[]>([])
const veiculos = ref<Veiculo[]>([])
const vendedores = ref<Usuario[]>([])
const idCliente = ref('')
const idVeiculo = ref('')
const idUsuarioResponsavel = ref('')
const formaPagamento = ref<FormaPagamento>('a_vista')
const percentualDesconto = ref(0)
const carregandoDados = ref(false)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')
const eAdmin = computed(() => auth.usuario?.perfil === 'admin')

const veiculosDisponiveis = computed(() =>
  veiculos.value.filter((veiculo) => veiculo.status === 'disponivel'),
)

const clienteSelecionado = computed(() =>
  clientes.value.find((cliente) => cliente.id_cliente === Number(idCliente.value)),
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
    const [listaClientes, listaVeiculos, listaUsuarios] = await Promise.all([
      listarClientes(),
      listarVeiculos(),
      eAdmin.value ? listarUsuarios() : Promise.resolve([]),
    ])
    clientes.value = listaClientes.filter((cliente) => cliente.ativo)
    veiculos.value = listaVeiculos
    vendedores.value = listaUsuarios.filter(
      (usuario) => usuario.perfil === 'vendedor' && usuario.ativo,
    )
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    carregandoDados.value = false
  }
}

async function registrarVenda() {
  if (salvando.value) return

  erro.value = ''
  sucesso.value = ''

  if (!idCliente.value || !idVeiculo.value) {
    erro.value = 'Selecione um cliente e um veículo disponível.'
    return
  }

  if (eAdmin.value && !idUsuarioResponsavel.value) {
    erro.value = 'Selecione um vendedor responsável.'
    return
  }

  if (
    !Number.isFinite(percentualDesconto.value) ||
    percentualDesconto.value < 0 ||
    percentualDesconto.value > 100
  ) {
    erro.value = 'O desconto deve estar entre 0% e 100%.'
    return
  }

  salvando.value = true
  try {
    const venda = await cadastrarVenda({
      id_cliente: Number(idCliente.value),
      id_veiculo: Number(idVeiculo.value),
      ...(eAdmin.value ? { id_usuario_responsavel: Number(idUsuarioResponsavel.value) } : {}),
      forma_pagamento: formaPagamento.value,
      percentual_desconto: Number(percentualDesconto.value),
    })

    sucesso.value =
      venda.status === 'pendente'
        ? `Solicitação de desconto da venda #${venda.id_venda} enviada para aprovação.`
        : `Venda #${venda.id_venda} registrada com sucesso. Valor final: ${moeda(venda.valor_final)}.`
    idCliente.value = ''
    idVeiculo.value = ''
    idUsuarioResponsavel.value = ''
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
        <span class="eyebrow">{{ eAdmin ? 'MÓDULO DE GESTÃO' : 'ÁREA DO VENDEDOR' }}</span>
        <h1>Registrar venda</h1>
        <p>Selecione o cliente e um veículo disponível para registrar a venda.</p>
      </div>
    </div>

    <p v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</p>
    <p v-if="sucesso" class="alert alert--success notice" role="status">{{ sucesso }}</p>

    <form class="card sale-form-card" @submit.prevent="registrarVenda">
      <p v-if="carregandoDados" class="loading-state" role="status">Carregando clientes e veículos...</p>
      <template v-else>
        <div class="sale-layout">
          <div class="sale-fields">
            <section class="sale-section" aria-labelledby="identificacao-venda">
              <div class="sale-section-heading">
                <span class="sale-section-number">1</span>
                <div>
                  <h2 id="identificacao-venda">Identificação da venda</h2>
                  <p v-if="eAdmin">Selecione o vendedor responsável por esta venda.</p>
                  <p v-else>O vendedor responsável é definido automaticamente como o usuário atual.</p>
                </div>
              </div>

              <div v-if="eAdmin" class="field">
                <label for="vendedor-responsavel">Vendedor responsável</label>
                <select id="vendedor-responsavel" v-model="idUsuarioResponsavel" required>
                  <option disabled value="">Selecione um vendedor ativo</option>
                  <option
                    v-for="vendedor in vendedores"
                    :key="vendedor.id_usuario"
                    :value="String(vendedor.id_usuario)"
                  >
                    {{ vendedor.nome }}
                  </option>
                </select>
                <p v-if="vendedores.length === 0" class="field-help">
                  Não há vendedores ativos disponíveis para atribuir esta venda.
                </p>
              </div>
            </section>

            <section class="sale-section" aria-labelledby="dados-participantes">
              <div class="sale-section-heading">
                <span class="sale-section-number">2</span>
                <div>
                  <h2 id="dados-participantes">Cliente e veículo</h2>
                  <p>Informe as partes principais da negociação.</p>
                </div>
              </div>

              <div class="sale-field-grid">
                <div class="field">
                  <label for="cliente-venda">Cliente</label>
                  <select id="cliente-venda" v-model="idCliente" required>
                    <option disabled value="">Selecione um cliente ativo</option>
                    <option v-for="cliente in clientes" :key="cliente.id_cliente" :value="String(cliente.id_cliente)">
                      {{ cliente.nome }} — CPF {{ cliente.cpf }}
                    </option>
                  </select>
                  <p v-if="clientes.length === 0" class="field-help">Não há clientes ativos disponíveis. Cadastre ou ative um cliente antes de registrar a venda.</p>
                  <p v-else-if="clienteSelecionado" class="selection-preview">
                    Cliente selecionado: <strong>{{ clienteSelecionado.nome }}</strong>
                  </p>
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
                  <p v-else-if="veiculoSelecionado" class="selection-preview">
                    {{ veiculoSelecionado.marca }} {{ veiculoSelecionado.modelo }} · {{ veiculoSelecionado.placa }}
                  </p>
                </div>
              </div>
            </section>

            <section class="sale-section" aria-labelledby="condicoes-comerciais">
              <div class="sale-section-heading">
                <span class="sale-section-number">3</span>
                <div>
                  <h2 id="condicoes-comerciais">Condições comerciais</h2>
                  <p>Defina o pagamento e o desconto da venda.</p>
                </div>
              </div>

              <div class="sale-field-grid">
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
                  <div class="percentage-input">
                    <input id="desconto-venda" v-model.number="percentualDesconto" type="number" min="0" max="100" step="0.01" required />
                    <span aria-hidden="true">%</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside class="sale-summary" aria-label="Resumo financeiro da venda">
            <div class="sale-summary-heading">
              <span>Resumo financeiro</span>
              <span class="sale-summary-status" :class="{ 'sale-summary-status--ready': veiculoSelecionado }">
                {{ veiculoSelecionado ? 'Atualizado' : 'Aguardando veículo' }}
              </span>
            </div>
            <dl>
              <div><dt>Valor do veículo</dt><dd>{{ moeda(precoVeiculo) }}</dd></div>
              <div><dt>Desconto</dt><dd>{{ moeda(valorDesconto) }} <small>{{ Number(percentualDesconto || 0).toLocaleString('pt-BR') }}%</small></dd></div>
              <div class="sale-summary-total"><dt>Valor final estimado</dt><dd>{{ moeda(valorFinal) }}</dd></div>
            </dl>
          </aside>
        </div>

        <div class="form-actions sale-actions">
          <RouterLink class="button button--secondary" :to="eAdmin ? '/admin/vendas' : '/vendedor'">Cancelar</RouterLink>
          <button class="button button--primary" type="submit" :disabled="salvando || clientes.length === 0 || veiculosDisponiveis.length === 0 || (eAdmin && vendedores.length === 0)">
            {{ salvando ? 'Registrando venda...' : 'Registrar venda' }}
          </button>
        </div>
      </template>
    </form>
  </section>
</template>

<style scoped>
.sale-form-card {
  padding: 0;
  overflow: hidden;
}

.sale-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
}

.sale-fields {
  min-width: 0;
}

.sale-section {
  padding: 24px;
  border-bottom: 1px solid #edf1f6;
}

.sale-section:last-child {
  border-bottom: 0;
}

.sale-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.sale-section-heading h2,
.sale-section-heading p {
  margin: 0;
}

.sale-section-heading h2 {
  color: var(--color-text);
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.sale-section-heading p {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.sale-section-number {
  display: inline-grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-navy);
  background: #f5ead0;
  font-size: 0.75rem;
  font-weight: 800;
}

.sale-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field-help,
.selection-preview {
  min-height: 18px;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.75rem;
}

.selection-preview strong {
  color: var(--color-text);
}

.percentage-input {
  position: relative;
}

.percentage-input input {
  padding-right: 38px;
}

.percentage-input span {
  position: absolute;
  top: 50%;
  right: 12px;
  color: var(--color-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.sale-summary {
  position: sticky;
  top: 24px;
  margin: 24px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.sale-summary-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e3e9f1;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 800;
}

.sale-summary-status {
  color: var(--color-muted);
  font-size: 0.6875rem;
  font-weight: 700;
}

.sale-summary-status--ready {
  color: var(--color-success);
}

.sale-summary dl {
  margin: 0;
}

.sale-summary dl div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
}

.sale-summary dt {
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.sale-summary dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 700;
  text-align: right;
}

.sale-summary dd small {
  display: block;
  color: var(--color-muted);
  font-size: 0.6875rem;
  font-weight: 600;
}

.sale-summary dl .sale-summary-total {
  align-items: flex-end;
  margin-top: 4px;
  padding: 18px 0 2px;
  border-top: 1px solid #e3e9f1;
}

.sale-summary-total dt {
  max-width: 90px;
  color: var(--color-text);
  font-weight: 700;
}

.sale-summary-total dd {
  color: var(--color-navy);
  font-size: 1.35rem;
  line-height: 1.1;
}

.sale-actions {
  margin: 0;
  padding: 18px 24px;
  border-top: 1px solid #edf1f6;
  background: #fbfcfe;
}

.button--primary {
  color: var(--color-navy);
  background: var(--color-gold);
  border-color: var(--color-gold);
}

.button--primary:hover:not(:disabled) {
  background: var(--color-gold-hover);
  border-color: var(--color-gold-hover);
}

@media (max-width: 1050px) {
  .sale-layout {
    grid-template-columns: minmax(0, 1fr) 270px;
  }

  .sale-field-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .sale-layout {
    grid-template-columns: 1fr;
  }

  .sale-summary {
    position: static;
    margin: 0 24px 24px;
  }
}

@media (max-width: 600px) {
  .sale-section {
    padding: 20px 16px;
  }

  .sale-section-heading {
    margin-bottom: 16px;
  }

  .sale-summary {
    margin: 0 16px 16px;
  }

  .sale-actions {
    padding: 16px;
  }
}

@media (max-width: 430px) {
  .sale-actions {
    flex-direction: column-reverse;
  }

  .sale-actions .button {
    width: 100%;
  }

  .sale-summary dl div {
    align-items: flex-start;
  }
}
</style>