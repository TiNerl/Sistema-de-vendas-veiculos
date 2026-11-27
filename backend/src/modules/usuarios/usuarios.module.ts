import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './usuario.entity';
import { Auditoria } from '../auditoria/auditoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Auditoria])],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService]
})
export class UsuariosModule {}
