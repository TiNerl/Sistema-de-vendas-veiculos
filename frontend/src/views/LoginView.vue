<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const cpf = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const erroCpf = ref('')
const erroSenha = ref('')
const cpfId = 'login-cpf'
const senhaId = 'login-senha'

const senhaTipo = computed(() => (mostrarSenha.value ? 'text' : 'password'))

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

async function entrar() {
  erroCpf.value = cpfValido(cpf.value) ? '' : 'Informe um CPF válido.'
  erroSenha.value = senha.value.trim() ? '' : 'Informe sua senha.'
  if (erroCpf.value || erroSenha.value || auth.carregando) return

  try {
    await auth.entrar({
      cpf: cpf.value.replace(/\D/g, ''),
      senha: senha.value,
    })

    const destino = route.query.redirect
    const caminhoSeguro =
      typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//')
        ? destino
        : auth.usuario?.perfil === 'vendedor'
          ? '/vendedor'
          : '/dashboard'
    await router.replace(caminhoSeguro)
  } catch {
    // A mensagem de autenticação é exibida pelo estado da store.
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-brand" aria-label="AutoSeller">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M8 31.5 12.4 19a4 4 0 0 1 3.8-2.7h15.6a4 4 0 0 1 3.8 2.7L40 31.5v7h-4v-4H12v4H8v-7Z" />
          <path d="M13 27h22M16 33h.1M32 33h.1" />
          <path d="m17 12 7-5 7 5" />
        </svg>
      </div>
      <a class="login-wordmark" href="/" aria-label="AutoSeller — início">AutoSeller</a>
      <p>Gestão inteligente para sua concessionária</p>
      <div class="brand-rule" aria-hidden="true"></div>
      <span class="brand-caption">Gestão que acompanha o seu negócio.</span>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="login-heading">
          <h1>Acesse sua conta</h1>
          <p>Entre com suas credenciais para continuar.</p>
        </div>

        <div v-if="auth.erro" class="alert alert--error" role="alert">
          {{ auth.erro }}
        </div>

        <form class="form-stack" @submit.prevent="entrar">
          <div class="field">
            <label :for="cpfId">CPF</label>
            <input
              :id="cpfId"
              v-model="cpf"
              inputmode="numeric"
              autocomplete="username"
              maxlength="14"
              placeholder="000.000.000-00"
              :aria-invalid="Boolean(erroCpf)"
              :aria-describedby="erroCpf ? `${cpfId}-erro` : undefined"
              @input="erroCpf = ''"
            />
            <span v-if="erroCpf" :id="`${cpfId}-erro`" class="field-error">
              {{ erroCpf }}
            </span>
          </div>

          <div class="field">
            <label :for="senhaId">Senha</label>
            <div class="password-input">
              <input
                :id="senhaId"
                v-model="senha"
                :type="senhaTipo"
                autocomplete="current-password"
                placeholder="Digite sua senha"
                :aria-invalid="Boolean(erroSenha)"
                :aria-describedby="erroSenha ? `${senhaId}-erro` : undefined"
                @input="erroSenha = ''"
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
            <span v-if="erroSenha" :id="`${senhaId}-erro`" class="field-error">
              {{ erroSenha }}
            </span>
          </div>

          <button class="button button--gold login-submit" type="submit" :disabled="auth.carregando">
            <span v-if="auth.carregando" class="spinner" aria-hidden="true"></span>
            {{ auth.carregando ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
        <p class="login-security">Acesso protegido para usuários autorizados.</p>
      </div>
    </section>
  </main>
</template>
