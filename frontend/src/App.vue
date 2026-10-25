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
  <RouterView />
</template>

<style scoped></style>
