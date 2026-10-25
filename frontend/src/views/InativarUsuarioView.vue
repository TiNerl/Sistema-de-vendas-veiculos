<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  inativarUsuario,
  listarUsuarios,
  mensagemErroApi,
} from '@/services/usuarios.service'
import type { Usuario } from '@/services/usuarios.service'

const route = useRoute()
const usuariosAtivos = ref<Usuario[]>([])
const busca = ref('')
const selecionado = ref<Usuario | null>(null)
const cpfConfirmacao = ref('')
const modalAberto = ref(false)
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')
const mensagem = ref('')

const listaFiltrada = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  const cpfBusca = termo.replace(/\D/g, '')
  return usuariosAtivos.value.filter(
    (usuario) =>
      usuario.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      (cpfBusca.length > 0 && usuario.cpf.includes(cpfBusca)),
  )
})

const cpfConfere = computed(
  () => cpfConfirmacao.value.replace(/\D/g, '') === selecionado.value?.cpf,
)

function perfilLegivel(perfil: Usuario['perfil']): string {
  return perfil === 'admin' ? 'Administrador' : 'Vendedor'
}

async function carregarUsuarios() {
  carregando.value = true
  erro.value = ''
  try {
    usuariosAtivos.value = (await listarUsuarios()).filter((usuario) => usuario.ativo)
    if (route.query.usuario) {
      const idSelecionado = Number(route.query.usuario)
      selecionado.value =
        usuariosAtivos.value.find((usuario) => usuario.id_usuario === idSelecionado) ?? null
    }
  } catch (error) {
    erro.value = mensagemErroApi(error, 'Não foi possível carregar os usuários ativos.')
  } finally {
    carregando.value = false
  }
}

function abrirConfirmacao(usuario: Usuario) {
  selecionado.value = usuario
  cpfConfirmacao.value = ''
  erro.value = ''
  modalAberto.value = true
}

async function confirmarInativacao() {
  if (!selecionado.value || !cpfConfere.value || enviando.value) return
  enviando.value = true
  erro.value = ''
  mensagem.value = ''

  try {
    const nome = selecionado.value.nome
    await inativarUsuario(
      selecionado.value.id_usuario,
      cpfConfirmacao.value.replace(/\D/g, ''),
    )
    mensagem.value = `O usuário ${nome} foi inativado.`
    modalAberto.value = false
    selecionado.value = null
    cpfConfirmacao.value = ''
    await carregarUsuarios()
  } catch (error) {
    erro.value = mensagemErroApi(error, 'Não foi possível inativar o usuário.')
  } finally {
    enviando.value = false
  }
}

watch(modalAberto, (aberto) => {
  if (!aberto) cpfConfirmacao.value = ''
})

onMounted(carregarUsuarios)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ADMINISTRAÇÃO</span>
        <h1>Inativar usuário</h1>
        <p>Gerencie o acesso de pessoas à sua equipe.</p>
      </div>
      <RouterLink class="button button--secondary" to="/admin/usuarios">Voltar à lista</RouterLink>
    </div>

    <div class="alert alert--info notice">
      A inativação bloqueia o acesso ao sistema sem apagar o histórico ou os registros relacionados.
    </div>
    <div v-if="mensagem" class="alert alert--success notice" role="status">{{ mensagem }}</div>
    <div v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</div>

    <section class="card" aria-label="Usuários ativos">
      <div class="field search-field user-deactivation-search">
        <label for="busca-inativar">Pesquisar usuários ativos</label>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          id="busca-inativar"
          v-model="busca"
          type="search"
          placeholder="Nome ou CPF"
          autocomplete="off"
        />
      </div>

      <p v-if="carregando" class="loading-state" role="status">Carregando usuários ativos...</p>
      <div v-else-if="listaFiltrada.length === 0" class="empty-state">
        {{ usuariosAtivos.length ? 'Nenhum usuário corresponde à pesquisa.' : 'Não há usuários ativos.' }}
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">CPF</th>
              <th scope="col">Perfil</th>
              <th scope="col">Situação</th>
              <th scope="col">Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in listaFiltrada" :key="usuario.id_usuario">
              <td class="user-primary">{{ usuario.nome }}</td>
              <td>{{ usuario.cpf }}</td>
              <td>{{ perfilLegivel(usuario.perfil) }}</td>
              <td><span class="status-badge status-badge--active">Ativo</span></td>
              <td>
                <button
                  class="button button--secondary"
                  type="button"
                  :disabled="enviando"
                  @click="abrirConfirmacao(usuario)"
                >
                  Inativar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modalAberto && selecionado" class="modal-backdrop" @click.self="modalAberto = false">
      <section
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-inativacao-titulo"
        aria-describedby="confirmar-inativacao-descricao"
      >
        <h2 id="confirmar-inativacao-titulo">Confirmar inativação</h2>
        <p id="confirmar-inativacao-descricao" class="confirm-copy">
          Você está prestes a inativar <span class="confirm-name">{{ selecionado.nome }}</span>.
          Essa ação bloqueará o acesso, mas preservará o histórico do usuário.
        </p>
        <div class="field">
          <label for="cpf-confirmacao">Confirme o CPF do usuário para continuar</label>
          <input
            id="cpf-confirmacao"
            v-model="cpfConfirmacao"
            inputmode="numeric"
            autocomplete="off"
            maxlength="14"
            placeholder="CPF do usuário selecionado"
          />
        </div>
        <div class="dialog-actions">
          <button
            class="button button--secondary"
            type="button"
            :disabled="enviando"
            @click="modalAberto = false"
          >
            Cancelar
          </button>
          <button
            class="button button--danger"
            type="button"
            :disabled="enviando || !cpfConfere"
            @click="confirmarInativacao"
          >
            <span v-if="enviando" class="spinner" aria-hidden="true"></span>
            {{ enviando ? 'Inativando...' : 'Confirmar inativação' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
