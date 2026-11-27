import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';

import { Usuario } from '../usuarios/usuario.entity';


@Entity({ name: 'auditorias' })
export class Auditoria {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Usuario, { nullable: false })
    @JoinColumn({ name: 'ator_id' })
    ator: Usuario;

    @Column({ type: 'varchar', length: 50 })
    acao: string;

    @Column({ name: 'recurso_tipo', type: 'varchar', length: 50 })
    recursoTipo: string;

    @Column({ name: 'recurso_id', type: 'int' })
    recursoId: number;

    @Column({ type: 'jsonb', nullable: true })
    detalhes: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'criada_em', type: 'timestamptz' })
    criadaEm: Date;
}