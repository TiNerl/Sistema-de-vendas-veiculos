/**
 * Camada de controle (REST): verifica que cada endpoint
 *  (1) está protegido por JwtAuthGuard + RolesGuard (RNF005);
 *  (2) declara os perfis da matriz de permissões do README;
 *  (3) apenas delega ao serviço — sem regra de negócio no controller.
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { ROLES_KEY } from '../../../src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../../src/modules/auth/guards/local-auth.guard';
import { RolesGuard } from '../../../src/modules/auth/guards/roles.guard';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { ClientesController } from '../../../src/modules/clientes/clientes.controller';
import { ClientesService } from '../../../src/modules/clientes/clientes.service';
import { RelatoriosController } from '../../../src/modules/relatorios/relatorios.controller';
import { RelatoriosService } from '../../../src/modules/relatorios/relatorios.service';
import { UsuariosController } from '../../../src/modules/usuarios/usuarios.controller';
import { UsuariosService } from '../../../src/modules/usuarios/usuarios.service';
import { VeiculosController } from '../../../src/modules/veiculos/veiculos.controller';
import { VeiculosService } from '../../../src/modules/veiculos/veiculos.service';
import { StatusVeiculo } from '../../../src/modules/veiculos/veiculo-status.enum';
import { VendasController } from '../../../src/modules/vendas/vendas.controller';
import { VendasService } from '../../../src/modules/vendas/vendas.service';
import { AppController } from '../../../src/app.controller';
import { AppService } from '../../../src/app.service';
import { mockFn } from '../../helpers/mocks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctor = { prototype: any };
const handler = (c: Ctor, m: string) => c.prototype[m] as object;
const guards = (c: Ctor, m: string) => Reflect.getMetadata(GUARDS_METADATA, handler(c, m));
const perfis = (c: Ctor, m: string) => Reflect.getMetadata(ROLES_KEY, handler(c, m));

describe('Matriz de permissões por endpoint (RNF005)', () => {
  const AMBOS = ['admin', 'vendedor'];
  const ADMIN = ['admin'];

  it.each([
    ['GET    /usuarios', UsuariosController, 'listar', ADMIN],
    ['GET    /usuarios/:id', UsuariosController, 'buscarPorId', ADMIN],
    ['POST   /usuarios', UsuariosController, 'cadastrar', ADMIN],
    ['PATCH  /usuarios/:id/inativar', UsuariosController, 'inativar', ADMIN],
    ['POST   /clientes', ClientesController, 'cadastrar', AMBOS],
    ['GET    /clientes', ClientesController, 'findAll', AMBOS],
    ['GET    /clientes/:id', ClientesController, 'buscarPorId', AMBOS],
    ['PATCH  /clientes/:id', ClientesController, 'atualizar', AMBOS],
    ['PATCH  /clientes/:id/inativar', ClientesController, 'inativar', AMBOS],
    ['GET    /veiculos', VeiculosController, 'listar', AMBOS],
    ['GET    /veiculos/:id', VeiculosController, 'buscarPorId', AMBOS],
    ['POST   /vendas', VendasController, 'cadastrar', AMBOS],
    ['GET    /vendas', VendasController, 'findAll', AMBOS],
    ['GET    /vendas/:id', VendasController, 'buscarPorId', AMBOS],
    ['PATCH  /vendas/:id/aprovar', VendasController, 'aprovar', ADMIN],
    ['PATCH  /vendas/:id/rejeitar', VendasController, 'rejeitar', ADMIN],
    ['GET    /relatorios/faturamento', RelatoriosController, 'gerarRelatorioFaturamento', AMBOS],
  ] as const)('%s → JWT + RolesGuard, perfis %j', (_rota, ctrl, metodo, esperado) => {
    expect(guards(ctrl, metodo)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(perfis(ctrl, metodo)).toEqual(esperado);
  });

  it('POST /auth/login usa a estratégia local; GET /auth/perfil exige JWT', () => {
    expect(guards(AuthController, 'login')).toEqual([LocalAuthGuard]);
    expect(guards(AuthController, 'perfil')).toEqual([JwtAuthGuard]);
  });

  /**
   * DEF-04 — Cadastro, edição e alteração de status de veículos liberados ao vendedor.
   * Regra: RF-USU-08 e RF-USU-14 atribuem essas ações ao ADMINISTRADOR; o README do
   * projeto afirma que `POST /veiculos` exige "token Bearer de administrador" e que
   * "vendedores apenas consultam os status".
   * Atual: os três endpoints aceitam `admin` e `vendedor`.
   */
  it.failing.each([
    ['POST   /veiculos', 'cadastrar'],
    ['PATCH  /veiculos/:id', 'atualizar'],
    ['PATCH  /veiculos/:id/status', 'atualizarStatus'],
  ])('[DEF-04] %s deve ser exclusivo do administrador', (_rota, metodo) => {
    expect(perfis(VeiculosController, metodo)).toEqual(ADMIN);
  });
});

describe('Delegação dos controllers aos serviços', () => {
  const svc = {
    usuarios: { listar: mockFn(), buscarPorId: mockFn(), cadastrar: mockFn(), inativar: mockFn() },
    clientes: { cadastrar: mockFn(), inativar: mockFn(), findAll: mockFn(), buscarPorId: mockFn(), atualizar: mockFn() },
    veiculos: { listar: mockFn(), buscarPorId: mockFn(), cadastrar: mockFn(), atualizar: mockFn(), atualizarStatus: mockFn() },
    vendas: { cadastrarVenda: mockFn(), buscarTodas: mockFn(), buscarPorId: mockFn(), aprovar: mockFn(), rejeitar: mockFn() },
    relatorios: { gerarRelatorioFaturamento: mockFn() },
    auth: { login: mockFn() },
  };
  let c: {
    usuarios: UsuariosController; clientes: ClientesController; veiculos: VeiculosController;
    vendas: VendasController; relatorios: RelatoriosController; auth: AuthController; app: AppController;
  };

  beforeEach(async () => {
    Object.values(svc).forEach((s) => Object.values(s).forEach((fn) => fn.mockReturnValue('resultado')));
    const m = await Test.createTestingModule({
      controllers: [UsuariosController, ClientesController, VeiculosController, VendasController,
        RelatoriosController, AuthController, AppController],
      providers: [
        AppService,
        { provide: UsuariosService, useValue: svc.usuarios },
        { provide: ClientesService, useValue: svc.clientes },
        { provide: VeiculosService, useValue: svc.veiculos },
        { provide: VendasService, useValue: svc.vendas },
        { provide: RelatoriosService, useValue: svc.relatorios },
        { provide: AuthService, useValue: svc.auth },
      ],
    }).compile();
    c = {
      usuarios: m.get(UsuariosController), clientes: m.get(ClientesController), veiculos: m.get(VeiculosController),
      vendas: m.get(VendasController), relatorios: m.get(RelatoriosController), auth: m.get(AuthController),
      app: m.get(AppController),
    };
  });

  it('UsuariosController', () => {
    expect(c.usuarios.listar()).toBe('resultado');
    c.usuarios.buscarPorId(3);
    c.usuarios.cadastrar({ nome: 'A', cpf: '52998224725', senha: '123456', perfil: 'vendedor' });
    c.usuarios.inativar(3, { cpf: '52998224725' });
    expect(svc.usuarios.buscarPorId).toHaveBeenCalledWith(3);
    expect(svc.usuarios.cadastrar).toHaveBeenCalledWith(expect.objectContaining({ perfil: 'vendedor' }));
    expect(svc.usuarios.inativar).toHaveBeenCalledWith({ cpf: '52998224725' }, 3);
  });

  it('ClientesController', () => {
    c.clientes.findAll('maria');
    c.clientes.buscarPorId(10);
    c.clientes.atualizar(10, { telefone: '84999990000' });
    c.clientes.inativar(10);
    expect(svc.clientes.findAll).toHaveBeenCalledWith('maria');
    expect(svc.clientes.atualizar).toHaveBeenCalledWith(10, { telefone: '84999990000' });
    expect(svc.clientes.inativar).toHaveBeenCalledWith(10);
    expect(c.clientes.buscarPorId(10)).toBe('resultado');
  });

  it('VeiculosController', () => {
    c.veiculos.listar({ marca: 'Fiat' });
    c.veiculos.buscarPorId(7);
    c.veiculos.atualizar(7, { cor: 'Azul' });
    c.veiculos.atualizarStatus(7, { status: StatusVeiculo.EM_MANUTENCAO });
    expect(svc.veiculos.listar).toHaveBeenCalledWith({ marca: 'Fiat' });
    expect(svc.veiculos.atualizarStatus).toHaveBeenCalledWith(7, StatusVeiculo.EM_MANUTENCAO);
    expect(svc.veiculos.atualizar).toHaveBeenCalledWith(7, { cor: 'Azul' });
  });

  it('VendasController usa o id do usuário autenticado (vem do JWT, nunca do corpo)', () => {
    const dto = { id_cliente: 10, id_veiculo: 7, forma_pagamento: 'pix' as const };
    c.vendas.cadastrar(dto, { user: { id: 2, perfil: 'vendedor' } });
    c.vendas.findAll({ cliente_id: 10 });
    c.vendas.buscarPorId(5);
    c.vendas.aprovar(5);
    c.vendas.rejeitar(6);
    expect(svc.vendas.cadastrarVenda).toHaveBeenCalledWith(dto, 2);
    expect(svc.vendas.buscarTodas).toHaveBeenCalledWith({ cliente_id: 10 });
    expect(svc.vendas.aprovar).toHaveBeenCalledWith(5);
    expect(svc.vendas.rejeitar).toHaveBeenCalledWith(6);
  });

  it('RelatoriosController, AuthController e AppController', () => {
    const user = { id_usuario: 1, nome: 'A', cpf: '1', perfil: 'admin' as const, ativo: true,
      data_criacao: new Date(), atualizado_em: new Date() };
    c.relatorios.gerarRelatorioFaturamento({ dataInicio: '2026-01-01' });
    c.auth.login({ user });
    expect(svc.relatorios.gerarRelatorioFaturamento).toHaveBeenCalledWith({ dataInicio: '2026-01-01' });
    expect(svc.auth.login).toHaveBeenCalledWith(user);
    expect(c.auth.perfil({ user })).toBe(user);
    expect(c.app.getHello()).toBe('Hello World!');
  });
});
