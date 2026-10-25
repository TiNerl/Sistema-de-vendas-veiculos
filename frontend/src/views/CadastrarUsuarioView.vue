<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  cadastrarUsuario,
  mensagemErroApi,
} from '@/services/usuarios.service'
import type { NovoUsuario } from '@/services/usuarios.service'

const router = useRouter()
const formulario = reactive<NovoUsuario & { confirmarSenha: string }>({
  nome: '',
  cpf: '',
  senha: '',
  confirmarSenha: '',
  perfil: 'vendedor',
})
const erros = reactive<Record<string, string>>({})
const carregando = ref(false)
const erroApi = ref('')
const sucesso = ref(false)

function cpfValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false

  const calcularDigito = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + Number(digito) * (pesoInicial - indice),
      0,
    )
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return (
    calcularDigito(digitos.slice(0, 9), 10) === Number(digitos[9]) &&
    calcularDigito(digitos.slice(0, 10), 11) === Number(digitos[10])
  )
}

function validar(): boolean {
  Object.keys(erros).forEach((campo) => delete erros[campo])
  const nome = formulario.nome.trim()

  if (!nome) erros.nome = 'Informe o nome completo.'
  else if (nome.length > 100) erros.nome = 'O nome deve ter no máximo 100 caracteres.'

  if (!formulario.cpf.trim()) erros.cpf = 'Informe o CPF.'
  else if (!cpfValido(formulario.cpf)) erros.cpf = 'Informe um CPF válido.'

  if (!formulario.senha) erros.senha = 'Informe uma senha inicial.'
  else if (formulario.senha.length < 6) erros.senha = 'A senha deve ter pelo menos 6 caracteres.'
  else if (formulario.senha.length > 255) erros.senha = 'A senha deve ter no máximo 255 caracteres.'

  if (!formulario.confirmarSenha) erros.confirmarSenha = 'Confirme a senha.'
  else if (formulario.confirmarSenha !== formulario.senha) {
    erros.confirmarSenha = 'As senhas não coincidem.'
  }

  return Object.keys(erros).length === 0
}

async function cadastrar() {
  erroApi.value = ''
  sucesso.value = false
  if (!validar() || carregando.value) return

  carregando.value = true
  try {
    await cadastrarUsuario({
      nome: formulario.nome.trim(),
      cpf: formulario.cpf.replace(/\D/g, ''),
      senha: formulario.senha,
      perfil: formulario.perfil,
    })
    sucesso.value = true
    formulario.nome = ''
    formulario.cpf = ''
    formulario.senha = ''
    formulario.confirmarSenha = ''
    formulario.perfil = 'vendedor'
  } catch (error) {
    erroApi.value = mensagemErroApi(error, 'Não foi possível cadastrar o usuário.')
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <span class="eyebrow">ADMINISTRAÇÃO</span>
        <h1>Cadastrar usuário</h1>
        <p>Adicione uma pessoa à equipe do AutoSaller.</p>
      </div>
    </div>

    <div v-if="sucesso" class="alert alert--success notice" role="status">
      Usuário cadastrado com sucesso.
      <button class="table-action" type="button" @click="router.push('/admin/usuarios')">
        Voltar à lista de usuários
      </button>
    </div>
    <div v-if="erroApi" class="alert alert--error notice" role="alert">{{ erroApi }}</div>

    <form class="card" novalidate @submit.prevent="cadastrar">
      <div class="form-grid">
        <div class="field">
          <label for="novo-nome">Nome completo</label>
          <input
            id="novo-nome"
            v-model="formulario.nome"
            autocomplete="name"
            maxlength="100"
            required
            :aria-invalid="Boolean(erros.nome)"
            aria-describedby="novo-nome-erro"
          />
          <span v-if="erros.nome" id="novo-nome-erro" class="field-error">{{ erros.nome }}</span>
        </div>

        <div class="field">
          <label for="novo-cpf">CPF</label>
          <input
            id="novo-cpf"
            v-model="formulario.cpf"
            inputmode="numeric"
            autocomplete="off"
            maxlength="14"
            placeholder="000.000.000-00"
            required
            :aria-invalid="Boolean(erros.cpf)"
            aria-describedby="novo-cpf-erro"
          />
          <span v-if="erros.cpf" id="novo-cpf-erro" class="field-error">{{ erros.cpf }}</span>
        </div>

        <div class="field">
          <label for="nova-senha">Senha inicial</label>
          <input
            id="nova-senha"
            v-model="formulario.senha"
            type="password"
            autocomplete="new-password"
            minlength="6"
            maxlength="255"
            required
            :aria-invalid="Boolean(erros.senha)"
            aria-describedby="nova-senha-ajuda"
          />
          <span v-if="erros.senha" id="nova-senha-ajuda" class="field-error">{{ erros.senha }}</span>
          <span v-else id="nova-senha-ajuda" class="field-error">Mínimo de 6 caracteres.</span>
        </div>

        <div class="field">
          <label for="confirmar-senha">Confirmar senha</label>
          <input
            id="confirmar-senha"
            v-model="formulario.confirmarSenha"
            type="password"
            autocomplete="new-password"
            required
            :aria-invalid="Boolean(erros.confirmarSenha)"
            aria-describedby="confirmar-senha-erro"
          />
          <span v-if="erros.confirmarSenha" id="confirmar-senha-erro" class="field-error">
            {{ erros.confirmarSenha }}
          </span>
        </div>

        <div class="field">
          <label for="novo-perfil">Perfil</label>
          <select id="novo-perfil" v-model="formulario.perfil" required>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <RouterLink class="button button--secondary" to="/admin/usuarios">Cancelar</RouterLink>
        <button class="button button--gold" type="submit" :disabled="carregando">
          <span v-if="carregando" class="spinner" aria-hidden="true"></span>
          {{ carregando ? 'Cadastrando...' : 'Cadastrar usuário' }}
        </button>
      </div>
    </form>
  </section>
</template>
