<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute, useRouter } from 'vue-router'
import {
  buscarVeiculo,
  cadastrarVeiculo,
  atualizarVeiculo,
} from '@/services/veiculos.service'
import { useAuthStore } from '@/stores/auth'
import { opcoesCambio, opcoesCombustivel } from '@/types/veiculo'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const edicao = computed(() => typeof route.params.id === 'string')
const titulo = computed(() => (edicao.value ? 'Editar Veículo' : 'Cadastrar Veículo'))
const rotaLista = computed(() =>
  auth.usuario?.perfil === 'vendedor' ? '/vendedor/veiculos' : '/admin/veiculos',
)

const carregando = ref(false)
const enviando = ref(false)
const sucesso = ref(false)
const erro = ref('')
const veiculoCarregado = ref(false)
const consultaAtual = ref(0)

const errosCampos = reactive({
  marca: '',
  modelo: '',
  versao: '',
  ano: '',
  cor: '',
  quilometragem: '',
  combustivel: '',
  cambio: '',
  placa: '',
  chassi: '',
  renavam: '',
  preco: '',
})

const formulario = reactive({
  marca: '',
  modelo: '',
  versao: '',
  ano: new Date().getFullYear(),
  cor: '',
  quilometragem: '',
  combustivel: '',
  cambio: '',
  placa: '',
  chassi: '',
  renavam: '',
  preco: '',
})

function limparErros() {
  Object.keys(errosCampos).forEach((chave) => {
    errosCampos[chave as keyof typeof errosCampos] = ''
  })
  erro.value = ''
}

function normalizarString(valor: string): string {
  return valor.trim()
}

function formatarPrecoParaInput(valor: number | string): string {
  if (valor === null || valor === undefined || valor === '') return ''
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return ''
  return numero.toFixed(2)
}

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const mensagem = error.response?.data?.message
    if (typeof mensagem === 'string') return mensagem
    if (Array.isArray(mensagem) && mensagem.every((item) => typeof item === 'string')) {
      return mensagem.join(' ')
    }
    if (error.response?.status === 404) return 'Veículo não encontrado.'
  }
  return `Não foi possível ${edicao.value ? 'salvar as alterações' : 'cadastrar o veículo'}. Tente novamente.`
}

function definirFormulario(dados: {
  marca: string
  modelo: string
  versao?: string
  ano: number
  cor: string
  quilometragem: number
  combustivel: string
  cambio: string
  placa: string
  chassi: string
  renavam: string
  preco: number | string
}) {
  formulario.marca = dados.marca ?? ''
  formulario.modelo = dados.modelo ?? ''
  formulario.versao = dados.versao ?? ''
  formulario.ano = Number(dados.ano ?? new Date().getFullYear())
  formulario.cor = dados.cor ?? ''
  formulario.quilometragem = String(dados.quilometragem ?? '')
  formulario.combustivel = String(dados.combustivel ?? '').toLowerCase()
  formulario.cambio = String(dados.cambio ?? '').toLowerCase()
  formulario.placa = String(dados.placa ?? '')
  formulario.chassi = String(dados.chassi ?? '')
  formulario.renavam = String(dados.renavam ?? '')
  formulario.preco = formatarPrecoParaInput(dados.preco ?? '')
  veiculoCarregado.value = true
}

async function carregarVeiculo() {
  const id = typeof route.params.id === 'string' ? Number(route.params.id) : Number.NaN
  if (!Number.isSafeInteger(id) || id < 1) {
    erro.value = 'O identificador do veículo é inválido.'
    return
  }

  const requisicao = ++consultaAtual.value
  carregando.value = true
  erro.value = ''
  veiculoCarregado.value = false

  try {
    const dados = await buscarVeiculo(id)
    if (requisicao === consultaAtual.value) {
      definirFormulario(dados)
    }
  } catch (error) {
    if (requisicao === consultaAtual.value) {
      erro.value = mensagemErro(error)
    }
  } finally {
    if (requisicao === consultaAtual.value) {
      carregando.value = false
    }
  }
}

function validar(): boolean {
  limparErros()

  const anoAtual = new Date().getFullYear()
  const placa = formulario.placa.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const chassi = formulario.chassi.trim().toUpperCase()
  const renavam = formulario.renavam.replace(/\D/g, '')
  const preco = Number(formulario.preco)
  const quilometragem = Number(formulario.quilometragem)
  const ano = Number(formulario.ano)

  if (normalizarString(formulario.marca).length === 0) {
    errosCampos.marca = 'A marca é obrigatória.'
  }
  if (normalizarString(formulario.modelo).length === 0) {
    errosCampos.modelo = 'O modelo é obrigatório.'
  }
  if (formulario.versao && normalizarString(formulario.versao).length === 0) {
    errosCampos.versao = 'A versão não pode conter apenas espaços.'
  }
  if (!Number.isInteger(ano) || ano < 1886 || ano > anoAtual) {
    errosCampos.ano = 'Informe um ano válido.'
  }
  if (normalizarString(formulario.cor).length === 0) {
    errosCampos.cor = 'A cor é obrigatória.'
  }
  if (!Number.isInteger(quilometragem) || quilometragem < 0) {
    errosCampos.quilometragem = 'A quilometragem não pode ser negativa.'
  }
  if (!opcoesCombustivel.some((opcao) => opcao.valor === formulario.combustivel.toLowerCase())) {
    errosCampos.combustivel = 'Selecione um combustível válido.'
  }
  if (!opcoesCambio.some((opcao) => opcao.valor === formulario.cambio.toLowerCase())) {
    errosCampos.cambio = 'Selecione um câmbio válido.'
  }
  if (!/^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z0-9]\d{2})$/i.test(placa)) {
    errosCampos.placa = 'Informe uma placa válida.'
  }
  if (chassi.length !== 17 || !/^[A-HJ-NPR-Z0-9]+$/.test(chassi)) {
    errosCampos.chassi = 'O chassi deve possuir 17 caracteres válidos.'
  }
  if (!/^\d{11}$/.test(renavam)) {
    errosCampos.renavam = 'Informe um RENAVAM válido.'
  }
  if (!Number.isFinite(preco) || preco <= 0) {
    errosCampos.preco = 'Informe um preço válido.'
  }

  return Object.values(errosCampos).every((mensagem) => !mensagem)
}

function dadosNormalizados() {
  return {
    marca: normalizarString(formulario.marca),
    modelo: normalizarString(formulario.modelo),
    versao: normalizarString(formulario.versao),
    ano: Number(formulario.ano),
    cor: normalizarString(formulario.cor),
    quilometragem: Number(formulario.quilometragem),
    combustivel: formulario.combustivel.trim().toLowerCase(),
    cambio: formulario.cambio.trim().toLowerCase(),
    placa: formulario.placa.replace(/[-\s]/g, '').toUpperCase(),
    chassi: formulario.chassi.trim().toUpperCase(),
    renavam: formulario.renavam.replace(/\D/g, ''),
    preco: Number(formulario.preco),
  }
}

async function salvar() {
  if (enviando.value || carregando.value || (edicao.value && !veiculoCarregado.value)) return
  if (!validar()) return

  enviando.value = true
  sucesso.value = false
  erro.value = ''

  try {
    const dados = dadosNormalizados()
    if (edicao.value) {
      const id = Number(route.params.id)
      await atualizarVeiculo(id, dados)
    } else {
      await cadastrarVeiculo(dados)
    }
    sucesso.value = true
    await router.push({
      path: rotaLista.value,
      query: { veiculoSalvo: edicao.value ? 'editado' : 'cadastrado' },
    })
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    enviando.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    limparErros()
    sucesso.value = false
    if (typeof id === 'string') {
      void carregarVeiculo()
    } else {
      consultaAtual.value += 1
      carregando.value = false
      veiculoCarregado.value = true
      formulario.marca = ''
      formulario.modelo = ''
      formulario.versao = ''
      formulario.ano = new Date().getFullYear()
      formulario.cor = ''
      formulario.quilometragem = ''
      formulario.combustivel = ''
      formulario.cambio = ''
      formulario.placa = ''
      formulario.chassi = ''
      formulario.renavam = ''
      formulario.preco = ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">GESTÃO DE VEÍCULOS</span>
        <h1>{{ titulo }}</h1>
        <p>
          {{
            edicao
              ? 'Atualize os dados do veículo selecionado.'
              : 'Preencha os dados para cadastrar um veículo no estoque.'
          }}
        </p>
      </div>
      <button class="button button--secondary" type="button" @click="() => router.push(rotaLista)">
        Cancelar
      </button>
    </div>

    <p v-if="carregando" class="card loading-state" role="status">
      Carregando dados do veículo...
    </p>

    <template v-else>
      <div v-if="erro" class="alert alert--error notice" role="alert">
        {{ erro }}
      </div>

      <form v-if="veiculoCarregado" class="card" novalidate @submit.prevent="salvar">
        <div class="form-grid">
          <div class="field">
            <label for="veiculo-marca">Marca <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-marca"
              v-model="formulario.marca"
              type="text"
              maxlength="100"
              :aria-invalid="Boolean(errosCampos.marca)"
              :aria-describedby="errosCampos.marca ? 'veiculo-marca-erro' : undefined"
              @input="errosCampos.marca = ''"
            />
            <span v-if="errosCampos.marca" id="veiculo-marca-erro" class="field-error">
              {{ errosCampos.marca }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-modelo">Modelo <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-modelo"
              v-model="formulario.modelo"
              type="text"
              maxlength="100"
              :aria-invalid="Boolean(errosCampos.modelo)"
              :aria-describedby="errosCampos.modelo ? 'veiculo-modelo-erro' : undefined"
              @input="errosCampos.modelo = ''"
            />
            <span v-if="errosCampos.modelo" id="veiculo-modelo-erro" class="field-error">
              {{ errosCampos.modelo }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-versao">Versão</label>
            <input
              id="veiculo-versao"
              v-model="formulario.versao"
              type="text"
              maxlength="100"
              :aria-invalid="Boolean(errosCampos.versao)"
              :aria-describedby="errosCampos.versao ? 'veiculo-versao-erro' : undefined"
              @input="errosCampos.versao = ''"
            />
            <span v-if="errosCampos.versao" id="veiculo-versao-erro" class="field-error">
              {{ errosCampos.versao }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-ano">Ano <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-ano"
              v-model.number="formulario.ano"
              type="number"
              min="1886"
              :max="new Date().getFullYear()"
              step="1"
              :aria-invalid="Boolean(errosCampos.ano)"
              :aria-describedby="errosCampos.ano ? 'veiculo-ano-erro' : undefined"
              @input="errosCampos.ano = ''"
            />
            <span v-if="errosCampos.ano" id="veiculo-ano-erro" class="field-error">
              {{ errosCampos.ano }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-cor">Cor <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-cor"
              v-model="formulario.cor"
              type="text"
              maxlength="50"
              :aria-invalid="Boolean(errosCampos.cor)"
              :aria-describedby="errosCampos.cor ? 'veiculo-cor-erro' : undefined"
              @input="errosCampos.cor = ''"
            />
            <span v-if="errosCampos.cor" id="veiculo-cor-erro" class="field-error">
              {{ errosCampos.cor }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-quilometragem">Quilometragem <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-quilometragem"
              v-model.number="formulario.quilometragem"
              type="number"
              min="0"
              step="1"
              :aria-invalid="Boolean(errosCampos.quilometragem)"
              :aria-describedby="errosCampos.quilometragem ? 'veiculo-quilometragem-erro' : undefined"
              @input="errosCampos.quilometragem = ''"
            />
            <span v-if="errosCampos.quilometragem" id="veiculo-quilometragem-erro" class="field-error">
              {{ errosCampos.quilometragem }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-combustivel">Combustível <span aria-hidden="true">*</span></label>
            <select
              id="veiculo-combustivel"
              v-model="formulario.combustivel"
              :aria-invalid="Boolean(errosCampos.combustivel)"
              :aria-describedby="errosCampos.combustivel ? 'veiculo-combustivel-erro' : undefined"
              @change="errosCampos.combustivel = ''"
            >
              <option value="">Selecione</option>
              <option v-for="opcao in opcoesCombustivel" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.rotulo }}
              </option>
            </select>
            <span v-if="errosCampos.combustivel" id="veiculo-combustivel-erro" class="field-error">
              {{ errosCampos.combustivel }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-cambio">Câmbio <span aria-hidden="true">*</span></label>
            <select
              id="veiculo-cambio"
              v-model="formulario.cambio"
              :aria-invalid="Boolean(errosCampos.cambio)"
              :aria-describedby="errosCampos.cambio ? 'veiculo-cambio-erro' : undefined"
              @change="errosCampos.cambio = ''"
            >
              <option value="">Selecione</option>
              <option v-for="opcao in opcoesCambio" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.rotulo }}
              </option>
            </select>
            <span v-if="errosCampos.cambio" id="veiculo-cambio-erro" class="field-error">
              {{ errosCampos.cambio }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-placa">Placa <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-placa"
              v-model="formulario.placa"
              type="text"
              maxlength="8"
              placeholder="ABC1D23"
              :aria-invalid="Boolean(errosCampos.placa)"
              :aria-describedby="errosCampos.placa ? 'veiculo-placa-erro' : undefined"
              @input="errosCampos.placa = ''"
            />
            <span v-if="errosCampos.placa" id="veiculo-placa-erro" class="field-error">
              {{ errosCampos.placa }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-chassi">Chassi <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-chassi"
              v-model="formulario.chassi"
              type="text"
              maxlength="17"
              :aria-invalid="Boolean(errosCampos.chassi)"
              :aria-describedby="errosCampos.chassi ? 'veiculo-chassi-erro' : undefined"
              @input="errosCampos.chassi = ''"
            />
            <span v-if="errosCampos.chassi" id="veiculo-chassi-erro" class="field-error">
              {{ errosCampos.chassi }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-renavam">RENAVAM <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-renavam"
              v-model="formulario.renavam"
              type="text"
              maxlength="11"
              inputmode="numeric"
              :aria-invalid="Boolean(errosCampos.renavam)"
              :aria-describedby="errosCampos.renavam ? 'veiculo-renavam-erro' : undefined"
              @input="errosCampos.renavam = ''"
            />
            <span v-if="errosCampos.renavam" id="veiculo-renavam-erro" class="field-error">
              {{ errosCampos.renavam }}
            </span>
          </div>

          <div class="field">
            <label for="veiculo-preco">Preço <span aria-hidden="true">*</span></label>
            <input
              id="veiculo-preco"
              v-model="formulario.preco"
              type="number"
              min="0"
              step="0.01"
              :aria-invalid="Boolean(errosCampos.preco)"
              :aria-describedby="errosCampos.preco ? 'veiculo-preco-erro' : undefined"
              @input="errosCampos.preco = ''"
            />
            <span v-if="errosCampos.preco" id="veiculo-preco-erro" class="field-error">
              {{ errosCampos.preco }}
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button class="button button--secondary" type="button" @click="() => router.push(rotaLista)">
            Cancelar
          </button>
          <button class="button button--gold" type="submit" :disabled="enviando || carregando">
            <span v-if="enviando" class="spinner" aria-hidden="true"></span>
            {{ enviando ? 'Salvando...' : edicao ? 'Salvar alterações' : 'Cadastrar veículo' }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>
