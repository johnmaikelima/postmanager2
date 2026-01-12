# 📖 Guia de Instalação - Post Generator

Este guia vai te ajudar a configurar o sistema passo a passo.

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

1. **Node.js** (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Verifique: `node --version`

2. **Redis** (para sistema de filas)
   - **Opção 1 - Docker (Recomendado):**
     ```bash
     docker run -d -p 6379:6379 --name redis redis
     ```
   
   - **Opção 2 - WSL (Windows):**
     ```bash
     wsl --install
     # Depois no WSL:
     sudo apt-get update
     sudo apt-get install redis-server
     sudo service redis-server start
     ```

## 🔧 Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

## 🔑 Passo 2: Configurar API do Facebook

### 2.1 Criar App no Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Clique em "Meus Apps" → "Criar App"
3. Escolha "Empresa" como tipo
4. Preencha os dados do app

### 2.2 Configurar Permissões

1. No painel do app, vá em "Adicionar Produto"
2. Adicione "Facebook Login"
3. Vá em "Ferramentas" → "Explorador de API do Graph"
4. Gere um token com as permissões:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_read_user_content`

### 2.3 Obter Page Access Token

1. No Explorador de API, selecione sua página
2. Clique em "Gerar Token de Acesso"
3. Copie o token gerado

### 2.4 Obter Page ID

Execute no Explorador de API:
```
GET /me/accounts
```

Copie o `id` da sua página.

## 🤖 Passo 3: Configurar API da OpenAI

1. Acesse: https://platform.openai.com/
2. Crie uma conta ou faça login
3. Vá em "API Keys"
4. Clique em "Create new secret key"
5. Copie a chave (você só verá uma vez!)

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
   ```bash
   copy .env.example .env
   ```

2. Abra o arquivo `.env` e preencha:

```env
# Facebook API
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
FACEBOOK_ACCESS_TOKEN=seu_page_access_token_aqui
FACEBOOK_PAGE_ID=seu_page_id_aqui

# OpenAI API
OPENAI_API_KEY=sk-sua_chave_openai_aqui

# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# URLs das páginas para monitorar (IDs separados por vírgula)
SOURCE_PAGE_IDS=123456789,987654321
```

### Como obter SOURCE_PAGE_IDS:

Para monitorar posts de outras páginas públicas:

1. Acesse a página no Facebook
2. Veja o ID na URL ou use o Explorador de API:
   ```
   GET /search?q=nome_da_pagina&type=page
   ```

## 🚀 Passo 5: Executar o Sistema

### Opção 1: Executar tudo junto (Recomendado)

```bash
npm run dev
```

Isso inicia:
- Backend na porta 3000
- Frontend na porta 5173

### Opção 2: Executar separadamente

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

## 🌐 Passo 6: Acessar o Sistema

Abra seu navegador e acesse:
```
http://localhost:5173
```

## ✅ Verificar se está funcionando

1. **Teste o Backend:**
   ```
   http://localhost:3000/health
   ```
   Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Teste o Frontend:**
   - Acesse http://localhost:5173
   - Você deve ver a interface do Post Generator

3. **Teste carregar posts:**
   - Clique na aba "Carregar Posts"
   - Clique em "Atualizar"
   - Deve aparecer posts das páginas configuradas

## 🐛 Solução de Problemas

### Erro: "Redis connection failed"

**Solução:** Certifique-se de que o Redis está rodando:
```bash
# Docker
docker ps

# WSL
sudo service redis-server status
```

### Erro: "Invalid OAuth access token"

**Solução:** 
- Verifique se o token do Facebook está correto
- Tokens expiram! Gere um novo token de longa duração
- Verifique as permissões do token

### Erro: "OpenAI API key invalid"

**Solução:**
- Verifique se copiou a chave completa (começa com `sk-`)
- Verifique se tem créditos na conta OpenAI
- Gere uma nova chave se necessário

### Erro ao instalar dependências

**Solução:**
```bash
# Limpar cache
npm cache clean --force

# Deletar node_modules e reinstalar
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Porta já em uso

**Solução:**
```bash
# Mudar porta no .env
PORT=3001
```

## 📱 Próximos Passos

1. **Carregar Posts:**
   - Vá na aba "Carregar Posts"
   - Clique em "Atualizar" para buscar posts

2. **Editar Texto:**
   - Selecione um post
   - Use IA para reescrever
   - Gere hashtags

3. **Editar Imagem:**
   - Carregue uma imagem
   - Adicione seu logo
   - Remova elementos indesejados

4. **Publicar:**
   - Publique imediatamente ou
   - Agende para publicação futura

## 🔒 Segurança

⚠️ **IMPORTANTE:**

- **NUNCA** compartilhe seu arquivo `.env`
- **NUNCA** commite o `.env` no Git
- Use tokens com permissões mínimas necessárias
- Rotacione suas chaves regularmente
- Monitore uso da API da OpenAI (pode gerar custos)

## 💰 Custos

- **Facebook API:** Gratuita
- **OpenAI API:** Paga por uso
  - GPT-4: ~$0.03 por 1K tokens
  - Recomendo começar com créditos de teste
  - Configure limites de gasto na OpenAI

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs no terminal
2. Verifique o console do navegador (F12)
3. Leia a documentação:
   - Facebook: https://developers.facebook.com/docs/graph-api
   - OpenAI: https://platform.openai.com/docs

## 🎉 Pronto!

Seu sistema está configurado e pronto para uso!

Aproveite para automatizar suas publicações no Facebook! 🚀
