import { MigrationInterface, QueryRunner } from "typeorm";

export class Inicial1794601206065 implements MigrationInterface {
    name = 'Inicial1794601206065'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "usuarios" ("id_usuario" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, "cpf" character varying(14) NOT NULL, "senha" character varying(255) NOT NULL, "perfil" character varying(20) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "data_criacao" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ebebcaef8457dcff6e6d69f17b0" UNIQUE ("cpf"), CONSTRAINT "PK_dfe59db369749f9042499fd8107" PRIMARY KEY ("id_usuario"))`);
        await queryRunner.query(`CREATE TABLE "clientes" ("id_cliente" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, "cpf" character varying(14) NOT NULL, "email" character varying(150) NOT NULL, "telefone" character varying(20) NOT NULL, "endereco" character varying(200) NOT NULL, "cidade" character varying(100) NOT NULL, "estado" character varying(2) NOT NULL, "cep" character varying(10) NOT NULL, "documento" character varying(50) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "data_criacao" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fd1214820b9f05720b26a917630" UNIQUE ("cpf"), CONSTRAINT "UQ_3cd5652ab34ca1a0a2c7a255313" UNIQUE ("email"), CONSTRAINT "PK_4b7c4b981b60b5c6b1d04c84a54" PRIMARY KEY ("id_cliente"))`);
        await queryRunner.query(`CREATE TABLE "veiculos" ("id_veiculo" SERIAL NOT NULL, "marca" character varying(100) NOT NULL, "modelo" character varying(100) NOT NULL, "versao" character varying(100) NOT NULL, "ano" smallint NOT NULL, "cor" character varying(50) NOT NULL, "quilometragem" integer NOT NULL, "combustivel" character varying(20) NOT NULL, "cambio" character varying(20) NOT NULL, "placa" character varying(7) NOT NULL, "chassi" character varying(17) NOT NULL, "renavam" character varying(11) NOT NULL, "preco" numeric(12,2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'disponivel', "data_criacao" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3c7f2de70c4765a04c070a9f745" UNIQUE ("placa"), CONSTRAINT "UQ_1bb7d6eeb5fcf2520b7e2232ab5" UNIQUE ("chassi"), CONSTRAINT "UQ_5d413f906ffd77aeb3356b8a031" UNIQUE ("renavam"), CONSTRAINT "PK_7a7286362fc4e719d8d78ecd0f2" PRIMARY KEY ("id_veiculo"))`);
        await queryRunner.query(`CREATE TABLE "venda" ("id_venda" SERIAL NOT NULL, "valor_veiculo" numeric(12,2) NOT NULL, "percentual_desconto" numeric(5,2), "valor_desconto" numeric(12,2), "valor_final" numeric(12,2) NOT NULL, "forma_pagamento" character varying(50), "percentual_comissao" numeric(5,2), "valor_comissao" numeric(12,2), "status" character varying(30) NOT NULL, "data_venda" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_cliente" integer NOT NULL, "id_veiculo" integer NOT NULL, "id_usuario" integer NOT NULL, CONSTRAINT "PK_0b5cb96cfbe10a76e19661e2175" PRIMARY KEY ("id_venda"))`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_a8a0ff255844d5da75276d5c729" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_9a3a68526940c59f62acada98ad" FOREIGN KEY ("id_veiculo") REFERENCES "veiculos"("id_veiculo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_98b67ea42e90910b42d027fb376" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_98b67ea42e90910b42d027fb376"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_9a3a68526940c59f62acada98ad"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_a8a0ff255844d5da75276d5c729"`);
        await queryRunner.query(`DROP TABLE "venda"`);
        await queryRunner.query(`DROP TABLE "veiculos"`);
        await queryRunner.query(`DROP TABLE "clientes"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
    }

}
