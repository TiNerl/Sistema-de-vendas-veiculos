<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'

interface Usuario {
  id_usuario: number
  nome: string
  cpf: string
  perfil: string
  ativo: boolean
}

type Aba = 'inicio' | 'criar' | 'inativar'

const router = useRouter()
const auth = useAuthStore()

const abaAtual = ref<Aba>('inicio')
const usuarios = ref<Usuario[]>([])
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')
const mensagem = ref('')

const novoUsuario = reactive({
  nome: '',
  cpf: '',
  senha: '',
  perfil: 'vendedor',
})

async function listarUsuarios() {
  carregando.value = true
  erro.value = ''

  try {
    const resposta = await api.get<Usuario[]>('/usuarios')
    usuarios.value = resposta.data
  } catch {
    erro.value = 'Não foi possível carregar os usuários.'
  } finally {
    carregando.value = false
  }
}

async function criarUsuario() {
  enviando.value = true
  erro.value = ''
  mensagem.value = ''

  try {
    await api.post('/usuarios', { ...novoUsuario })

    mensagem.value = 'Usuário cadastrado com sucesso.'

    novoUsuario.nome = ''
    novoUsuario.cpf = ''
    novoUsuario.senha = ''
    novoUsuario.perfil = 'vendedor'

    await listarUsuarios()
    abaAtual.value = 'inicio'
  } catch {
    erro.value = 'Não foi possível cadastrar o usuário.'
  } finally {
    enviando.value = false
  }
}


async function inativarUsuario(id: number) {
  const usuario = usuarios.value.find((u: Usuario) => u.id_usuario === id)
  if (!usuario) return

  //window prompt pode ser substituído por um modal
  const cpf = window.prompt(
    `Para confirmar a inativação de ${usuario.nome}, informe o CPF do usuário:`,
  )

  if (cpf === null || !cpf.trim()) return

  const confirmado = window.confirm(
    `Confirma a inativação do usuário ${usuario.nome}?`,
  )

  if (!confirmado) return

  enviando.value = true
  erro.value = ''
  mensagem.value = ''

  try {
    await api.patch(`/usuarios/${id}/inativar`, {
      cpf: cpf.trim(),
    })

    mensagem.value = 'Usuário inativado com sucesso.'
    await listarUsuarios()
  } catch (error) {
    erro.value = 'Não foi possível inativar o usuário. Verifique o CPF e tente novamente.'
  } finally {
    enviando.value = false
  }
}


async function sair() {
  auth.sair()
  await router.push('/')
}

onMounted(listarUsuarios)
</script>

<template>
  <main>
    <aside>
      <h2>AutoSaller</h2>

      <nav class="abas">
        <ul>
          <li>
            <button type="button" @click="abaAtual = 'inicio'">
              Início
            </button>
          </li>
          <li>
            <button type="button" @click="abaAtual = 'criar'">
              Criar usuário
            </button>
          </li>
          <li>
            <button type="button" @click="abaAtual = 'inativar'">
              Inativar usuário
            </button>
          </li>
        </ul>
      </nav>

      <button type="button" @click="sair">
        Sair
      </button>
    </aside>

    <section>
      <div v-if="abaAtual === 'inicio'">
        <h1>Dashboard</h1>
        <h2>Usuários cadastrados</h2>

        <p v-if="carregando">Carregando usuários...</p>
        <p v-else-if="erro" role="alert">{{ erro }}</p>

        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Perfil</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id_usuario">
              <td>{{ usuario.id_usuario }}</td>
              <td>{{ usuario.nome }}</td>
              <td>{{ usuario.cpf }}</td>
              <td>{{ usuario.perfil }}</td>
              <td>{{ usuario.ativo ? 'Ativo' : 'Inativo' }}</td>
            </tr>

            <tr v-if="usuarios.length === 0">
              <td colspan="5">Nenhum usuário cadastrado.</td>
            </tr>
          </tbody>
        </table>

        <button type="button" @click="listarUsuarios">
          Atualizar lista
        </button>
      </div>

      <div v-if="abaAtual === 'criar'">
        <h1>Criar usuário</h1>

        <form @submit.prevent="criarUsuario">
          <div>
            <label for="nome">Nome</label>
            <input id="nome" v-model="novoUsuario.nome" required />
          </div>

          <div>
            <label for="cpf">CPF</label>
            <input id="cpf" v-model="novoUsuario.cpf" autocomplete="off" required />
          </div>

          <div>
            <label for="senha">Senha</label>
            <input id="senha" v-model="novoUsuario.senha" type="password" minlength="6" required />
          </div>

          <div>
            <label for="perfil">Perfil</label>
            <select id="perfil" v-model="novoUsuario.perfil" required>
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>

          <button type="submit" :disabled="enviando">
            {{ enviando ? 'Cadastrando...' : 'Cadastrar usuário' }}
          </button>
        </form>
      </div>

      <div v-if="abaAtual === 'inativar'">
        <h1>Inativar usuário</h1>

        <p>
          Selecione o usuário que deseja inativar.
        </p>

        <p v-if="erro" role="alert">{{ erro }}</p>

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="usuario in usuarios.filter((u: Usuario) => u.ativo)" :key="usuario.id_usuario">
              <td>{{ usuario.nome }}</td>
              <td>{{ usuario.cpf }}</td>
              <td>{{ usuario.ativo ? 'Ativo' : 'Inativo' }}</td>
              <td>
                <button type="button" :disabled="enviando" @click="inativarUsuario(usuario.id_usuario)">
                  Inativar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="mensagem" role="status">{{ mensagem }}</p>
    </section>
  </main>
</template>