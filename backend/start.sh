#!/bin/sh
set -e

echo "==> Rodando seeds..."
npm run seed:usuarios
npm run seed:clientes
npm run seed:veiculos

echo "==> Iniciando aplicação..."
exec node dist/main#!/bin/sh
set -e

echo "==> Rodando seeds..."
npm run seed:usuarios
npm run seed:clientes
npm run seed:veiculos

echo "==> Iniciando aplicação..."
exec node dist/main
