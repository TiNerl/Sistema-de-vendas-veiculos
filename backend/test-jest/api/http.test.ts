/**
 * Testes de API (nível de componente HTTP), sem banco de dados.
 *
 * Sobe uma aplicação Nest real com: Express, ValidationPipe idêntico ao de main.ts,
 * JwtStrategy/JwtAuthGuard/RolesGuard reais e tokens JWT assinados de verdade.
 * Somente os serviços são substituídos por dublês. Assim verificamos, de ponta a
 * ponta na camada HTTP, os contratos REST/JSON, os códigos de status e o RNF005
 * ("vendedor não acessa funções administrativas nem por URL direta").
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { getMetadataArgsStorage } from 'typeorm';
import { JwtStrategy } from '../../src/modules/auth/strategies/jwt.strategy';
import { UsuariosController } from '../../src/modules/usuarios/usuarios.controller';
import { UsuariosService } from '../../src/modules/usuarios/usuarios.service';
import { Usuario } from '../../src/modules/usuarios/usuario.entity';
import { VeiculosController } from '../../src/modules/veiculos/veiculos.controller';
import { VeiculosService } from '../../src/modules/veiculos/veiculos.service';
import { VendasController } from '../../src/modules/vendas/vendas.controller';
import { VendasService } from '../../src/modules/vendas/vendas.service';
import { mockFn } from '../helpers/mocks';
import { dadosVeiculo } from '../helpers/fabricas';

describe('API REST (HTTP + JWT + perfis + validação)', () => {
  let app: INestApplication;
  let tokenAdmin: string;
  let tokenVendedor: string;
  let tokenExpirado: string;

  const usuariosService = { listar: mockFn(), buscarPorId: mockFn(), cadastrar: mockFn(), inativar: mockFn() };
  const veiculosService = { listar: mockFn(), buscarPorId: mockFn(), cadastrar: mockFn(), atualizar: mockFn(), atualizarStatus: mockFn() };
  const vendasService = { cadastrarVenda: mockFn(), buscarTodas: mockFn(), buscarPorId: mockFn(), aprovar: mockFn(), rejeitar: mockFn() };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: 900 } })],
      controllers: [UsuariosController, VeiculosController, VendasController],
      providers: [
        JwtStrategy,
        { provide: UsuariosService, useValue: usuariosService },
        { provide: VeiculosService, useValue: veiculosService },
        { provide: VendasService, useValue: vendasService },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const jwt = modulo.get(JwtService);
    tokenAdmin = jwt.sign({ sub: 1, cpf: '11144477735', perfil: 'admin', nome: 'Admin' });
    tokenVendedor = jwt.sign({ sub: 2, cpf: '52998224725', perfil: 'vendedor', nome: 'Vendedora' });
    tokenExpirado = jwt.sign({ sub: 1, cpf: '11144477735', perfil: 'admin', iat: Math.floor(Date.now() / 1000) - 3600 }); // expirou há 45 min
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    usuariosService.listar.mockResolvedValue([{ id_usuario: 1, nome: 'Admin' }]);
    veiculosService.listar.mockResolvedValue([]);
    veiculosService.cadastrar.mockImplementation(async (dto: object) => ({ id_veiculo: 1, ...dto }));
    vendasService.cadastrarVenda.mockResolvedValue({ id_venda: 9, status: 'concluida' });
  });

  const http = () => request(app.getHttpServer());

  describe('Autenticação (JWT Bearer)', () => {
    it('401 sem token', async () => {
      await http().get('/veiculos').expect(401);
    });

    it('401 com token adulterado', async () => {
      await http().get('/veiculos').set('Authorization', `Bearer ${tokenAdmin}x`).expect(401);
    });

    it('401 com token expirado', async () => {
      await http().get('/veiculos').set('Authorization', `Bearer ${tokenExpirado}`).expect(401);
    });

    it('200 com token válido', async () => {
      await http().get('/veiculos').set('Authorization', `Bearer ${tokenVendedor}`).expect(200).expect([]);
    });
  });

  describe('Autorização por perfil (RNF005 – inclusive por URL direta)', () => {
    it('403 quando vendedor chama GET /usuarios diretamente', async () => {
      await http().get('/usuarios').set('Authorization', `Bearer ${tokenVendedor}`).expect(403);
      expect(usuariosService.listar).not.toHaveBeenCalled();
    });

    it('403 quando vendedor tenta aprovar desconto (PATCH /vendas/:id/aprovar)', async () => {
      await http().patch('/vendas/5/aprovar').set('Authorization', `Bearer ${tokenVendedor}`).expect(403);
      expect(vendasService.aprovar).not.toHaveBeenCalled();
    });

    it('200 quando administrador lista usuários', async () => {
      const res = await http().get('/usuarios').set('Authorization', `Bearer ${tokenAdmin}`).expect(200);
      expect(res.body).toEqual([{ id_usuario: 1, nome: 'Admin' }]);
    });
  });

  describe('Contratos REST/JSON e validação de entrada', () => {
    it('POST /veiculos: 201 com corpo normalizado pelo DTO', async () => {
      const res = await http()
        .post('/veiculos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...dadosVeiculo(), placa: 'abc-1d23' })
        .expect(201);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(veiculosService.cadastrar).toHaveBeenCalledWith(expect.objectContaining({ placa: 'ABC1D23' }));
    });

    it('POST /veiculos: 400 com lista de mensagens quando o corpo é inválido', async () => {
      const res = await http()
        .post('/veiculos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ...dadosVeiculo(), renavam: '123', ano: 1500 })
        .expect(400);

      expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
      expect(res.body.message).toEqual(expect.arrayContaining([expect.stringMatching(/renavam/), expect.stringMatching(/ano/)]));
      expect(veiculosService.cadastrar).not.toHaveBeenCalled();
    });

    it('GET /veiculos/:id: 400 quando o id não é inteiro (ParseIntPipe)', async () => {
      await http().get('/veiculos/abc').set('Authorization', `Bearer ${tokenAdmin}`).expect(400);
    });

    it('GET /veiculos?precoMin=...: converte a query string para número antes do serviço', async () => {
      await http().get('/veiculos?precoMin=50000&status=disponivel').set('Authorization', `Bearer ${tokenAdmin}`).expect(200);
      expect(veiculosService.listar).toHaveBeenCalledWith(expect.objectContaining({ precoMin: 50000, status: 'disponivel' }));
    });

    it('POST /vendas: o vendedor da venda é o usuário do token (id 2), não um campo do corpo', async () => {
      await http()
        .post('/vendas')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ id_cliente: 10, id_veiculo: 7, forma_pagamento: 'pix', percentual_desconto: 5 })
        .expect(201);
      expect(vendasService.cadastrarVenda).toHaveBeenCalledWith(
        { id_cliente: 10, id_veiculo: 7, forma_pagamento: 'pix', percentual_desconto: 5 },
        2,
      );
    });

    it('exceções de domínio viram respostas HTTP padronizadas (404 Not Found)', async () => {
      vendasService.buscarPorId.mockRejectedValue(new NotFoundException('Venda não encontrada'));

      const res = await http().get('/vendas/999').set('Authorization', `Bearer ${tokenAdmin}`).expect(404);
      expect(res.body).toEqual({ statusCode: 404, message: 'Venda não encontrada', error: 'Not Found' });
    });

    /** DEF-01 no nível HTTP: o filtro de faixa de ano da tela de estoque recebe 400. */
    it.failing('[DEF-01] GET /veiculos?anoMin=2020&anoMax=2025 deve responder 200', async () => {
      await http().get('/veiculos?anoMin=2020&anoMax=2025').set('Authorization', `Bearer ${tokenAdmin}`).expect(200);
    });
  });
});

describe('Proteção do hash de senha no modelo de dados', () => {
  /**
   * DEF-07 — Hash da senha do vendedor exposto nas respostas de vendas.
   * `GET /vendas`, `GET /vendas/:id` e `POST /vendas` carregam a relação `usuario`
   * (leftJoinAndSelect / relations), e a coluna `senha` não possui `select: false`.
   * Resultado: o JSON devolvido inclui `usuario.senha` (hash bcrypt) para qualquer
   * usuário autenticado — viola RNF004/RNF006.
   * Correção sugerida: `@Column({ ..., select: false })` em Usuario.senha
   * (buscarParaLogin já seleciona a senha explicitamente).
   */
  it.failing('[DEF-07] a coluna usuarios.senha não deve ser selecionada por padrão', () => {
    const coluna = getMetadataArgsStorage().columns.find(
      (c) => c.target === Usuario && c.propertyName === 'senha',
    );
    expect(coluna?.options.select).toBe(false);
  });
});
