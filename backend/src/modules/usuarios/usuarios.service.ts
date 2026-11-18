import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.entity';
import { InativarUsuarioDto } from './dto/inativar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';

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
        const existente = await this.repository.findOne({
            where: [
                { cpf: dto.cpf },
                { email: dto.email },
            ],
        });

        if (existente) {
            if (existente.cpf === dto.cpf) {
                throw new ConflictException('Já existe um usuário cadastrado com este CPF');
            }
            throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
        }

        const senha = await bcrypt.hash(dto.senha, 10);
        const usuario = this.repository.create({
            nome: dto.nome,
            cpf: dto.cpf,
            email: dto.email,
            senha: senha,
            perfil: dto.perfil,
            ativo: true,

        });

        const salvo = await this.repository.save(usuario);
        const { senha: _senha, ...resposta } = salvo;
        return resposta;
    }

    async atualizar(id_usuario: number, dto: AtualizarUsuarioDto) {
        const usuario = await this.repository.findOneBy({ id_usuario });
        if (!usuario) {
            throw new NotFoundException('Usuario não encontrado');
        }
        if (!usuario.ativo) {
            throw new ConflictException('Usuarios inativos não podem ser editados');
        }

        const condicoes = [
            ...(dto.cpf !== undefined ? [{ cpf: dto.cpf }] : []),
            ...(dto.email !== undefined ? [{ email: dto.email }] : []),
        ].map(condicao => ({ ...condicao, id_usuario: Not(id_usuario) }));

        if (condicoes.length > 0) {
            const existente = await this.repository.findOne({ where: condicoes });
            if (existente) {
                if (dto.cpf !== undefined && existente.cpf === dto.cpf) {
                    throw new ConflictException('Já existe um usuário cadastrado com este CPF');
                }
                throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
            }
        }

        Object.assign(usuario, dto);
        await this.repository.save(usuario);
        const { senha: _senha, ...resposta } = usuario;
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
