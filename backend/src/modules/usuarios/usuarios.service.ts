import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.entity';
import { InativarUsuarioDto } from './dto/inativar-usuario.dto';

export type UsuarioAutenticado = Omit<Usuario, 'senha'>;

@Injectable()
export class UsuariosService {
    constructor(@InjectRepository(Usuario) private readonly repository: Repository<Usuario>,) { }

    async listar() {
        const usuarios = await this.repository.find({ order: { id_usuario: 'ASC' } });
        return usuarios.map(({ senha: _senha, ...usuario }) => usuario);
    }

    async buscarPorId(id_usuario: number) {
        const usuario = await this.repository.findOneBy({ id_usuario });
        if (!usuario) {
            throw new NotFoundException('Usuario não encontrado');
        }
        const { senha: _senha, ...resposta } = usuario;
        return resposta;
    }

    buscarParaLogin(cpf: string) {
        return this.repository.findOne({
            where: { cpf },
            select: {
                id_usuario: true,
                nome: true,
                cpf: true,
                senha: true,
                perfil: true,
                ativo: true,
            },
        });
    }

    async cadastrar(dto: CriarUsuarioDto) {
        const senha = await bcrypt.hash(dto.senha, 10);
        const usuario = this.repository.create({
            nome: dto.nome,
            cpf: dto.cpf,
            senha: senha,
            perfil: dto.perfil,
            ativo: true,

        });

        const salvo = await this.repository.save(usuario);
        const { senha: _senha, ...resposta } = salvo;
        return resposta;
    }

    async inativar(dto: InativarUsuarioDto, id_usuario: number) {
        const usuario = await this.repository.findOneBy({ cpf: dto.cpf, id_usuario } );
        if (!usuario) {
            throw new NotFoundException('Usuario não encontrado');
        }

        if (!usuario.ativo) {
            throw new ConflictException('Usuario já está inativo');
        }

        usuario.ativo = false;
        await this.repository.save(usuario);
        const { senha: _senha, ...resposta } = usuario;
        return resposta;
    }

}
