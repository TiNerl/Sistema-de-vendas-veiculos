<script setup lang="ts">
import { reactive, ref } from 'vue'

type Usuario = {
  perfil: string
}

type Veiculo = {
  marca: string
  modelo: string
  versao: string
  ano: number
  cor: string
  quilometragem: number
  combustivel: string
  cambio: string
  placa: string
  chassi: string
  renavam: string
  preco: number
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const cpf = ref('')
const senha = ref('')
const token = ref('')
const carregandoLogin = ref(false)
const salvandoVeiculo = ref(false)
const mensagem = ref('')
const tipoMensagem = ref<'sucesso' | 'erro'>('sucesso')

const veiculo = reactive<Veiculo>({
  marca: '',
  modelo: '',
  versao: '',
  ano: new Date().getFullYear(),
  cor: '',
  quilometragem: 0,
  combustivel: '',
  cambio: '',
  placa: '',
  chassi: '',
  renavam: '',
  preco: 0,
})

function mensagemDeErro(dados: unknown, fallback: string) {
  if (typeof dados === 'object' && dados !== null && 'message' in dados) {
    const detalhe = (dados as { message: unknown }).message
    if (typeof detalhe === 'string') return detalhe
    if (Array.isArray(detalhe)) return detalhe.join('. ')
  }
  return fallback
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${apiUrl}${caminho}`, opcoes)
  const dados: unknown = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(mensagemDeErro(dados, 'Não foi possível concluir a solicitação.'))
  }

  return dados as T
}

async function entrar() {
  carregandoLogin.value = true
  mensagem.value = ''

  try {
    const sessao = await requisitar<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpf.value, senha: senha.value }),
    })

    const usuario = await requisitar<Usuario>('/auth/perfil', {
      headers: { Authorization: `Bearer ${sessao.accessToken}` },
    })

    if (usuario.perfil !== 'admin') {
      throw new Error('Somente administradores podem cadastrar veículos.')
    }

    token.value = sessao.accessToken
    senha.value = ''
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível entrar.'
    tipoMensagem.value = 'erro'
  } finally {
    carregandoLogin.value = false
  }
}

async function cadastrarVeiculo() {
  salvandoVeiculo.value = true
  mensagem.value = ''

  try {
    await requisitar<Veiculo>('/veiculos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        ...veiculo,
        placa: veiculo.placa.replace(/-/g, '').toUpperCase(),
        chassi: veiculo.chassi.toUpperCase(),
      }),
    })

    Object.assign(veiculo, {
      marca: '',
      modelo: '',
      versao: '',
      ano: new Date().getFullYear(),
      cor: '',
      quilometragem: 0,
      combustivel: '',
      cambio: '',
      placa: '',
      chassi: '',
      renavam: '',
      preco: 0,
    })
    mensagem.value = 'Veículo cadastrado com sucesso.'
    tipoMensagem.value = 'sucesso'
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível cadastrar o veículo.'
    tipoMensagem.value = 'erro'
  } finally {
    salvandoVeiculo.value = false
  }
}

function sair() {
  token.value = ''
  cpf.value = ''
  mensagem.value = ''
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

    <section v-if="!token" class="cartao cartao-login">
      <p class="sobretitulo">ACESSO RESTRITO</p>
      <h1>Entrar como administrador</h1>
      <p class="descricao">Faça login para cadastrar veículos no estoque.</p>

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

    <section v-else class="cartao">
      <div class="titulo-linha">
        <div>
          <p class="sobretitulo">ESTOQUE</p>
          <h1>Cadastrar veículo</h1>
          <p class="descricao">Informe os dados do veículo para adicioná-lo ao estoque.</p>
        </div>
        <button class="botao-sair" type="button" @click="sair">Sair</button>
      </div>

      <p
        v-if="mensagem"
        class="aviso"
        :class="tipoMensagem"
        :role="tipoMensagem === 'erro' ? 'alert' : 'status'"
      >
        {{ mensagem }}
      </p>

      <form class="formulario grade-formulario" @submit.prevent="cadastrarVeiculo">
        <div class="campo">
          <label for="marca">Marca</label>
          <input id="marca" v-model.trim="veiculo.marca" name="marca" maxlength="100" required />
        </div>
        <div class="campo">
          <label for="modelo">Modelo</label>
          <input id="modelo" v-model.trim="veiculo.modelo" name="modelo" maxlength="100" required />
        </div>
        <div class="campo">
          <label for="versao">Versão</label>
          <input id="versao" v-model.trim="veiculo.versao" name="versao" maxlength="100" required />
        </div>
        <div class="campo">
          <label for="ano">Ano</label>
          <input
            id="ano"
            v-model.number="veiculo.ano"
            name="ano"
            type="number"
            min="1886"
            max="2100"
            required
          />
        </div>
        <div class="campo">
          <label for="cor">Cor</label>
          <input id="cor" v-model.trim="veiculo.cor" name="cor" maxlength="50" required />
        </div>
        <div class="campo">
          <label for="quilometragem">Quilometragem (km)</label>
          <input
            id="quilometragem"
            v-model.number="veiculo.quilometragem"
            name="quilometragem"
            type="number"
            min="0"
            max="2000000"
            required
          />
        </div>
        <div class="campo">
          <label for="combustivel">Combustível</label>
          <select id="combustivel" v-model="veiculo.combustivel" name="combustivel" required>
            <option disabled value="">Selecione</option>
            <option value="flex">Flex</option>
            <option value="gasolina">Gasolina</option>
            <option value="etanol">Etanol</option>
            <option value="diesel">Diesel</option>
            <option value="eletrico">Elétrico</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </div>
        <div class="campo">
          <label for="cambio">Câmbio</label>
          <select id="cambio" v-model="veiculo.cambio" name="cambio" required>
            <option disabled value="">Selecione</option>
            <option value="manual">Manual</option>
            <option value="automatico">Automático</option>
            <option value="cvt">CVT</option>
            <option value="automatizado">Automatizado</option>
          </select>
        </div>
        <div class="campo">
          <label for="placa">Placa</label>
          <input
            id="placa"
            v-model.trim="veiculo.placa"
            name="placa"
            maxlength="8"
            placeholder="ABC1D23"
            required
          />
        </div>
        <div class="campo">
          <label for="chassi">Chassi</label>
          <input
            id="chassi"
            v-model.trim="veiculo.chassi"
            name="chassi"
            minlength="17"
            maxlength="17"
            required
          />
        </div>
        <div class="campo">
          <label for="renavam">RENAVAM</label>
          <input
            id="renavam"
            v-model.trim="veiculo.renavam"
            name="renavam"
            inputmode="numeric"
            minlength="11"
            maxlength="11"
            required
          />
        </div>
        <div class="campo">
          <label for="preco">Preço (R$)</label>
          <input
            id="preco"
            v-model.number="veiculo.preco"
            name="preco"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div class="acoes-formulario">
          <button class="botao-principal" type="submit" :disabled="salvandoVeiculo">
            {{ salvandoVeiculo ? 'Salvando...' : 'Cadastrar veículo' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<style>
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #18211f;
  background: #f3f6f5;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.pagina {
  min-height: 100vh;
  padding: 0 24px 64px;
}

.cabecalho {
  display: flex;
  max-width: 1080px;
  height: 76px;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto 38px;
  border-bottom: 1px solid #e1e8e5;
}

.marca {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #18211f;
  font-size: 20px;
  font-weight: 750;
  text-decoration: none;
}

.marca-icone {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: #166b51;
  color: white;
}

.marca-destaque,
.cabecalho-legenda,
.sobretitulo {
  color: #167153;
}

.cabecalho-legenda,
.sobretitulo {
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.12em;
}

.cartao {
  max-width: 880px;
  margin: 0 auto;
  padding: 36px;
  border: 1px solid #e2e9e6;
  border-radius: 14px;
  background: white;
  box-shadow: 0 12px 36px rgb(25 54 43 / 5%);
}

.cartao-login {
  max-width: 460px;
  margin-top: 72px;
}

.sobretitulo {
  margin: 0 0 10px;
}

h1 {
  margin: 0;
  font-size: clamp(23px, 3vw, 30px);
  letter-spacing: -0.035em;
}

.descricao {
  margin: 10px 0 28px;
  color: #687570;
  line-height: 1.55;
}

.titulo-linha {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.titulo-linha .descricao {
  margin-bottom: 24px;
}

.formulario {
  display: grid;
  gap: 10px;
}

.grade-formulario {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 18px;
  row-gap: 17px;
}

.campo {
  display: grid;
  gap: 7px;
}

label {
  color: #35423d;
  font-size: 13px;
  font-weight: 650;
}

input,
select {
  width: 100%;
  min-height: 43px;
  padding: 9px 11px;
  border: 1px solid #d7e0dc;
  border-radius: 7px;
  background: #fff;
  color: #18211f;
  outline: none;
}

input:focus,
select:focus {
  border-color: #258565;
  box-shadow: 0 0 0 3px rgb(37 133 101 / 12%);
}

input::placeholder {
  color: #98a39f;
}

.botao-principal {
  min-height: 45px;
  padding: 0 18px;
  border: 0;
  border-radius: 7px;
  background: #176d52;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

.botao-principal:hover:not(:disabled) {
  background: #125b44;
}

.botao-principal:disabled {
  cursor: wait;
  opacity: 0.7;
}

.cartao-login .botao-principal {
  margin-top: 10px;
}

.botao-sair {
  padding: 8px 12px;
  border: 1px solid #d7e0dc;
  border-radius: 7px;
  background: white;
  color: #35423d;
  cursor: pointer;
}

.acoes-formulario {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  margin-top: 8px;
}

.aviso {
  margin: 0 0 18px;
  padding: 11px 13px;
  border-radius: 7px;
  font-size: 14px;
  line-height: 1.45;
}

.aviso.sucesso {
  background: #edf8f1;
  color: #17633e;
}

.aviso.erro {
  background: #fff1ef;
  color: #9c3026;
}

@media (max-width: 700px) {
  .pagina {
    padding: 0 16px 36px;
  }

  .cabecalho {
    margin-bottom: 24px;
  }

  .cartao {
    padding: 24px 20px;
  }

  .grade-formulario {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .cabecalho-legenda {
    font-size: 9px;
  }

  .grade-formulario {
    grid-template-columns: 1fr;
  }

  .titulo-linha {
    align-items: flex-start;
  }

  .acoes-formulario .botao-principal {
    width: 100%;
  }
}
</style>
