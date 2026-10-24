<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { fazerLogin, consultarPerfil } from '../services/auth.service'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const cpf = ref('')
const senha = ref('')
const carregandoLogin = ref(false)
const mensagem = ref('')

async function entrar() {
  carregandoLogin.value = true
  mensagem.value = ''

  try {
    const sessao = await fazerLogin(cpf.value, senha.value)
    const usuario = await consultarPerfil(sessao.accessToken)

    if (usuario.perfil !== 'admin') {
      throw new Error('Somente administradores podem gerenciar veículos.')
    }

    auth.definirSessao(sessao.accessToken, usuario.perfil)
    senha.value = ''
    await router.push('/dashboard')
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível entrar.'
  } finally {
    carregandoLogin.value = false
  }
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho">
      <a class="marca" href="/" aria-label="AutoSaller início">
        <span class="marca-icone" aria-hidden="true">A</span>
        <span>Auto<span class="marca-destaque">Saller</span></span>
      </a>
      <span class="cabecalho-legenda">GESTÃO DE ESTOQUE</span>
    </header>

    <section class="cartao cartao-login">
      <p class="sobretitulo">ACESSO RESTRITO</p>
      <h1>Entrar como administrador</h1>
      <p class="descricao">Faça login para consultar e editar o estoque de veículos.</p>

      <form class="formulario" @submit.prevent="entrar">
        <label for="cpf">CPF</label>
        <input
          id="cpf"
          v-model="cpf"
          name="cpf"
          type="text"
          inputmode="numeric"
          autocomplete="username"
          maxlength="14"
          placeholder="000.000.000-00"
          required
        />

        <label for="senha">Senha</label>
        <input
          id="senha"
          v-model="senha"
          name="senha"
          type="password"
          autocomplete="current-password"
          required
        />

        <p v-if="mensagem" class="aviso erro" role="alert">{{ mensagem }}</p>
        <button class="botao-principal" type="submit" :disabled="carregandoLogin">
          {{ carregandoLogin ? 'Validando acesso...' : 'Entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>