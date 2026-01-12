# Dockerfile para Post Generator - Coolify Ready

# Build stage para o frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Otimizações de build
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Instalar dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código do servidor
COPY server ./server

# Copiar build do frontend
COPY --from=frontend-build /app/dist ./dist

# Criar diretórios necessários
RUN mkdir -p uploads logos temp server/data

# Expor porta
EXPOSE 3000

# Variáveis de ambiente (serão sobrescritas pelo Coolify)
ENV NODE_ENV=production
ENV PORT=3000

# Iniciar servidor
CMD ["node", "server/index.js"]
