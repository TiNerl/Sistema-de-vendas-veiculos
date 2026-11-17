import 'dotenv/config';
import * as bcrypt from 'bcrypt';

import dataSource from '../data-source';
import { Usuario } from '../../modules/usuarios/usuario.entity';

const cpfAdmin = process.env.SEED_ADMIN_CPF;
const cpfVendedor = process.env.SEED_VENDEDOR_CPF;

const senhaAdmin = process.env.SEED_ADMIN_PASSWORD;
const senhaVendedor = process.env.SEED_VENDEDOR_PASSWORD;

    if(!cpfAdmin|| !cpfVendedor) {
        throw new Error('CPFs de de Administrador ou Vendedor não definidos!');
    }

    if(!senhaAdmin|| !senhaVendedor) {
        throw new Error('Senha de Administrador ou Vendedor não definidas!');
    }

const dados = [
  {
    nome: 'Administrador do Sistema',
    cpf: cpfAdmin,
    senha: senhaAdmin,
    perfil: 'admin' as const,
    ativo: true,
  },
  {
    nome: 'Vendedor de Testes',
    cpf: cpfVendedor,
    senha: senhaVendedor,
    perfil: 'vendedor' as const,
    ativo: true,
  },
];

async function executar() {

    await dataSource.initialize();
    const repository = dataSource.getRepository(Usuario);

    for (const item of dados) {
        const existente = await repository.findOneBy({ cpf: item.cpf });


        if (!existente) {
            const senhaHash = await bcrypt.hash(item.senha, 10);
            await repository.save(
                repository.create({
                    ...item,
                    senha: senhaHash
                }),
            );
        }
    }

    await dataSource.destroy();
}

executar().catch(async (erro) => {
    console.error(erro);

    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }

    process.exitCode = 1;
});