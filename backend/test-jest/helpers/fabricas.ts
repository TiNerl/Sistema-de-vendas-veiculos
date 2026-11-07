/**
 * Fábricas de dados de teste (test data builders).
 * Cada fábrica devolve um objeto válido; os testes sobrescrevem só o que importa.
 */
import { StatusVeiculo } from '../../src/modules/veiculos/veiculo-status.enum';
import type { Cliente } from '../../src/modules/clientes/cliente.entity';
import type { Usuario } from '../../src/modules/usuarios/usuario.entity';
import type { Veiculo } from '../../src/modules/veiculos/veiculo.entity';
import type { CriarVeiculoDto } from '../../src/modules/veiculos/dto/criar-veiculo.dto';
import type { CriarClienteDto } from '../../src/modules/clientes/dto/criar-cliente.dto';

const agora = new Date('2026-11-07T12:00:00.000Z');

export function umUsuario(sobrescrever: Partial<Usuario> = {}): Usuario {
  return {
    id_usuario: 2,
    nome: 'Vendedora Teste',
    cpf: '52998224725',
    senha: '$2b$10$hashFicticioDeTeste',
    perfil: 'vendedor',
    ativo: true,
    data_criacao: agora,
    atualizado_em: agora,
    ...sobrescrever,
  };
}

export function umAdministrador(sobrescrever: Partial<Usuario> = {}): Usuario {
  return umUsuario({ id_usuario: 1, nome: 'Admin Teste', cpf: '11144477735', perfil: 'admin', ...sobrescrever });
}

export function dadosCliente(sobrescrever: Partial<CriarClienteDto> = {}): CriarClienteDto {
  return {
    nome: 'Maria da Silva',
    cpf: '39053344705',
    email: 'maria@exemplo.com',
    telefone: '84999990000',
    cep: '59380000',
    endereco: 'Rua das Flores, 100',
    cidade: 'Currais Novos',
    estado: 'RN',
    documento: 'RG1234567',
    ...sobrescrever,
  };
}

export function umCliente(sobrescrever: Partial<Cliente> = {}): Cliente {
  return {
    id_cliente: 10,
    ...dadosCliente(),
    ativo: true,
    data_criacao: agora,
    atualizado_em: agora,
    ...sobrescrever,
  };
}

export function dadosVeiculo(sobrescrever: Partial<CriarVeiculoDto> = {}): CriarVeiculoDto {
  return {
    marca: 'Toyota',
    modelo: 'Corolla',
    versao: 'XEi',
    ano: 2024,
    cor: 'Prata',
    quilometragem: 12000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'ABC1D23',
    chassi: '9BWZZZ377VT004251',
    renavam: '12345678901',
    preco: 100000,
    ...sobrescrever,
  };
}

export function umVeiculo(sobrescrever: Partial<Veiculo> = {}): Veiculo {
  const { preco: _preco, ...resto } = dadosVeiculo();
  return {
    id_veiculo: 7,
    ...resto,
    preco: '100000.00',
    status: StatusVeiculo.DISPONIVEL,
    data_criacao: agora,
    atualizado_em: agora,
    ...sobrescrever,
  };
}
