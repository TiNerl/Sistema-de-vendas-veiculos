import { api } from './api'
import type { StatusVeiculo, Veiculo, VeiculoInput } from '../types/veiculo'

export async function listarVeiculos(): Promise<Veiculo[]> {
    const resposta = await api.get<Veiculo[]>('/veiculos')
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