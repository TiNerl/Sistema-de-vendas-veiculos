import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';

@Injectable()
export class ClientesService {
    constructor(@InjectRepository(Cliente) private readonly repository: Repository<Cliente>) { }

    async cadastrar(dto: CriarClienteDto) {
        const clienteExistente = await this.repository.findOne({
            where: [
                { cpf: dto.cpf },
                { email: dto.email }
            ]
        });

        if (clienteExistente) {
            if (clienteExistente.cpf === dto.cpf) {
                throw new ConflictException('Já existe um cliente cadastrado com este CPF');
            }
            if (clienteExistente.email === dto.email) {
                throw new ConflictException('Já existe um cliente cadastrado com este e-mail');
            }
        }

        const novoCliente = this.repository.create({
            nome: dto.nome,
            cpf: dto.cpf,
            email: dto.email,
            telefone: dto.telefone,
            cep: dto.cep,
            endereco: dto.endereco,
            cidade: dto.cidade,
            estado: dto.estado,
            documento: dto.documento,
            ativo: true
        });

        return await this.repository.save(novoCliente);
    }

    async inativar(id: number) {
        const cliente = await this.repository.findOneBy({ id_cliente: id });

        if (!cliente) {
            throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
        }

        cliente.ativo = false;
        return await this.repository.save(cliente);
    }

    async findAll(busca?: string): Promise<Cliente[]> {
        if (!busca || busca.trim() === '') {
            return this.repository.find({ order: { nome: 'ASC' } });
        }

        const termo = `%${busca}%`;

        return this.repository.find({
            where: [
                { nome: Like(termo) },
                { cpf: Like(termo) },
                { email: Like(termo) },
            ],
            order: { nome: 'ASC' },
        });
    }

    async atualizar(id: number, dto: AtualizarClienteDto) {
        const cliente = await this.repository.findOneBy({ id_cliente: id });

        if (!cliente) {
            throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
        }

        Object.assign(cliente, dto);
        return await this.repository.save(cliente);
    }
}