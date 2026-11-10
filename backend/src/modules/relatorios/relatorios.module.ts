import { Module } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';
import { Venda } from '../vendas/venda.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Venda, Veiculo])],
  providers: [RelatoriosService],
  controllers: [RelatoriosController]
})
export class RelatoriosModule {}
