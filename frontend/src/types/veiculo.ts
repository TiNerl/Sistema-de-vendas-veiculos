export type StatusVeiculo = 'disponivel' | 'reservado' | 'vendido' | 'em_manutencao'
export type CombustivelVeiculo = 'gasolina' | 'etanol' | 'flex' | 'diesel' | 'eletrico' | 'hibrido'
export type CambioVeiculo = 'manual' | 'automatico' | 'cvt' | 'automatizado'

export type Veiculo = {
    id_veiculo?: number
    marca: string
    modelo: string
    versao: string
    ano: number
    cor: string
    quilometragem: number
    combustivel: CombustivelVeiculo | string
    cambio: CambioVeiculo | string
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

export const opcoesCombustivel: { valor: CombustivelVeiculo; rotulo: string }[] = [
    { valor: 'gasolina', rotulo: 'Gasolina' },
    { valor: 'etanol', rotulo: 'Etanol' },
    { valor: 'flex', rotulo: 'Flex' },
    { valor: 'diesel', rotulo: 'Diesel' },
    { valor: 'eletrico', rotulo: 'Elétrico' },
    { valor: 'hibrido', rotulo: 'Híbrido' },
]

export const opcoesCambio: { valor: CambioVeiculo; rotulo: string }[] = [
    { valor: 'manual', rotulo: 'Manual' },
    { valor: 'automatico', rotulo: 'Automático' },
    { valor: 'cvt', rotulo: 'CVT' },
    { valor: 'automatizado', rotulo: 'Automatizado' },
]

export function rotuloCombustivel(combustivel: string): string {
    const encontrado = opcoesCombustivel.find((opcao) => opcao.valor === combustivel)
    return encontrado?.rotulo ?? combustivel
}

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