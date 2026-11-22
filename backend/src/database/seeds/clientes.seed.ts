import 'dotenv/config';
import dataSource from '../data-source';
import { Cliente } from '../../modules/clientes/cliente.entity';

const dados = [

    {
        "nome": "João Pedro Martins",
        "cpf": "12345678901",
        "email": "joao.martins@example.com",
        "telefone": "84999123456",
        "cep": "59380000",
        "endereco": "Rua das Acácias, 125",
        "cidade": "Currais Novos",
        "estado": "RN",
        "documento": "RG 1234567"
    },
    {
        "nome": "Mariana Oliveira Costa",
        "cpf": "23456789012",
        "email": "mariana.costa@example.com",
        "telefone": "84998234567",
        "cep": "59025000",
        "endereco": "Avenida Hermes da Fonseca, 450",
        "cidade": "Natal",
        "estado": "RN",
        "documento": "RG 2345678"
    },
    {
        "nome": "Carlos Eduardo Ferreira",
        "cpf": "34567890123",
        "email": "carlos.ferreira@example.com",
        "telefone": "84997345678",
        "cep": "59300000",
        "endereco": "Rua Coronel Gurgel, 230",
        "cidade": "Mossoró",
        "estado": "RN",
        "documento": "RG 3456789"
    },
    {
        "nome": "Ana Beatriz Souza",
        "cpf": "45678901234",
        "email": "ana.souza@example.com",
        "telefone": "84996456789",
        "cep": "59140000",
        "endereco": "Rua das Flores, 87",
        "cidade": "Parnamirim",
        "estado": "RN",
        "documento": "RG 4567890"
    },
    {
        "nome": "Lucas Gabriel Almeida",
        "cpf": "56789012345",
        "email": "lucas.almeida@example.com",
        "telefone": "84995567890",
        "cep": "59380000",
        "endereco": "Rua Teotônio Freire, 310",
        "cidade": "Currais Novos",
        "estado": "RN",
        "documento": "RG 5678901"
    },
    {
        "nome": "Fernanda Rodrigues Lima",
        "cpf": "67890123456",
        "email": "fernanda.lima@example.com",
        "telefone": "84994678901",
        "cep": "59600000",
        "endereco": "Avenida Alberto Maranhão, 620",
        "cidade": "Mossoró",
        "estado": "RN",
        "documento": "RG 6789012"
    },
    {
        "nome": "Rafael Henrique Santos",
        "cpf": "78901234567",
        "email": "rafael.santos@example.com",
        "telefone": "84993789012",
        "cep": "59064000",
        "endereco": "Rua São José, 155",
        "cidade": "Natal",
        "estado": "RN",
        "documento": "RG 7890123"
    },
    {
        "nome": "Camila Mendes Ribeiro",
        "cpf": "89012345678",
        "email": "camila.ribeiro@example.com",
        "telefone": "84992890123",
        "cep": "59150000",
        "endereco": "Rua Bela Vista, 92",
        "cidade": "São Gonçalo do Amarante",
        "estado": "RN",
        "documento": "RG 8901234"
    },
    {
        "nome": "Felipe Augusto Carvalho",
        "cpf": "90123456789",
        "email": "felipe.carvalho@example.com",
        "telefone": "84991901234",
        "cep": "59380000",
        "endereco": "Rua Laurentino Bezerra, 410",
        "cidade": "Currais Novos",
        "estado": "RN",
        "documento": "RG 9012345"
    },
    {
        "nome": "Beatriz Nascimento Alves",
        "cpf": "01234567890",
        "email": "beatriz.alves@example.com",
        "telefone": "84990012345",
        "cep": "59010000",
        "endereco": "Avenida Prudente de Morais, 780",
        "cidade": "Natal",
        "estado": "RN",
        "documento": "RG 0123456"
    }
]

async function executar() {
    await dataSource.initialize();
    const repository = dataSource.getRepository(Cliente);

    for (const item of dados) {
        const existente = await repository.findOneBy({ cpf: item.cpf });

        if (!existente) {
            await repository.save(
                repository.create({
                    ...item,
                    ativo: true
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