import 'dotenv/config';
import dataSource from '../data-source';
import { Veiculo } from '../../modules/veiculos/veiculo.entity';
import { StatusVeiculo } from '../../modules/veiculos/veiculo-status.enum';

const dados = [
  {
    marca: 'Volkswagen',
    modelo: 'Polo',
    versao: '1.0 MPI Track',
    ano: 2023,
    cor: 'Branco',
    quilometragem: 18500,
    combustivel: 'flex',
    cambio: 'manual',
    placa: 'ABC1D23',
    chassi: '9BWZZZ377VT004251',
    renavam: '01234567890',
    preco: '72900.00',
  },
  {
    marca: 'Chevrolet',
    modelo: 'Onix',
    versao: '1.0 LT Turbo',
    ano: 2022,
    cor: 'Prata',
    quilometragem: 32000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'DEF2G34',
    chassi: '9BWZZZ377VT004269',
    renavam: '12345678901',
    preco: '78500.00',
  },
  {
    marca: 'Toyota',
    modelo: 'Corolla',
    versao: '2.0 XEI',
    ano: 2024,
    cor: 'Preto',
    quilometragem: 12000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'GHI3J45',
    chassi: '9BGKS48U0JG123456',
    renavam: '23456789012',
    preco: '148900.00',
  },
  {
    marca: 'Hyundai',
    modelo: 'HB20',
    versao: '1.0 Comfort',
    ano: 2021,
    cor: 'Vermelho',
    quilometragem: 45000,
    combustivel: 'flex',
    cambio: 'manual',
    placa: 'JKL4M56',
    chassi: '93YBSR7RHCJ123456',
    renavam: '34567890123',
    preco: '64900.00',
  },
  {
    marca: 'Honda',
    modelo: 'Civic',
    versao: '2.0 EXL',
    ano: 2020,
    cor: 'Cinza',
    quilometragem: 58000,
    combustivel: 'flex',
    cambio: 'cvt',
    placa: 'MNO5P67',
    chassi: '9BWAB45U6KT123456',
    renavam: '45678901234',
    preco: '112500.00',
  },
  {
    marca: 'Fiat',
    modelo: 'Argo',
    versao: '1.3 Drive',
    ano: 2023,
    cor: 'Azul',
    quilometragem: 21000,
    combustivel: 'flex',
    cambio: 'manual',
    placa: 'PQR6S78',
    chassi: '9BGJC7520KB123456',
    renavam: '56789012345',
    preco: '76900.00',
  },
  {
    marca: 'Jeep',
    modelo: 'Compass',
    versao: '1.3 T270 Longitude',
    ano: 2024,
    cor: 'Branco',
    quilometragem: 9500,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'STU7V89',
    chassi: '9C2KC1670JR123456',
    renavam: '67890123456',
    preco: '159900.00',
  },
  {
    marca: 'Renault',
    modelo: 'Kwid',
    versao: '1.0 Zen',
    ano: 2022,
    cor: 'Laranja',
    quilometragem: 39000,
    combustivel: 'flex',
    cambio: 'manual',
    placa: 'VWX8Y90',
    chassi: '93HFC2650MZ123456',
    renavam: '78901234567',
    preco: '52900.00',
  },
  {
    marca: 'Volkswagen',
    modelo: 'T-Cross',
    versao: '1.0 TSI Comfortline',
    ano: 2025,
    cor: 'Prata',
    quilometragem: 5000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'YZA9B01',
    chassi: '9BWZZZ377VT004277',
    renavam: '89012345678',
    preco: '139900.00',
  },
  {
    marca: 'Chevrolet',
    modelo: 'Tracker',
    versao: '1.2 Turbo Premier',
    ano: 2023,
    cor: 'Preto',
    quilometragem: 27000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'BCD0E12',
    chassi: '9BGKS48U0JG123472',
    renavam: '90123456789',
    preco: '125900.00',
  },
];

async function executar() {
    await dataSource.initialize();
    const repository = dataSource.getRepository(Veiculo);

    for (const item of dados) {
        const existente = await repository.findOneBy({ chassi: item.chassi });

        if (!existente) {
            await repository.save(
                repository.create({
                    ...item,
                    status: StatusVeiculo.DISPONIVEL
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