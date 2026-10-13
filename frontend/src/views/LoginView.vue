<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const cpf = ref('')
const senha = ref('')

async function entrar() {
  try {
    await auth.entrar({
      cpf: cpf.value,
      senha: senha.value,
    })

    await router.push('/dashboard')
  } catch {
  }
}
</script>



<template>
  <main>
    <h1>AutoSaller</h1>

    <form @submit.prevent="entrar">
      <h2>Acesse sua conta</h2>

      <p>Informe suas credenciais para acessar o sistema.</p>

      <div v-if="auth.erro" role="alert">
        {{ auth.erro }}
      </div>

      <div>
        <label for="cpf">Usuário</label>
        <input
          id="cpf"
          v-model="cpf"
          type="text"
          autocomplete="username"
          placeholder="Digite seu usuário"
          required
        />
      </div>

      <div>
        <label for="senha">Senha</label>
        <input
          id="senha"
          v-model="senha"
          type="password"
          autocomplete="current-password"
          placeholder="Digite sua senha"
          required
        />
      </div>

      <button type="submit" :disabled="auth.carregando">
        {{ auth.carregando ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </main>
</template>

<style scoped>

</style>
