import { MigrationInterface, QueryRunner } from "typeorm";

export class AdicionarAuditoria1795553838223 implements MigrationInterface {
    name = 'AdicionarAuditoria1795553838223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_venda_usuario_registro"`);
        await queryRunner.query(`CREATE TABLE "auditorias" ("id" SERIAL NOT NULL, "acao" character varying(50) NOT NULL, "recurso_tipo" character varying(50) NOT NULL, "recurso_id" integer NOT NULL, "detalhes" jsonb, "criada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ator_id" integer NOT NULL, CONSTRAINT "PK_b84b3505f313ab1a44e7b684ee2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_ec6db17acbfbe8dbd8ae56f13c8" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auditorias" ADD CONSTRAINT "FK_d640033ff240a59a2d403c9d77b" FOREIGN KEY ("ator_id") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auditorias" DROP CONSTRAINT "FK_d640033ff240a59a2d403c9d77b"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_ec6db17acbfbe8dbd8ae56f13c8"`);
        await queryRunner.query(`DROP TABLE "auditorias"`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_venda_usuario_registro" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
