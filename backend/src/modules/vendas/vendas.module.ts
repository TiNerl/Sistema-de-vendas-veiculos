import { Module } from '@nestjs/common';
import { VendasService } from './vendas.service';
import { VendasController } from './vendas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venda } from './venda.entity'
import { Cliente } from '../clientes/cliente.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Venda, Cliente, Veiculo, Usuario])],
  providers: [VendasService],
  controllers: [VendasController]
})
export class VendasModule {}
