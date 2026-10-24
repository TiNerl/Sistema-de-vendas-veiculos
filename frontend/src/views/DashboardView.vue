<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  atualizarStatusVeiculo,
  atualizarVeiculo,
  buscarVeiculo,
  cadastrarVeiculo,
  listarVeiculos,
} from '../services/veiculos.service'
import { useAuthStore } from '../stores/auth'
import { novoVeiculo, opcoesStatus } from '../types/veiculo'
import type { StatusVeiculo, Veiculo, VeiculoInput } from '../types/veiculo'

const auth = useAuthStore()
const token = () => auth.sessao.token

const salvandoVeiculo = ref(false)
const carregandoEstoque = ref(false)
const salvandoStatus = ref(false)
const veiculos = ref<Veiculo[]>([])
const veiculoSelecionado = ref<Veiculo | null>(null)
const statusEmEdicao = ref<StatusVeiculo>('disponivel')
const editando = ref(false)
const mensagem = ref('')
const tipoMensagem = ref<'sucesso' | 'erro'>('sucesso')
const veiculo = reactive<VeiculoInput>(novoVeiculo())

function mostrarErro(erro: unknown, fallback: string) {
  mensagem.value = erro instanceof Error ? erro.message : fallback
  tipoMensagem.value = 'erro'
}

async function carregarEstoque() {
  carregandoEstoque.value = true

  try {
    veiculos.value = await listarVeiculos(token())
  } catch (erro) {
    mostrarErro(erro, 'Não foi possível consultar o estoque.')
  } finally {
    carregandoEstoque.value = false
  }
}

async function consultarVeiculo(item: Veiculo) {
  mensagem.value = ''
  if (editando.value) limparFormulario()
  editando.value = false

  if (!item.id_veiculo) {
    mostrarErro(new Error('O veículo selecionado não possui um identificador válido.'), 'Não foi possível consultar o veículo.')
    return
  }

  try {
    veiculoSelecionado.value = await buscarVeiculo(item.id_veiculo, token())
    statusEmEdicao.value = veiculoSelecionado.value.status
  } catch (erro) {
    mostrarErro(erro, 'Não foi possível consultar o veículo.')
  }
}

async function salvarStatus() {
  const selecionado = veiculoSelecionado.value
  if (!selecionado?.id_veiculo) return

  salvandoStatus.value = true
  mensagem.value = ''

  try {
    const atualizado = await atualizarStatusVeiculo(
      selecionado.id_veiculo,
      statusEmEdicao.value,
      token(),
    )

    veiculoSelecionado.value = atualizado
    statusEmEdicao.value = atualizado.status
    veiculos.value = veiculos.value.map((item) =>
      item.id_veiculo === atualizado.id_veiculo ? { ...item, status: atualizado.status } : item,
    )
    mensagem.value = 'Status do veículo atualizado.'
    tipoMensagem.value = 'sucesso'
  } catch (erro) {
    mostrarErro(erro, 'Não foi possível atualizar o status.')
  } finally {
    salvandoStatus.value = false
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
  Object.assign(veiculo, novoVeiculo())
}

async function salvarVeiculo() {
  salvandoVeiculo.value = true
  mensagem.value = ''
  const estavaEditando = editando.value

  try {
    let atualizado: Veiculo

    if (estavaEditando) {
      const id = veiculoSelecionado.value?.id_veiculo
      if (!id) throw new Error('Não foi possível identificar o veículo que será editado.')
      atualizado = await atualizarVeiculo(id, { ...veiculo }, token())
    } else {
      atualizado = await cadastrarVeiculo({ ...veiculo }, token())
    }

    await carregarEstoque()

    if (estavaEditando) {
      editando.value = false
      if (atualizado.id_veiculo) {
        veiculoSelecionado.value = await buscarVeiculo(atualizado.id_veiculo, token())
        statusEmEdicao.value = veiculoSelecionado.value.status
      } else {
        veiculoSelecionado.value = atualizado
      }
    } else {
      limparFormulario()
      veiculoSelecionado.value = null
    }

    mensagem.value = estavaEditando
      ? 'Veículo atualizado com sucesso.'
      : 'Veículo cadastrado com sucesso.'
    tipoMensagem.value = 'sucesso'
  } catch (erro) {
    mostrarErro(erro, 'Não foi possível salvar o veículo.')
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

onMounted(carregarEstoque)
</script>

<template>
  <section class="cartao">
    <div class="titulo-linha">
      <div>
        <p class="sobretitulo">ESTOQUE</p>
        <h1>Gestão de estoque</h1>
        <p class="descricao">Consulte os veículos cadastrados ou mantenha seus dados atualizados.</p>
      </div>
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
        <input id="ano" v-model.number="veiculo.ano" name="ano" type="number" min="1886" max="2100" required />
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
        <input id="placa" v-model.trim="veiculo.placa" name="placa" maxlength="8" placeholder="ABC1D23" required />
      </div>
      <div class="campo">
        <label for="chassi">Chassi</label>
        <input id="chassi" v-model.trim="veiculo.chassi" name="chassi" minlength="17" maxlength="17" required />
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
        <input id="preco" v-model.number="veiculo.preco" name="preco" type="number" min="0.01" step="0.01" required />
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
          <span class="linha-item-estoque">
            <span class="item-preco">{{ formatarPreco(item.preco) }}</span>
            <span class="status-badge" :class="`status-${item.status}`">
              {{ opcoesStatus.find((opcao) => opcao.valor === item.status)?.rotulo ?? item.status }}
            </span>
          </span>
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

        <div class="controle-status">
          <div>
            <p class="sobretitulo">STATUS ATUAL</p>
            <span class="status-badge" :class="`status-${veiculoSelecionado.status}`">
              {{ opcoesStatus.find((opcao) => opcao.valor === veiculoSelecionado?.status)?.rotulo ?? veiculoSelecionado?.status }}
            </span>
          </div>
          <form class="formulario-status" @submit.prevent="salvarStatus">
            <label for="status-veiculo">Alterar status</label>
            <select id="status-veiculo" v-model="statusEmEdicao">
              <option v-for="opcao in opcoesStatus" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.rotulo }}
              </option>
            </select>
            <button
              class="botao-secundario"
              type="submit"
              :disabled="salvandoStatus || statusEmEdicao === veiculoSelecionado.status"
            >
              {{ salvandoStatus ? 'Salvando...' : 'Atualizar status' }}
            </button>
          </form>
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
</template>