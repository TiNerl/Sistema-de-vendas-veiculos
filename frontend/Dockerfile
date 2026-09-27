# Baseado na versão 26.10.0 do Node usando a versão alpine que é mais leve
FROM node:26-alpine

# Define o diretorio principal
WORKDIR /app

# Copia os arquivos de configuração que comecem com "package" onde estão as dependências do projeto para dentro da pasta do container
COPY package*.json ./

# Roda a instalação das dependências necessárias
RUN npm install

# Copia o resto do código para dentro do container
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# O Vite exige que a flag --host esteja presente para poder expor o servidor para fora do container, deixando de rodar em localhost, rodando em todas interfaces 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
