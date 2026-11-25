import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.entity';
import { InativarUsuarioDto } from './dto/inativar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { Auditoria } from '../auditoria/auditoria.entity';

export type UsuarioAutenticado = Omit<Usuario, 'senha'>;

@Injectable()
export class UsuariosService {
    constructor(@InjectRepository(Usuario) private readonly repository: Repository<Usuario>,
        private readonly dataSource: DataSource) { }

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

    async cadastrar(dto: CriarUsuarioDto, atorId: number) {
        return this.dataSource.transaction(async (manager) => {

            const usuarioExistente = await manager.findOneBy(Usuario, {
                cpf: dto.cpf,
            });

            if (usuarioExistente) {
                throw new ConflictException('Já existe um usuário cadastrado com este CPF');
            }

            const senha = await bcrypt.hash(dto.senha, 10);

            const usuario = manager.create(Usuario, {
                nome: dto.nome,
                cpf: dto.cpf,
                senha: senha,
                perfil: dto.perfil,
                ativo: true,
            });

            const usuarioSalvo = await manager.save(Usuario, usuario);

            await manager.insert(Auditoria, {
                ator: { id_usuario: atorId },
                acao: 'USUARIO_CADASTRADO',
                recursoTipo: 'usuario',
                recursoId: usuarioSalvo.id_usuario,
                detalhes: {
                    nome: usuarioSalvo.nome,
                    perfil: usuarioSalvo.perfil,
                },
            });

            const { senha: _senha, ...resposta } = usuarioSalvo;

            return resposta;
        });
    }

    async atualizar(id_usuario: number, dto: AtualizarUsuarioDto) {
        if (dto.nome === undefined && dto.senha === undefined) {
            throw new BadRequestException(
                'Informe pelo menos um campo para atualizar',
            );
        }

        const usuario = await this.repository.findOneBy({ id_usuario });

        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (!usuario.ativo) {
            throw new ConflictException('Não é possível editar um usuário inativo');
        }

        if (dto.nome !== undefined) {
            usuario.nome = dto.nome;
        }

        if (dto.senha !== undefined) {
            usuario.senha = await bcrypt.hash(dto.senha, 10);
        }

        const atualizado = await this.repository.save(usuario);

        const { senha: _senha, ...resposta } = atualizado;
        return resposta;
    }

    async inativar(dto: InativarUsuarioDto, id_usuario: number, atorId: number) {
        return this.dataSource.transaction(async (manager) => {
            const usuario = await manager.findOneBy(Usuario, {
                id_usuario: id_usuario,
                cpf: dto.cpf
            });

            if (!usuario) {
                throw new NotFoundException('Usuario não encontrado');
            }

            if (!usuario.ativo) {
                throw new ConflictException('Usuario já está inativo');
            }

            const resultado = await manager
                .createQueryBuilder()
                .update(Usuario)
                .set({ ativo: false })
                .where('id_usuario = :id', {
                    id: usuario.id_usuario,
                })
                .andWhere('cpf = :cpf', {
                    cpf: dto.cpf
                })
                .andWhere('ativo = :ativo', {
                    ativo: true,
                })
                .execute();

            if (resultado.affected !== 1) {
                throw new ConflictException('O usuário não está mais ativo');
            }

            await manager.insert(Auditoria, {
                ator: { id_usuario: atorId },
                acao: 'USUARIO_INATIVADO',
                recursoTipo: 'usuario',
                recursoId: id_usuario,
                detalhes: {
                    statusAnterior: true,
                    statusAtual: false,
                },
            });

            const usuarioAtualizado = await manager.findOneByOrFail(Usuario, { id_usuario });

            const { senha: _senha, ...resposta } = usuarioAtualizado;

            return resposta;
        });
    }

}
