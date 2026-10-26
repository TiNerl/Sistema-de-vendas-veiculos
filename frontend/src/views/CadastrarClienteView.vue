<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import {
  atualizarCliente,
  buscarCliente,
  cadastrarCliente,
} from '@/services/clientes.service'
import type { Cliente, NovoCliente } from '@/services/clientes.service'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const edicao = computed(() => typeof route.params.id === 'string')
const titulo = computed(() => (edicao.value ? 'Editar cliente' : 'Cadastrar cliente'))
const carregando = ref(false)
const enviando = ref(false)
const clienteCarregado = ref(false)
const erro = ref('')
const sucesso = ref(false)
const errosCampos = reactive<Record<keyof NovoCliente, string>>({
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  documento: '',
})
const cliente = reactive<NovoCliente>({
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  documento: '',
})
let consultaAtual = 0

const rotaLista = computed(() =>
  auth.usuario?.perfil === 'vendedor' ? '/vendedor/clientes' : '/admin/clientes',
)

function definirCliente(dados: Cliente) {
  cliente.nome = dados.nome
  cliente.cpf = dados.cpf
  cliente.email = dados.email
  cliente.telefone = dados.telefone
  cliente.endereco = dados.endereco
  cliente.cidade = dados.cidade
  cliente.estado = dados.estado
  cliente.cep = dados.cep
  cliente.documento = dados.documento
  clienteCarregado.value = true
}

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) {
      return 'Cliente não encontrado.'
    }

    const message: unknown = error.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(' ')
    }
  }
  return `Não foi possível ${edicao.value ? 'salvar as alterações' : 'cadastrar o cliente'}. Tente novamente.`
}

async function carregarCliente(identificador = route.params.id) {
  const id = typeof identificador === 'string' ? Number(identificador) : Number.NaN
  if (!Number.isSafeInteger(id) || id < 1) {
    erro.value = 'O identificador do cliente é inválido.'
    return
  }

  const consulta = ++consultaAtual
  carregando.value = true
  erro.value = ''
  clienteCarregado.value = false

  try {
    const dados = await buscarCliente(id)
    if (consulta === consultaAtual) definirCliente(dados)
  } catch (error) {
    if (consulta === consultaAtual) erro.value = mensagemErro(error)
  } finally {
    if (consulta === consultaAtual) carregando.value = false
  }
}

function limparErros() {
  for (const chave of Object.keys(errosCampos) as (keyof NovoCliente)[]) {
    errosCampos[chave] = ''
  }
  erro.value = ''
}

function validar(): boolean {
  limparErros()
  const cpf = cliente.cpf.replace(/\D/g, '')
  const telefone = cliente.telefone.replace(/\D/g, '')
  const cep = cliente.cep.replace(/\D/g, '')

  if (cliente.nome.trim().length < 3 || cliente.nome.length > 100) {
    errosCampos.nome = 'Informe de 3 a 100 caracteres.'
  }
  if (cpf.length !== 11) {
    errosCampos.cpf = 'O CPF deve conter exatamente 11 dígitos.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email) || cliente.email.length > 150) {
    errosCampos.email = 'Informe um e-mail válido com até 150 caracteres.'
  }
  if (telefone.length < 10 || telefone.length > 15) {
    errosCampos.telefone = 'O telefone deve conter de 10 a 15 dígitos.'
  }
  if (cliente.endereco.trim().length < 5 || cliente.endereco.length > 150) {
    errosCampos.endereco = 'Informe de 5 a 150 caracteres.'
  }
  if (cliente.cidade.trim().length < 2 || cliente.cidade.length > 50) {
    errosCampos.cidade = 'Informe de 2 a 50 caracteres.'
  }
  if (cliente.estado.trim().length !== 2) {
    errosCampos.estado = 'Informe a sigla do estado com 2 caracteres.'
  }
  if (cep.length !== 8) {
    errosCampos.cep = 'O CEP deve conter exatamente 8 dígitos.'
  }
  if (cliente.documento.trim().length < 5 || cliente.documento.length > 20) {
    errosCampos.documento = 'Informe de 5 a 20 caracteres.'
  }

  return Object.values(errosCampos).every((mensagem) => !mensagem)
}

function dadosNormalizados(): NovoCliente {
  return {
    nome: cliente.nome.trim(),
    cpf: cliente.cpf.replace(/\D/g, ''),
    email: cliente.email.trim(),
    telefone: cliente.telefone.replace(/\D/g, ''),
    endereco: cliente.endereco.trim(),
    cidade: cliente.cidade.trim(),
    estado: cliente.estado.trim().toUpperCase(),
    cep: cliente.cep.replace(/\D/g, ''),
    documento: cliente.documento.trim(),
  }
}

async function salvar() {
  if (enviando.value || carregando.value || (edicao.value && !clienteCarregado.value)) return
  if (!validar()) return

  enviando.value = true
  sucesso.value = false

  try {
    const dados = dadosNormalizados()
    if (edicao.value) {
      const id = Number(route.params.id)
      await atualizarCliente(id, dados)
    } else {
      await cadastrarCliente(dados)
    }
    sucesso.value = true
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    enviando.value = false
  }
}

async function voltarParaLista() {
  await router.push(rotaLista.value)
}

watch(
  () => route.params.id,
  (id) => {
    erro.value = ''
    sucesso.value = false
    if (typeof id === 'string') {
      void carregarCliente(id)
    } else {
      consultaAtual += 1
      carregando.value = false
      clienteCarregado.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">GESTÃO DE CLIENTES</span>
        <h1>{{ titulo }}</h1>
        <p>
          {{
            edicao
              ? 'Atualize os dados cadastrais do cliente.'
              : 'Preencha os dados para incluir um cliente no AutoSaller.'
          }}
        </p>
      </div>
      <RouterLink class="button button--secondary" :to="rotaLista">
        Cancelar
      </RouterLink>
    </div>

    <p v-if="carregando" class="card loading-state" role="status">
      Carregando dados do cliente...
    </p>

    <template v-else>
      <div v-if="erro" class="alert alert--error notice" role="alert">
        {{ erro }}
        <button
          v-if="edicao && !clienteCarregado"
          class="inline-retry"
          type="button"
          @click="carregarCliente()"
        >
          Tentar novamente
        </button>
      </div>
      <div v-if="sucesso" class="alert alert--success notice" role="status">
        {{ edicao ? 'Alterações salvas com sucesso.' : 'Cliente cadastrado com sucesso.' }}
        <button class="inline-retry" type="button" @click="voltarParaLista">
          Voltar à lista
        </button>
      </div>

      <form
        v-if="clienteCarregado"
        class="card"
        novalidate
        @submit.prevent="salvar"
      >
        <div class="form-grid">
          <div class="field">
            <label for="cliente-nome">Nome <span aria-hidden="true">*</span></label>
            <input
              id="cliente-nome"
              v-model="cliente.nome"
              required
              minlength="3"
              maxlength="100"
              autocomplete="name"
              :aria-invalid="Boolean(errosCampos.nome)"
              :aria-describedby="errosCampos.nome ? 'cliente-nome-erro' : undefined"
              @input="errosCampos.nome = ''"
            />
            <span v-if="errosCampos.nome" id="cliente-nome-erro" class="field-error">
              {{ errosCampos.nome }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-cpf">CPF <span aria-hidden="true">*</span></label>
            <input
              id="cliente-cpf"
              v-model="cliente.cpf"
              required
              inputmode="numeric"
              minlength="11"
              maxlength="14"
              autocomplete="off"
              placeholder="000.000.000-00"
              :aria-invalid="Boolean(errosCampos.cpf)"
              :aria-describedby="errosCampos.cpf ? 'cliente-cpf-erro' : undefined"
              @input="errosCampos.cpf = ''"
            />
            <span v-if="errosCampos.cpf" id="cliente-cpf-erro" class="field-error">
              {{ errosCampos.cpf }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-email">E-mail <span aria-hidden="true">*</span></label>
            <input
              id="cliente-email"
              v-model="cliente.email"
              required
              type="email"
              maxlength="150"
              autocomplete="email"
              :aria-invalid="Boolean(errosCampos.email)"
              :aria-describedby="errosCampos.email ? 'cliente-email-erro' : undefined"
              @input="errosCampos.email = ''"
            />
            <span v-if="errosCampos.email" id="cliente-email-erro" class="field-error">
              {{ errosCampos.email }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-telefone">Telefone <span aria-hidden="true">*</span></label>
            <input
              id="cliente-telefone"
              v-model="cliente.telefone"
              required
              inputmode="tel"
              minlength="10"
              maxlength="15"
              autocomplete="tel"
              :aria-invalid="Boolean(errosCampos.telefone)"
              :aria-describedby="errosCampos.telefone ? 'cliente-telefone-erro' : undefined"
              @input="errosCampos.telefone = ''"
            />
            <span v-if="errosCampos.telefone" id="cliente-telefone-erro" class="field-error">
              {{ errosCampos.telefone }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-endereco">Endereço <span aria-hidden="true">*</span></label>
            <input
              id="cliente-endereco"
              v-model="cliente.endereco"
              required
              minlength="5"
              maxlength="150"
              autocomplete="street-address"
              :aria-invalid="Boolean(errosCampos.endereco)"
              :aria-describedby="errosCampos.endereco ? 'cliente-endereco-erro' : undefined"
              @input="errosCampos.endereco = ''"
            />
            <span v-if="errosCampos.endereco" id="cliente-endereco-erro" class="field-error">
              {{ errosCampos.endereco }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-cidade">Cidade <span aria-hidden="true">*</span></label>
            <input
              id="cliente-cidade"
              v-model="cliente.cidade"
              required
              minlength="2"
              maxlength="50"
              autocomplete="address-level2"
              :aria-invalid="Boolean(errosCampos.cidade)"
              :aria-describedby="errosCampos.cidade ? 'cliente-cidade-erro' : undefined"
              @input="errosCampos.cidade = ''"
            />
            <span v-if="errosCampos.cidade" id="cliente-cidade-erro" class="field-error">
              {{ errosCampos.cidade }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-estado">Estado (UF) <span aria-hidden="true">*</span></label>
            <input
              id="cliente-estado"
              v-model="cliente.estado"
              required
              minlength="2"
              maxlength="2"
              autocomplete="address-level1"
              :aria-invalid="Boolean(errosCampos.estado)"
              :aria-describedby="errosCampos.estado ? 'cliente-estado-erro' : undefined"
              @input="errosCampos.estado = ''"
            />
            <span v-if="errosCampos.estado" id="cliente-estado-erro" class="field-error">
              {{ errosCampos.estado }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-cep">CEP <span aria-hidden="true">*</span></label>
            <input
              id="cliente-cep"
              v-model="cliente.cep"
              required
              inputmode="numeric"
              minlength="8"
              maxlength="9"
              autocomplete="postal-code"
              :aria-invalid="Boolean(errosCampos.cep)"
              :aria-describedby="errosCampos.cep ? 'cliente-cep-erro' : undefined"
              @input="errosCampos.cep = ''"
            />
            <span v-if="errosCampos.cep" id="cliente-cep-erro" class="field-error">
              {{ errosCampos.cep }}
            </span>
          </div>
          <div class="field">
            <label for="cliente-documento">Documento <span aria-hidden="true">*</span></label>
            <input
              id="cliente-documento"
              v-model="cliente.documento"
              required
              minlength="5"
              maxlength="20"
              autocomplete="off"
              :aria-invalid="Boolean(errosCampos.documento)"
              :aria-describedby="errosCampos.documento ? 'cliente-documento-erro' : undefined"
              @input="errosCampos.documento = ''"
            />
            <span v-if="errosCampos.documento" id="cliente-documento-erro" class="field-error">
              {{ errosCampos.documento }}
            </span>
          </div>
        </div>

        <div class="form-actions">
          <RouterLink class="button button--secondary" :to="rotaLista">
            Cancelar
          </RouterLink>
          <button
            class="button button--gold"
            type="submit"
            :disabled="enviando || sucesso || carregando"
          >
            <span v-if="enviando" class="spinner" aria-hidden="true"></span>
            {{
              enviando
                ? 'Salvando...'
                : edicao
                  ? 'Salvar alterações'
                  : 'Cadastrar cliente'
            }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>
