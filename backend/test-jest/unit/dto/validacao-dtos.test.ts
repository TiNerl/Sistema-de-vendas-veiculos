/**
 * RF-EST-04 / RF-CLI-05 – Validação de dados na fronteira da API.
 * Os DTOs são validados por class-validator via ValidationPipe global (main.ts).
 * Aqui o pipeline é reproduzido com plainToInstance + validate, como o Nest faz.
 */
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CriarVeiculoDto } from '../../../src/modules/veiculos/dto/criar-veiculo.dto';
import { AtualizarVeiculoDto } from '../../../src/modules/veiculos/dto/atualizar-veiculo.dto';
import { FiltrarVeiculosDto } from '../../../src/modules/veiculos/dto/filtrar-veiculos.dto';
import { AtualizarStatusVeiculoDto } from '../../../src/modules/veiculos/dto/atualizar-status-veiculo.dto';
import { CriarClienteDto } from '../../../src/modules/clientes/dto/criar-cliente.dto';
import { AtualizarClienteDto } from '../../../src/modules/clientes/dto/atualizar-cliente.dto';
import { CriarUsuarioDto } from '../../../src/modules/usuarios/dto/criar-usuario.dto';
import { InativarUsuarioDto } from '../../../src/modules/usuarios/dto/inativar-usuario.dto';
import { CadastrarVendaDto } from '../../../src/modules/vendas/dto/cadastrar-venda.dto';
import { FiltrarVendasDto } from '../../../src/modules/vendas/dto/filtrar-vendas.dto';
import { FiltrarRelatorioFaturamentoDto } from '../../../src/modules/relatorios/dto/filtrar-relatorio-faturamento.dto';
import { dadosCliente, dadosVeiculo } from '../../helpers/fabricas';

type Classe<T> = new () => T;

/** Converte + valida; devolve a instância transformada e as propriedades com erro. */
async function validar<T extends object>(classe: Classe<T>, dados: Record<string, unknown>) {
  const instancia = plainToInstance(classe, dados, { enableImplicitConversion: true });
  const erros = await validate(instancia, { whitelist: true, forbidNonWhitelisted: true });
  return { instancia, campos: erros.map((e) => e.property), erros };
}

describe('CriarVeiculoDto', () => {
  it('aceita um veículo válido', async () => {
    await expect(validar(CriarVeiculoDto, { ...dadosVeiculo() })).resolves.toMatchObject({ campos: [] });
  });

  it('normaliza placa (remove hífen, maiúsculas), chassi (maiúsculas) e textos (trim)', async () => {
    const { instancia, campos } = await validar(CriarVeiculoDto, {
      ...dadosVeiculo(),
      placa: 'abc-1d23',
      chassi: '9bwzzz377vt004251',
      marca: '  Toyota  ',
    });
    expect(campos).toEqual([]);
    expect(instancia).toMatchObject({ placa: 'ABC1D23', chassi: '9BWZZZ377VT004251', marca: 'Toyota' });
  });

  it.each([
    ['placa', 'ABC12345', 'formato inexistente'],
    ['placa', 'AB1C234', 'letras/números fora de posição'],
    ['chassi', '9BWZZZ377VT00425', '16 caracteres'],
    ['chassi', '9BWZZZ377VT00425I', 'contém a letra I (proibida no VIN)'],
    ['chassi', '9BWZZZ377VT00425O', 'contém a letra O (proibida no VIN)'],
    ['renavam', '1234567890', '10 dígitos'],
    ['renavam', '1234567890A', 'contém letra'],
    ['ano', 1885, 'antes do primeiro automóvel (1886)'],
    ['ano', new Date().getFullYear() + 1, 'ano futuro'],
    ['quilometragem', -1, 'negativa'],
    ['combustivel', 'querosene', 'fora da lista'],
    ['cambio', 'sequencial', 'fora da lista'],
    ['preco', 0, 'zero'],
    ['preco', 10.999, 'mais de 2 casas decimais'],
    ['marca', '   ', 'apenas espaços'],
  ])('rejeita %s = %p (%s)', async (campo, valor, _motivo) => {
    const { campos } = await validar(CriarVeiculoDto, { ...dadosVeiculo(), [campo]: valor });
    expect(campos).toContain(campo);
  });

  it('aceita placa no padrão antigo (ABC1234) e no Mercosul (ABC1D23)', async () => {
    for (const placa of ['ABC1234', 'ABC1D23']) {
      const { campos } = await validar(CriarVeiculoDto, { ...dadosVeiculo(), placa });
      expect(campos).toEqual([]);
    }
  });

  it('rejeita campos desconhecidos (forbidNonWhitelisted) — ex.: tentar definir o status no cadastro', async () => {
    const { campos } = await validar(CriarVeiculoDto, { ...dadosVeiculo(), status: 'vendido' });
    expect(campos).toContain('status');
  });
});

describe('AtualizarVeiculoDto', () => {
  it('todos os campos são opcionais (PATCH parcial)', async () => {
    await expect(validar(AtualizarVeiculoDto, {})).resolves.toMatchObject({ campos: [] });
  });

  it('mantém as mesmas regras de formato quando o campo é enviado', async () => {
    const { campos } = await validar(AtualizarVeiculoDto, { renavam: '123', placa: 'X' });
    expect(campos).toEqual(expect.arrayContaining(['renavam', 'placa']));
  });
});

describe('FiltrarVeiculosDto (query string)', () => {
  it('converte strings da URL para número e valida enumerações', async () => {
    const { instancia, campos } = await validar(FiltrarVeiculosDto, {
      precoMin: '1000', precoMax: '90000', ano: '2024', status: 'disponivel', combustivel: 'flex',
    });
    expect(campos).toEqual([]);
    expect(instancia).toMatchObject({ precoMin: 1000, precoMax: 90000, ano: 2024 });
  });

  it('rejeita preço negativo, status e combustível inválidos', async () => {
    const { campos } = await validar(FiltrarVeiculosDto, { precoMin: '-5', status: 'inativo', combustivel: 'gnv' });
    expect(campos).toEqual(expect.arrayContaining(['precoMin', 'status', 'combustivel']));
  });

  /**
   * DEF-01 — Filtro por faixa de ano quebrado entre frontend e backend.
   * O frontend (veiculos.service.ts / VeiculosVendedorView.vue) e o README enviam
   * `anoMin` e `anoMax`; o DTO só conhece `ano`. Com `forbidNonWhitelisted: true`
   * a API responde 400 "property anoMin should not exist" e a tela de estoque
   * exibe erro sempre que o usuário filtra por ano.
   */
  it.failing('[DEF-01] aceita os parâmetros anoMin/anoMax enviados pelo frontend', async () => {
    const { campos } = await validar(FiltrarVeiculosDto, { anoMin: '2020', anoMax: '2025' });
    expect(campos).toEqual([]);
  });
});

describe('AtualizarStatusVeiculoDto', () => {
  it.each(['disponivel', 'reservado', 'vendido', 'em_manutencao'])('aceita "%s"', async (status) => {
    await expect(validar(AtualizarStatusVeiculoDto, { status })).resolves.toMatchObject({ campos: [] });
  });

  it('rejeita status fora do enum', async () => {
    await expect(validar(AtualizarStatusVeiculoDto, { status: 'baixado' })).resolves.toMatchObject({
      campos: ['status'],
    });
  });
});

describe('CriarClienteDto / AtualizarClienteDto', () => {
  it('aceita um cliente válido', async () => {
    await expect(validar(CriarClienteDto, { ...dadosCliente() })).resolves.toMatchObject({ campos: [] });
  });

  it('exige todos os campos obrigatórios no cadastro', async () => {
    const { campos } = await validar(CriarClienteDto, {});
    expect(campos.sort()).toEqual(
      ['cep', 'cidade', 'cpf', 'documento', 'email', 'endereco', 'estado', 'nome', 'telefone'].sort(),
    );
  });

  it.each([
    ['cpf', '1234567890', 'O CPF deve ter exatamente 11 dígitos'],
    ['email', 'maria@', 'Formato de e-mail inválido'],
    ['estado', 'RNN', 'O estado deve ter exatamente 2 caracteres (ex: SP)'],
    ['cep', '5938000', 'O CEP deve ter exatamente 8 dígitos'],
    ['nome', 'Al', 'O nome deve ter no mínimo 3 caracteres'],
    ['telefone', '849999', 'O telefone deve ter no mínimo 10 dígitos'],
  ])('rejeita %s = "%s" com mensagem em português', async (campo, valor, mensagem) => {
    const { erros } = await validar(CriarClienteDto, { ...dadosCliente(), [campo]: valor });
    const erro = erros.find((e) => e.property === campo);
    expect(Object.values(erro?.constraints ?? {})).toContain(mensagem);
  });

  it('na edição, valida apenas os campos enviados', async () => {
    await expect(validar(AtualizarClienteDto, { cidade: 'Natal' })).resolves.toMatchObject({ campos: [] });
    await expect(validar(AtualizarClienteDto, { email: 'invalido' })).resolves.toMatchObject({ campos: ['email'] });
  });
});

describe('CriarUsuarioDto / InativarUsuarioDto', () => {
  const valido = { nome: 'João', cpf: '52998224725', senha: 'segredo1', perfil: 'vendedor' };

  it('aceita usuário válido', async () => {
    await expect(validar(CriarUsuarioDto, valido)).resolves.toMatchObject({ campos: [] });
  });

  it.each([
    ['perfil', 'gerente'],
    ['senha', '12345'],
    ['cpf', '529.982.247-25'],
  ])('rejeita %s = %p', async (campo, valor) => {
    const { campos } = await validar(CriarUsuarioDto, { ...valido, [campo]: valor });
    expect(campos).toContain(campo);
  });

  it('inativação exige CPF com 11 dígitos (confirmação da identidade)', async () => {
    await expect(validar(InativarUsuarioDto, { cpf: '123' })).resolves.toMatchObject({ campos: ['cpf'] });
  });
});

describe('CadastrarVendaDto', () => {
  const valida = { id_cliente: 1, id_veiculo: 2, forma_pagamento: 'financiamento' };

  it('aceita venda válida com e sem desconto', async () => {
    await expect(validar(CadastrarVendaDto, valida)).resolves.toMatchObject({ campos: [] });
    await expect(validar(CadastrarVendaDto, { ...valida, percentual_desconto: 12.5 })).resolves.toMatchObject({
      campos: [],
    });
  });

  it.each([
    ['percentual_desconto', 100.01],
    ['percentual_desconto', -1],
    ['percentual_desconto', 5.555],
    ['forma_pagamento', 'cheque'],
    ['id_cliente', 0],
    ['id_veiculo', 1.5],
  ])('rejeita %s = %p', async (campo, valor) => {
    const { campos } = await validar(CadastrarVendaDto, { ...valida, [campo]: valor });
    expect(campos).toContain(campo);
  });

  it('não aceita que o cliente informe o vendedor no corpo (id vem do token)', async () => {
    const { campos } = await validar(CadastrarVendaDto, { ...valida, id_usuario: 1 });
    expect(campos).toContain('id_usuario');
  });
});

describe('Filtros de período (vendas e relatório)', () => {
  it('aceitam datas ISO e rejeitam formatos inválidos', async () => {
    await expect(validar(FiltrarVendasDto, { dataInicio: '2026-11-01', cliente_id: '3' })).resolves.toMatchObject({
      campos: [],
    });
    await expect(validar(FiltrarVendasDto, { dataInicio: '01/11/2026' })).resolves.toMatchObject({
      campos: ['dataInicio'],
    });
    await expect(validar(FiltrarRelatorioFaturamentoDto, { dataFim: 'ontem' })).resolves.toMatchObject({
      campos: ['dataFim'],
    });
  });
});
