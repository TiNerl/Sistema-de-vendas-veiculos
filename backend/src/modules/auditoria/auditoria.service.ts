import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './auditoria.entity';

@Injectable()
export class AuditoriaService {
    constructor(
        @InjectRepository(Auditoria)
        private readonly repository: Repository<Auditoria>,
    ) { }

    async buscarTodas() {
        const query = await this.repository
            .createQueryBuilder('auditoria')
            .leftJoin('auditoria.ator', 'ator')
            .addSelect(['ator.id_usuario', 'ator.nome'])
            .orderBy('auditoria.criadaEm', 'DESC')
            .getMany();

        return query;
    }
}
