# usando a versão do Node 26.10.0 (baseada no Alpine Linux, que é super leve)
FROM node:26-alpine

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro para otimizar o cache do Docker
COPY package*.json ./

# Instalação das dependências dentro do container
RUN npm install

# Copia o resto do código
COPY . .

RUN npm run build

# Expõe a porta padrão do NestJS
EXPOSE 3000

# Comando para iniciar em modo desenvolvimento (Hot-Reload)
CMD ["npm", "run", "start:prod"]
