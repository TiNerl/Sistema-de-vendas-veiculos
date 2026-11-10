import { Test, TestingModule } from '@nestjs/testing';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosController', () => {
  let controller: RelatoriosController;
  const relatoriosService = {
    gerarRelatorioEstoque: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [{ provide: RelatoriosService, useValue: relatoriosService }],
    }).compile();

    controller = module.get<RelatoriosController>(RelatoriosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('encaminha a consulta do relatório de estoque ao serviço', async () => {
    const relatorio = [{ status: 'disponivel', quantidade_veiculos: 1, valor_total: 100 }];
    relatoriosService.gerarRelatorioEstoque.mockResolvedValue(relatorio);

    await expect(controller.gerarRelatorioEstoque()).resolves.toBe(relatorio);
    expect(relatoriosService.gerarRelatorioEstoque).toHaveBeenCalledOnce();
  });
});
