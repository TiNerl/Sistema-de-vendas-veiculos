<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  cadastrarUsuario,
  inativarUsuario,
  listarUsuarios,
  mensagemErroApi,
} from '@/services/usuarios.service'
import type { NovoUsuario, Usuario } from '@/services/usuarios.service'

const usuarios = ref<Usuario[]>([])
const busca = ref('')
const filtroPerfil = ref('')
const filtroSituacao = ref('')
const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')
const modalCadastroAberto = ref(false)
const modalInativacaoAberto = ref(false)
const usuarioSelecionado = ref<Usuario | null>(null)
const cpfConfirmacao = ref('')
const enviando = ref(false)

const formulario = reactive<NovoUsuario & { confirmarSenha: string }>({
  nome: '', cpf: '', senha: '', confirmarSenha: '', perfil: 'vendedor',
})
const erros = reactive<Record<string, string>>({})

const usuariosFiltrados = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  const cpfBusca = termo.replace(/\D/g, '')
  return usuarios.value.filter((usuario) => {
    const correspondeBusca = !termo || usuario.nome.toLocaleLowerCase('pt-BR').includes(termo) || (cpfBusca.length > 0 && usuario.cpf.replace(/\D/g, '').includes(cpfBusca))
    const correspondePerfil = !filtroPerfil.value || usuario.perfil === filtroPerfil.value
    const correspondeSituacao = !filtroSituacao.value || (filtroSituacao.value === 'ativo' ? usuario.ativo : !usuario.ativo)
    return correspondeBusca && correspondePerfil && correspondeSituacao
  })
})

const cpfConfere = computed(() => usuarioSelecionado.value
  ? cpfConfirmacao.value.replace(/\D/g, '') === usuarioSelecionado.value.cpf.replace(/\D/g, '')
  : false)

async function carregarUsuarios() {
  carregando.value = true
  erro.value = ''
  try { usuarios.value = await listarUsuarios() }
  catch (error) { erro.value = mensagemErroApi(error, 'Não foi possível carregar os usuários.') }
  finally { carregando.value = false }
}

function perfilLegivel(perfil: Usuario['perfil']): string {
  return perfil === 'admin' ? 'Administrador' : 'Vendedor'
}

function cpfValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 11 || /(\d)\1{10}/.test(digitos)) return false
  const calcular = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return calcular(digitos.slice(0, 9), 10) === Number(digitos[9]) && calcular(digitos.slice(0, 10), 11) === Number(digitos[10])
}

function abrirCadastro() {
  Object.keys(erros).forEach((campo) => delete erros[campo])
  formulario.nome = ''; formulario.cpf = ''; formulario.senha = ''; formulario.confirmarSenha = ''; formulario.perfil = 'vendedor'
  erro.value = ''; sucesso.value = ''; modalCadastroAberto.value = true
}

function fecharCadastro() { if (!enviando.value) modalCadastroAberto.value = false }

function validarCadastro(): boolean {
  Object.keys(erros).forEach((campo) => delete erros[campo])
  if (!formulario.nome.trim()) erros.nome = 'Informe o nome completo.'
  else if (formulario.nome.trim().length > 100) erros.nome = 'O nome deve ter no máximo 100 caracteres.'
  if (!formulario.cpf.trim()) erros.cpf = 'Informe o CPF.'
  else if (!cpfValido(formulario.cpf)) erros.cpf = 'Informe um CPF válido.'
  if (!formulario.senha) erros.senha = 'Informe uma senha inicial.'
  else if (formulario.senha.length < 6) erros.senha = 'A senha deve ter pelo menos 6 caracteres.'
  else if (formulario.senha.length > 255) erros.senha = 'A senha deve ter no máximo 255 caracteres.'
  if (!formulario.confirmarSenha) erros.confirmarSenha = 'Confirme a senha.'
  else if (formulario.confirmarSenha !== formulario.senha) erros.confirmarSenha = 'As senhas não coincidem.'
  return Object.keys(erros).length === 0
}

async function cadastrar() {
  if (!validarCadastro() || enviando.value) return
  enviando.value = true; erro.value = ''
  try {
    await cadastrarUsuario({ nome: formulario.nome.trim(), cpf: formulario.cpf.replace(/\D/g, ''), senha: formulario.senha, perfil: formulario.perfil })
    modalCadastroAberto.value = false
    sucesso.value = 'Usuário cadastrado com sucesso.'
    await carregarUsuarios()
  } catch (error) { erro.value = mensagemErroApi(error, 'Não foi possível cadastrar o usuário.') }
  finally { enviando.value = false }
}

function abrirConfirmacao(usuario: Usuario) {
  usuarioSelecionado.value = usuario
  cpfConfirmacao.value = ''
  erro.value = ''
  modalInativacaoAberto.value = true
}

async function confirmarInativacao() {
  if (!usuarioSelecionado.value || !cpfConfere.value || enviando.value) return
  enviando.value = true; erro.value = ''
  try {
    const nome = usuarioSelecionado.value.nome
    await inativarUsuario(usuarioSelecionado.value.id_usuario, cpfConfirmacao.value.replace(/\D/g, ''))
    modalInativacaoAberto.value = false
    usuarioSelecionado.value = null
    cpfConfirmacao.value = ''
    sucesso.value = `O usuário ${nome} foi inativado.`
    await carregarUsuarios()
  } catch (error) { erro.value = mensagemErroApi(error, 'Não foi possível inativar o usuário.') }
  finally { enviando.value = false }
}

onMounted(carregarUsuarios)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ADMINISTRAÇÃO</span>
        <h1>Usuários</h1>
        <p>Gerencie os usuários cadastrados no AutoSeller.</p>
      </div>
      <button class="button button--gold" type="button" @click="abrirCadastro">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg>
        Novo usuário
      </button>
    </div>

    <div v-if="sucesso" class="alert alert--success notice" role="status">{{ sucesso }}</div>
    <div v-if="erro" class="alert alert--error notice" role="alert">{{ erro }}</div>

    <section class="card filter-card" aria-label="Filtros de usuários">
      <div class="filters">
        <div class="field search-field">
          <label for="busca-usuarios">Pesquisar</label>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          <input id="busca-usuarios" v-model="busca" type="search" placeholder="Nome ou CPF" autocomplete="off" />
        </div>
        <div class="field">
          <label for="filtro-perfil">Perfil</label>
          <select id="filtro-perfil" v-model="filtroPerfil">
            <option value="">Todos os perfis</option><option value="admin">Administrador</option><option value="vendedor">Vendedor</option>
          </select>
        </div>
        <div class="field">
          <label for="filtro-situacao">Situação</label>
          <select id="filtro-situacao" v-model="filtroSituacao">
            <option value="">Todas</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <p v-if="carregando" class="loading-state" role="status">Carregando usuários...</p>
      <div v-else-if="!erro && usuariosFiltrados.length === 0" class="empty-state">
        {{ usuarios.length ? 'Nenhum usuário corresponde aos filtros.' : 'Nenhum usuário cadastrado.' }}
      </div>
      <div v-else-if="!erro" class="table-wrap">
        <table class="data-table">
          <thead><tr><th scope="col">Nome</th><th scope="col">CPF</th><th scope="col">Perfil</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
          <tbody>
            <tr v-for="usuario in usuariosFiltrados" :key="usuario.id_usuario">
              <td class="user-primary">{{ usuario.nome }}</td><td>{{ usuario.cpf }}</td><td>{{ perfilLegivel(usuario.perfil) }}</td>
              <td><span class="status-badge" :class="usuario.ativo ? 'status-badge--active' : 'status-badge--inactive'">{{ usuario.ativo ? 'Ativo' : 'Inativo' }}</span></td>
              <td><button v-if="usuario.ativo" class="table-action table-action--danger" type="button" :disabled="enviando" @click="abrirConfirmacao(usuario)">Inativar</button><span v-else class="table-action table-action--disabled">—</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modalCadastroAberto" class="modal-backdrop" @click.self="fecharCadastro">
      <section class="confirm-dialog user-form-modal" role="dialog" aria-modal="true" aria-labelledby="novo-usuario-titulo">
        <h2 id="novo-usuario-titulo">Novo usuário</h2>
        <form novalidate @submit.prevent="cadastrar">
          <div class="form-grid user-form-grid">
            <div class="field"><label for="novo-nome">Nome completo</label><input id="novo-nome" v-model="formulario.nome" autocomplete="name" maxlength="100" required :aria-invalid="Boolean(erros.nome)" /><span v-if="erros.nome" class="field-error">{{ erros.nome }}</span></div>
            <div class="field"><label for="novo-cpf">CPF</label><input id="novo-cpf" v-model="formulario.cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required :aria-invalid="Boolean(erros.cpf)" /><span v-if="erros.cpf" class="field-error">{{ erros.cpf }}</span></div>
            <div class="field"><label for="nova-senha">Senha inicial</label><input id="nova-senha" v-model="formulario.senha" type="password" autocomplete="new-password" minlength="6" maxlength="255" required :aria-invalid="Boolean(erros.senha)" /><span v-if="erros.senha" class="field-error">{{ erros.senha }}</span><span v-else class="field-error">Mínimo de 6 caracteres.</span></div>
            <div class="field"><label for="confirmar-senha">Confirmar senha</label><input id="confirmar-senha" v-model="formulario.confirmarSenha" type="password" autocomplete="new-password" required :aria-invalid="Boolean(erros.confirmarSenha)" /><span v-if="erros.confirmarSenha" class="field-error">{{ erros.confirmarSenha }}</span></div>
            <div class="field"><label for="novo-perfil">Perfil</label><select id="novo-perfil" v-model="formulario.perfil" required><option value="admin">Administrador</option><option value="vendedor">Vendedor</option></select></div>
          </div>
          <div class="dialog-actions"><button class="button button--secondary" type="button" :disabled="enviando" @click="fecharCadastro">Cancelar</button><button class="button button--gold" type="submit" :disabled="enviando"><span v-if="enviando" class="spinner" aria-hidden="true"></span>{{ enviando ? 'Cadastrando...' : 'Cadastrar usuário' }}</button></div>
        </form>
      </section>
    </div>

    <div v-if="modalInativacaoAberto && usuarioSelecionado" class="modal-backdrop" @click.self="modalInativacaoAberto = false">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmar-inativacao-titulo">
        <h2 id="confirmar-inativacao-titulo">Confirmar inativação</h2>
        <p class="confirm-copy">Você está prestes a inativar <span class="confirm-name">{{ usuarioSelecionado.nome }}</span>. Essa ação bloqueará o acesso, mas preservará o histórico.</p>
        <div class="field"><label for="cpf-confirmacao">Confirme o CPF do usuário para continuar</label><input id="cpf-confirmacao" v-model="cpfConfirmacao" inputmode="numeric" maxlength="14" placeholder="CPF do usuário selecionado" /></div>
        <div class="dialog-actions"><button class="button button--secondary" type="button" :disabled="enviando" @click="modalInativacaoAberto = false">Cancelar</button><button class="button button--danger" type="button" :disabled="enviando || !cpfConfere" @click="confirmarInativacao"><span v-if="enviando" class="spinner" aria-hidden="true"></span>{{ enviando ? 'Inativando...' : 'Confirmar inativação' }}</button></div>
      </section>
    </div>
  </section>
</template>
