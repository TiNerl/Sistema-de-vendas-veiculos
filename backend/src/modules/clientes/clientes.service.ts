import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Injectable()
export class ClientesService {
    constructor(@InjectRepository(Cliente) private readonly repository: Repository<Cliente>) { }

    async cadastrar(dto: CriarClienteDto) {
        const cliente = await this.repository.findOneBy({ cpf: dto.cpf });
        if (cliente) {
            throw new ConflictException('O cliente informado já está cadastrado');
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
        return this.repository.save(novoCliente);
    }

    async inativar(id: number) {
        const cliente = await this.repository.findOneBy({ id_cliente: id });

        if (!cliente) {
            throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
        }

        cliente.ativo = false;
        return await this.repository.save(cliente);
    }
}