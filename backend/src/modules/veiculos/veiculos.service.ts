import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { Veiculo } from './veiculo.entity';
import { StatusVeiculo } from './veiculo-status.enum';
import { AtualizarVeiculoDto } from './dto/atualizar-veiculo.dto';

@Injectable()
export class VeiculosService {
    constructor(
        @InjectRepository(Veiculo)
        private readonly repository: Repository<Veiculo>,
    ) { }

    async cadastrar(dto: CriarVeiculoDto) {
        const existente = await this.repository.findOne({
            where: [
                { placa: dto.placa },
                { chassi: dto.chassi },
                { renavam: dto.renavam },
            ],
        });

        if (existente) {
            throw new ConflictException('Placa, chassi ou RENAVAM já cadastrado');
        }

        const veiculo = this.repository.create({
            ...dto,
            preco: dto.preco.toFixed(2),
            status: StatusVeiculo.DISPONIVEL,
        });

        return this.repository.save(veiculo);
    }

    listar() {
        return this.repository.find({ order: { id_veiculo: 'DESC' } });
    }

    async buscarPorId(id: number) {
        const veiculo = await this.repository.findOne({ where: { id_veiculo: id } });

        if (!veiculo) {
            throw new NotFoundException('Veículo não encontrado');
        }

        return veiculo;
    }

    async atualizar(id: number, dto: AtualizarVeiculoDto) {
        const veiculo = await this.repository.findOneBy({
            id_veiculo: id,
        });

        if (!veiculo) {
            throw new NotFoundException(
                `Veículo com ID ${id} não encontrado`,
            );
        }

        const condicoes = [
            ...(dto.placa !== undefined ? [{ placa: dto.placa }] : []),
            ...(dto.chassi !== undefined ? [{ chassi: dto.chassi }] : []),
            ...(dto.renavam !== undefined ? [{ renavam: dto.renavam }] : []),
        ].map(condicao => ({ ...condicao, id_veiculo: Not(id) }));

        if (condicoes.length > 0) {
            const existente = await this.repository.findOne({
                where: condicoes,
            });

            if (existente) {
                throw new ConflictException('Placa, chassi ou RENAVAM já cadastrado');
            }
        }

        Object.assign(veiculo, {
            ...dto,
            ...(dto.preco !== undefined && {
                preco: dto.preco.toFixed(2),
            }),
        });

        return this.repository.save(veiculo);
    }

    async atualizarStatus(id: number, status: StatusVeiculo) {
        const veiculo = await this.buscarPorId(id);
        veiculo.status = status;
        return this.repository.save(veiculo);
    }
}
