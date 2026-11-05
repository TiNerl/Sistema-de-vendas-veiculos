import { api } from './api'
import type { StatusVeiculo, Veiculo, VeiculoInput } from '../types/veiculo'

export type FiltrosVeiculos = {
    marca?: string
    modelo?: string
    precoMin?: number
    precoMax?: number
    anoMin?: number
    anoMax?: number
    combustivel?: string
    status?: StatusVeiculo
}

export async function listarVeiculos(filtros: FiltrosVeiculos = {}): Promise<Veiculo[]> {
    const resposta = await api.get<Veiculo[]>('/veiculos', { params: filtros })
    return resposta.data
}

export async function buscarVeiculo(id: number): Promise<Veiculo> {
    const resposta = await api.get<Veiculo>(`/veiculos/${id}`)
    return resposta.data
}

export async function cadastrarVeiculo(dados: VeiculoInput): Promise<Veiculo> {
    const resposta = await api.post<Veiculo>('/veiculos', {
        ...dados,
        placa: dados.placa.replace(/-/g, '').toUpperCase(),
        chassi: dados.chassi.toUpperCase(),
        preco: Number(dados.preco),
    })
    return resposta.data
}

export async function atualizarVeiculo(id: number, dados: VeiculoInput): Promise<Veiculo> {
    const resposta = await api.patch<Veiculo>(`/veiculos/${id}`, {
        ...dados,
        placa: dados.placa.replace(/-/g, '').toUpperCase(),
        chassi: dados.chassi.toUpperCase(),
        preco: Number(dados.preco),
    })
    return resposta.data
}

export async function atualizarStatusVeiculo(id: number, status: StatusVeiculo): Promise<Veiculo> {
    const resposta = await api.patch<Veiculo>(`/veiculos/${id}/status`, { status })
    return resposta.data
}

export async function excluirVeiculo(id: number): Promise<void> {
    await api.delete(`/veiculos/${id}`)
}