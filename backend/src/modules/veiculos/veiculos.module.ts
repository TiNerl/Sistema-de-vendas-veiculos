import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracaoEstoque } from './configuracao-estoque.entity';
import { Veiculo } from './veiculo.entity';
import { VeiculosController } from './veiculos.controller';
import { VeiculosService } from './veiculos.service';

@Module({
    imports: [TypeOrmModule.forFeature([Veiculo, ConfiguracaoEstoque])],
    providers: [VeiculosService],
    controllers: [VeiculosController],
})
export class VeiculosModule {}
