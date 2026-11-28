<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute, useRouter } from 'vue-router'
import {
  atualizarUsuario,
  buscarUsuario,
  mensagemErroApi,
} from '@/services/usuarios.service'
import type { Usuario } from '@/services/usuarios.service'

const route = useRoute()
const router = useRouter()

const usuario = ref<Usuario | null>(null)
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')
const sucesso = ref(false)
const mostrarSenha = ref(false)
const mostrarConfirmacao = ref(false)
const consultaAtual = ref(0)

const formulario = reactive({
  nome: '',
  senha: '',
  confirmarSenha: '',
})

const erros = reactive({
  nome: '',
  senha: '',
  confirmarSenha: '',
})

function perfilLegivel(perfil: Usuario['perfil']): string {
  return perfil === 'admin' ? 'Administrador' : 'Vendedor'
}

function mensagemErro(error: unknown): string {
  if (isAxiosError(error)) {
    const mensagem = error.response?.data?.message
    if (typeof mensagem === 'string') return mensagem
    if (Array.isArray(mensagem) && mensagem.every((item) => typeof item === 'string')) {
      return mensagem.join(' ')
    }
    if (error.response?.status === 404) return 'Usuário não encontrado.'
  }
  return mensagemErroApi(error, 'Não foi possível salvar as alterações do usuário.')
}

async function carregarUsuario() {
  const id = typeof route.params.id === 'string' ? Number(route.params.id) : Number.NaN
  if (!Number.isSafeInteger(id) || id < 1) {
    erro.value = 'O identificador do usuário é inválido.'
    usuario.value = null
    return
  }

  const consulta = ++consultaAtual.value
  carregando.value = true
  usuario.value = null
  erro.value = ''
  sucesso.value = false

  try {
    const dados = await buscarUsuario(id)
    if (consulta !== consultaAtual.value) return
    usuario.value = dados
    formulario.nome = dados.nome
    formulario.senha = ''
    formulario.confirmarSenha = ''
  } catch (error) {
    if (consulta === consultaAtual.value) erro.value = mensagemErro(error)
  } finally {
    if (consulta === consultaAtual.value) carregando.value = false
  }
}

function limparErros() {
  erros.nome = ''
  erros.senha = ''
  erros.confirmarSenha = ''
  erro.value = ''
}

function validar(): boolean {
  limparErros()

  if (!formulario.nome.trim()) {
    erros.nome = 'Informe o nome completo.'
  } else if (formulario.nome.trim().length > 100) {
    erros.nome = 'O nome deve ter no máximo 100 caracteres.'
  }

  if (formulario.senha) {
    if (formulario.senha.length < 6) {
      erros.senha = 'A senha deve ter pelo menos 6 caracteres.'
    } else if (formulario.senha.length > 255) {
      erros.senha = 'A senha deve ter no máximo 255 caracteres.'
    }

    if (!formulario.confirmarSenha) {
      erros.confirmarSenha = 'Confirme a nova senha.'
    } else if (formulario.confirmarSenha !== formulario.senha) {
      erros.confirmarSenha = 'As senhas não coincidem.'
    }
  } else if (formulario.confirmarSenha) {
    erros.senha = 'Informe a nova senha antes de confirmar.'
  }

  if (usuario.value && formulario.nome.trim() === usuario.value.nome && !formulario.senha) {
    erro.value = 'Altere o nome ou informe uma nova senha antes de salvar.'
  }

  return (
    !erros.nome &&
    !erros.senha &&
    !erros.confirmarSenha &&
    !erro.value
  )
}

async function salvar() {
  if (!usuario.value || enviando.value || carregando.value) return
  if (!validar()) return

  const dados: { nome?: string; senha?: string } = {}
  if (formulario.nome.trim() !== usuario.value.nome) {
    dados.nome = formulario.nome.trim()
  }
  if (formulario.senha) dados.senha = formulario.senha

  enviando.value = true
  erro.value = ''
  sucesso.value = false

  try {
    await atualizarUsuario(usuario.value.id_usuario, dados)
    sucesso.value = true
  } catch (error) {
    erro.value = mensagemErro(error)
  } finally {
    enviando.value = false
  }
}

async function cancelar() {
  if (!enviando.value) await router.replace({ name: 'lista-usuarios' })
}

async function voltarParaLista() {
  await router.replace({ name: 'lista-usuarios' })
}

watch(
  () => route.params.id,
  () => {
    void carregarUsuario()
  },
)

onMounted(carregarUsuario)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">GESTÃO DE USUÁRIOS</span>
        <h1>Editar usuário</h1>
        <p>Atualize o nome e, se necessário, a senha do usuário selecionado.</p>
      </div>
      <button
        class="button button--secondary"
        type="button"
        :disabled="enviando"
        @click="cancelar"
      >
        Cancelar
      </button>
    </div>

    <p v-if="carregando" class="card loading-state" role="status">
      Carregando dados do usuário...
    </p>

    <template v-else>
      <div v-if="erro" class="alert alert--error notice" role="alert">
        {{ erro }}
        <button
          v-if="!usuario"
          class="inline-retry"
          type="button"
          @click="carregarUsuario"
        >
          Tentar novamente
        </button>
      </div>

      <div v-if="sucesso" class="alert alert--success notice" role="status">
        Alterações salvas com sucesso.
        <button class="inline-retry" type="button" @click="voltarParaLista">
          Voltar à lista
        </button>
      </div>

      <div
        v-if="usuario && !usuario.ativo"
        class="alert alert--error notice"
        role="alert"
      >
        Usuários inativos não podem ser editados.
      </div>

      <form
        v-if="usuario"
        class="card edit-user-card"
        novalidate
        @submit.prevent="salvar"
      >
        <div class="edit-user-summary">
          <div>
            <span class="eyebrow">USUÁRIO SELECIONADO</span>
            <h2>{{ usuario.nome }}</h2>
          </div>
          <span
            class="status-badge"
            :class="usuario.ativo ? 'status-badge--active' : 'status-badge--inactive'"
          >
            {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
          </span>
        </div>

        <fieldset class="edit-user-section">
          <legend>Dados editáveis</legend>
          <div class="form-grid edit-user-grid">
            <div class="field">
              <label for="usuario-nome">
                Nome completo <span aria-hidden="true">*</span>
              </label>
              <input
                id="usuario-nome"
                v-model="formulario.nome"
                type="text"
                required
                minlength="1"
                maxlength="100"
                autocomplete="name"
                :disabled="enviando || !usuario.ativo"
                :aria-invalid="Boolean(erros.nome)"
                :aria-describedby="erros.nome ? 'usuario-nome-erro' : undefined"
                @input="erros.nome = ''; erro = ''"
              />
              <span v-if="erros.nome" id="usuario-nome-erro" class="field-error">
                {{ erros.nome }}
              </span>
            </div>

            <div class="field">
              <label for="usuario-cpf">CPF</label>
              <input
                id="usuario-cpf"
                :value="usuario.cpf"
                type="text"
                readonly
              />
              <span class="field-hint">O CPF não pode ser alterado.</span>
            </div>

            <div class="field">
              <label for="usuario-perfil">Perfil</label>
              <input
                id="usuario-perfil"
                :value="perfilLegivel(usuario.perfil)"
                type="text"
                readonly
              />
              <span class="field-hint">O perfil não pode ser alterado nesta tela.</span>
            </div>

            <div class="field user-password-field">
              <label for="usuario-senha">Nova senha</label>
              <div class="password-input">
                <input
                  id="usuario-senha"
                  v-model="formulario.senha"
                  :type="mostrarSenha ? 'text' : 'password'"
                  minlength="6"
                  maxlength="255"
                  autocomplete="new-password"
                  :disabled="enviando || !usuario.ativo"
                  :aria-invalid="Boolean(erros.senha)"
                  :aria-describedby="erros.senha ? 'usuario-senha-erro' : 'usuario-senha-ajuda'"
                  @input="erros.senha = ''; erro = ''"
                />
                <button
                  class="password-toggle"
                  type="button"
                  :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                  :aria-pressed="mostrarSenha"
                  @click="mostrarSenha = !mostrarSenha"
                >
                  <svg v-if="mostrarSenha" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.6 9 7-.2 1.1-1.2 2.8-2.8 4.3M6.2 6.2C3.8 7.8 2.3 10.4 2 12c.5 2.4 4 7 10 7 1 0 1.9-.2 2.8-.5" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <span v-if="erros.senha" id="usuario-senha-erro" class="field-error">
                {{ erros.senha }}
              </span>
              <span v-else id="usuario-senha-ajuda" class="field-hint">
                Deixe em branco para manter a senha atual. Mínimo de 6 caracteres.
              </span>
            </div>

            <div class="field user-password-field">
              <label for="usuario-confirmar-senha">Confirmar nova senha</label>
              <div class="password-input">
                <input
                  id="usuario-confirmar-senha"
                  v-model="formulario.confirmarSenha"
                  :type="mostrarConfirmacao ? 'text' : 'password'"
                  autocomplete="new-password"
                  :disabled="enviando || !usuario.ativo"
                  :aria-invalid="Boolean(erros.confirmarSenha)"
                  :aria-describedby="erros.confirmarSenha ? 'usuario-confirmar-erro' : undefined"
                  @input="erros.confirmarSenha = ''; erro = ''"
                />
                <button
                  class="password-toggle"
                  type="button"
                  :aria-label="mostrarConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'"
                  :aria-pressed="mostrarConfirmacao"
                  @click="mostrarConfirmacao = !mostrarConfirmacao"
                >
                  <svg v-if="mostrarConfirmacao" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <span v-if="erros.confirmarSenha" id="usuario-confirmar-erro" class="field-error">
                {{ erros.confirmarSenha }}
              </span>
            </div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button
            class="button button--secondary"
            type="button"
            :disabled="enviando"
            @click="cancelar"
          >
            Cancelar
          </button>
          <button
            class="button button--gold"
            type="submit"
            :disabled="enviando || !usuario.ativo"
          >
            <span v-if="enviando" class="spinner" aria-hidden="true"></span>
            {{ enviando ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.edit-user-card {
  display: grid;
  gap: 24px;
}

.edit-user-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--color-border);
}

.edit-user-summary h2 {
  margin: 5px 0 0;
  font-size: 1.25rem;
}

.edit-user-section {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.edit-user-section legend {
  margin-bottom: 16px;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.edit-user-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.edit-user-card .form-actions {
  margin-top: 0;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
}

.field input[readonly] {
  color: var(--color-muted);
  background: #f7f9fc;
}

.inline-retry {
  margin-left: 10px;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font-weight: 700;
  text-decoration: underline;
}

.notice {
  margin-bottom: 20px;
}

@media (max-width: 700px) {
  .edit-user-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .edit-user-summary {
    align-items: flex-start;
  }

  .edit-user-card .form-actions {
    flex-direction: column-reverse;
  }

  .edit-user-card .form-actions .button {
    width: 100%;
  }
}
</style>
