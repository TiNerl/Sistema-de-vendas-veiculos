export type StatusVeiculo = 'disponivel' | 'reservado' | 'vendido' | 'em_manutencao'

export type Veiculo = {
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
    preco: number | string
    status: StatusVeiculo
    data_criacao?: string
    atualizado_em?: string
}

export type VeiculoInput = Omit<Veiculo, 'id_veiculo' | 'status' | 'data_criacao' | 'atualizado_em'>

export const opcoesStatus: { valor: StatusVeiculo; rotulo: string }[] = [
    { valor: 'disponivel', rotulo: 'Disponível' },
    { valor: 'reservado', rotulo: 'Reservado' },
    { valor: 'vendido', rotulo: 'Vendido' },
    { valor: 'em_manutencao', rotulo: 'Em Manutenção' },
]

export function novoVeiculo(): VeiculoInput {
    return {
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
    }
}