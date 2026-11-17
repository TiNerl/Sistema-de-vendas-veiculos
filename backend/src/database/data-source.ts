import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuarios/usuario.entity';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Veiculo } from '../modules/veiculos/veiculo.entity';
import { Venda } from '../modules/vendas/venda.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Adiciona compatibilidade com o ssl
  entities: [Usuario, Cliente, Veiculo, Venda],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
