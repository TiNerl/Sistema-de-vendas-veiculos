<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  listarUsuarios,
  mensagemErroApi,
} from '@/services/usuarios.service'
import type { Usuario } from '@/services/usuarios.service'

const usuarios = ref<Usuario[]>([])
const busca = ref('')
const filtroPerfil = ref('')
const filtroSituacao = ref('')
const carregando = ref(false)
const erro = ref('')

const usuariosFiltrados = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  const cpfBusca = termo.replace(/\D/g, '')

  return usuarios.value.filter((usuario) => {
    const correspondeBusca =
      !termo ||
      usuario.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      (cpfBusca.length > 0 && usuario.cpf.includes(cpfBusca))
    const correspondePerfil = !filtroPerfil.value || usuario.perfil === filtroPerfil.value
    const correspondeSituacao =
      !filtroSituacao.value ||
      (filtroSituacao.value === 'ativo' ? usuario.ativo : !usuario.ativo)

    return correspondeBusca && correspondePerfil && correspondeSituacao
  })
})

async function carregarUsuarios() {
  carregando.value = true
  erro.value = ''

  try {
    usuarios.value = await listarUsuarios()
  } catch (error) {
    erro.value = mensagemErroApi(error, 'Não foi possível carregar os usuários.')
  } finally {
    carregando.value = false
  }
}

function perfilLegivel(perfil: Usuario['perfil']): string {
  return perfil === 'admin' ? 'Administrador' : 'Vendedor'
}

onMounted(carregarUsuarios)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ADMINISTRAÇÃO</span>
        <h1>Usuários</h1>
        <p>Gerencie os usuários cadastrados no AutoSaller</p>
      </div>
      <RouterLink class="button button--gold" to="/admin/usuarios/cadastrar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14m-7-7h14" />
        </svg>
        Cadastrar usuário
      </RouterLink>
    </div>

    <div v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</div>

    <section class="card filter-card" aria-label="Filtros de usuários">
      <div class="filters">
        <div class="field search-field">
          <label for="busca-usuarios">Pesquisar</label>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="busca-usuarios"
            v-model="busca"
            type="search"
            placeholder="Nome ou CPF"
            autocomplete="off"
          />
        </div>
        <div class="field">
          <label for="filtro-perfil">Perfil</label>
          <select id="filtro-perfil" v-model="filtroPerfil">
            <option value="">Todos os perfis</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
          </select>
        </div>
        <div class="field">
          <label for="filtro-situacao">Situação</label>
          <select id="filtro-situacao" v-model="filtroSituacao">
            <option value="">Todas</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <p v-if="carregando" class="loading-state" role="status">Carregando usuários...</p>
      <div v-else-if="!erro && usuariosFiltrados.length === 0" class="empty-state">
        {{ usuarios.length ? 'Nenhum usuário corresponde aos filtros.' : 'Nenhum usuário cadastrado.' }}
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">CPF</th>
              <th scope="col">Perfil</th>
              <th scope="col">Situação</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuariosFiltrados" :key="usuario.id_usuario">
              <td class="user-primary">{{ usuario.nome }}</td>
              <td>{{ usuario.cpf }}</td>
              <td>{{ perfilLegivel(usuario.perfil) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="usuario.ativo ? 'status-badge--active' : 'status-badge--inactive'"
                >
                  {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <RouterLink
                  v-if="usuario.ativo"
                  class="table-action"
                  :to="{ path: '/admin/usuarios/inativar', query: { usuario: usuario.id_usuario } }"
                >
                  Inativar
                </RouterLink>
                <span v-else class="table-action" aria-label="Usuário sem ações disponíveis">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
