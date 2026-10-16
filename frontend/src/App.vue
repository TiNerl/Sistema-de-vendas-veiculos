<script setup lang="ts">
import { reactive, ref } from 'vue'

type Usuario = {
  perfil: string
}

type Veiculo = {
  id_veiculo?: number
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
  data_criacao?: string
  atualizado_em?: string
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const cpf = ref('')
const senha = ref('')
const token = ref('')
const carregandoLogin = ref(false)
const salvandoVeiculo = ref(false)
const carregandoEstoque = ref(false)
const veiculos = ref<Veiculo[]>([])
const veiculoSelecionado = ref<Veiculo | null>(null)
const editando = ref(false)
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
    await carregarEstoque()
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível entrar.'
    tipoMensagem.value = 'erro'
  } finally {
    carregandoLogin.value = false
  }
}

async function carregarEstoque() {
  carregandoEstoque.value = true

  try {
    veiculos.value = await requisitar<Veiculo[]>('/veiculos', {
      headers: { Authorization: `Bearer ${token.value}` },
    })
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível consultar o estoque.'
    tipoMensagem.value = 'erro'
  } finally {
    carregandoEstoque.value = false
  }
}

async function consultarVeiculo(veiculo: Veiculo) {
  mensagem.value = ''
  if (editando.value) limparFormulario()
  editando.value = false

  try {
    veiculoSelecionado.value = await requisitar<Veiculo>(`/veiculos/${veiculo.id_veiculo}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível consultar o veículo.'
    tipoMensagem.value = 'erro'
  }
}

function editarVeiculo() {
  if (!veiculoSelecionado.value) return
  Object.assign(veiculo, {
    marca: veiculoSelecionado.value.marca,
    modelo: veiculoSelecionado.value.modelo,
    versao: veiculoSelecionado.value.versao,
    ano: veiculoSelecionado.value.ano,
    cor: veiculoSelecionado.value.cor,
    quilometragem: veiculoSelecionado.value.quilometragem,
    combustivel: veiculoSelecionado.value.combustivel,
    cambio: veiculoSelecionado.value.cambio,
    placa: veiculoSelecionado.value.placa,
    chassi: veiculoSelecionado.value.chassi,
    renavam: veiculoSelecionado.value.renavam,
    preco: Number(veiculoSelecionado.value.preco),
  })
  editando.value = true
  mensagem.value = ''
}

function limparFormulario() {
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
}

async function salvarVeiculo() {
  salvandoVeiculo.value = true
  mensagem.value = ''

  try {
    const atualizado = await requisitar<Veiculo>(
      editando.value ? `/veiculos/${veiculoSelecionado.value?.id_veiculo}` : '/veiculos',
      {
        method: editando.value ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify({
          marca: veiculo.marca,
          modelo: veiculo.modelo,
          versao: veiculo.versao,
          ano: veiculo.ano,
          cor: veiculo.cor,
          quilometragem: veiculo.quilometragem,
          combustivel: veiculo.combustivel,
          cambio: veiculo.cambio,
          placa: veiculo.placa.replace(/-/g, '').toUpperCase(),
          chassi: veiculo.chassi.toUpperCase(),
          renavam: veiculo.renavam,
          preco: Number(veiculo.preco),
        }),
      },
    )

    await carregarEstoque()
    if (editando.value) await consultarVeiculo(atualizado)
    else limparFormulario()
    mensagem.value = editando.value ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.'
    tipoMensagem.value = 'sucesso'
    editando.value = false
  } catch (erro) {
    mensagem.value = erro instanceof Error ? erro.message : 'Não foi possível salvar o veículo.'
    tipoMensagem.value = 'erro'
  } finally {
    salvandoVeiculo.value = false
  }
}

function cancelarEdicao() {
  editando.value = false
  limparFormulario()
}

function formatarPreco(preco: number | string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(preco))
}

function formatarData(data?: string) {
  if (!data) return 'Não disponível'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data))
}

function sair() {
  token.value = ''
  cpf.value = ''
  veiculos.value = []
  veiculoSelecionado.value = null
  editando.value = false
  limparFormulario()
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

    <section v-else class="cartao">
      <div class="titulo-linha">
        <div>
          <p class="sobretitulo">ESTOQUE</p>
          <h1>Gestão de estoque</h1>
          <p class="descricao">Consulte os veículos cadastrados ou mantenha seus dados atualizados.</p>
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

      <form class="formulario grade-formulario" @submit.prevent="salvarVeiculo">
        <div class="cabecalho-formulario">
          <h2>{{ editando ? 'Editar veículo' : 'Cadastrar veículo' }}</h2>
          <button v-if="editando" class="botao-secundario" type="button" @click="cancelarEdicao">
            Cancelar edição
          </button>
        </div>
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
            {{ salvandoVeiculo ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar veículo' }}
          </button>
        </div>
      </form>

      <section class="estoque" aria-labelledby="titulo-estoque">
        <div class="cabecalho-estoque">
          <div>
            <p class="sobretitulo">VEÍCULOS CADASTRADOS</p>
            <h2 id="titulo-estoque">Estoque <span class="contador">{{ veiculos.length }}</span></h2>
          </div>
          <button class="botao-secundario" type="button" :disabled="carregandoEstoque" @click="carregarEstoque">
            {{ carregandoEstoque ? 'Atualizando...' : 'Atualizar lista' }}
          </button>
        </div>

        <p v-if="!carregandoEstoque && veiculos.length === 0" class="estado-vazio">
          Nenhum veículo cadastrado no estoque.
        </p>
        <div v-else class="lista-estoque">
          <button
            v-for="item in veiculos"
            :key="item.id_veiculo"
            class="item-estoque"
            :class="{ selecionado: veiculoSelecionado?.id_veiculo === item.id_veiculo }"
            type="button"
            @click="consultarVeiculo(item)"
          >
            <span class="item-principal">{{ item.marca }} {{ item.modelo }}</span>
            <span class="item-secundario">{{ item.versao }} · {{ item.ano }} · {{ item.placa }}</span>
            <span class="item-preco">{{ formatarPreco(item.preco) }}</span>
          </button>
        </div>

        <article v-if="veiculoSelecionado" class="detalhe-veiculo" aria-labelledby="titulo-detalhe">
          <div class="cabecalho-detalhe">
            <div>
              <p class="sobretitulo">DETALHES DO VEÍCULO #{{ veiculoSelecionado.id_veiculo }}</p>
              <h2 id="titulo-detalhe">{{ veiculoSelecionado.marca }} {{ veiculoSelecionado.modelo }}</h2>
            </div>
            <button class="botao-principal botao-editar" type="button" @click="editarVeiculo">
              Editar dados
            </button>
          </div>
          <dl class="grade-detalhes">
            <div><dt>Versão</dt><dd>{{ veiculoSelecionado.versao }}</dd></div>
            <div><dt>Ano</dt><dd>{{ veiculoSelecionado.ano }}</dd></div>
            <div><dt>Cor</dt><dd>{{ veiculoSelecionado.cor }}</dd></div>
            <div><dt>Quilometragem</dt><dd>{{ veiculoSelecionado.quilometragem.toLocaleString('pt-BR') }} km</dd></div>
            <div><dt>Combustível</dt><dd>{{ veiculoSelecionado.combustivel }}</dd></div>
            <div><dt>Câmbio</dt><dd>{{ veiculoSelecionado.cambio }}</dd></div>
            <div><dt>Placa</dt><dd>{{ veiculoSelecionado.placa }}</dd></div>
            <div><dt>Chassi</dt><dd>{{ veiculoSelecionado.chassi }}</dd></div>
            <div><dt>RENAVAM</dt><dd>{{ veiculoSelecionado.renavam }}</dd></div>
            <div><dt>Preço</dt><dd>{{ formatarPreco(veiculoSelecionado.preco) }}</dd></div>
            <div><dt>Cadastrado em</dt><dd>{{ formatarData(veiculoSelecionado.data_criacao) }}</dd></div>
            <div><dt>Última atualização</dt><dd>{{ formatarData(veiculoSelecionado.atualizado_em) }}</dd></div>
          </dl>
        </article>
      </section>
    </section>
  </main>
</template>
