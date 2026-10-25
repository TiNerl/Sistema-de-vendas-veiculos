import { requisitar } from './api'
import type { StatusVeiculo, Veiculo, VeiculoInput } from '../types/veiculo'

export function listarVeiculos(token: string): Promise<Veiculo[]> {
    return requisitar<Veiculo[]>('/veiculos', {}, token)
}

export function buscarVeiculo(id: number, token: string): Promise<Veiculo> {
    return requisitar<Veiculo>(`/veiculos/${id}`, {}, token)
}

export function cadastrarVeiculo(dados: VeiculoInput, token: string): Promise<Veiculo> {
    return requisitar<Veiculo>('/veiculos', {
        method: 'POST',
        body: JSON.stringify({
            ...dados,
            placa: dados.placa.replace(/-/g, '').toUpperCase(),
            chassi: dados.chassi.toUpperCase(),
            preco: Number(dados.preco),
        }),
    }, token)
}

export function atualizarVeiculo(id: number, dados: VeiculoInput, token: string): Promise<Veiculo> {
    return requisitar<Veiculo>(`/veiculos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            ...dados,
            placa: dados.placa.replace(/-/g, '').toUpperCase(),
            chassi: dados.chassi.toUpperCase(),
            preco: Number(dados.preco),
        }),
    }, token)
}

export function atualizarStatusVeiculo(id: number, status: StatusVeiculo, token: string): Promise<Veiculo> {
    return requisitar<Veiculo>(`/veiculos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }, token)
}