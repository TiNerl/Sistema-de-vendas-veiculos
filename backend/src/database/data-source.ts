import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuarios/usuario.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Veiculo } from '../modules/veiculos/veiculo.entity';
import { Venda } from '../modules/vendas/venda.entity';
import { Auditoria } from '../modules/auditoria/auditoria.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [Usuario, Cliente, Veiculo, Venda, Auditoria],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});