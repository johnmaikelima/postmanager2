# Post Generator - Sistema de Repostagem Automatizada

Sistema completo para gerenciar e repostar publicações no Facebook com IA.

## 🚀 Funcionalidades

- ✅ Carregar feeds de páginas do Facebook
- ✅ Reescrever textos com ChatGPT para evitar plágio
- ✅ Editor de imagens com remoção de objetos/logos por IA
- ✅ Adicionar logo personalizado às imagens
- ✅ Agendar publicações
- ✅ Interface moderna e intuitiva

## 📋 Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **Redis** (para sistema de filas)
3. **Conta Facebook Developer** com app criado
4. **API Key da OpenAI**

## 🔧 Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

### 3. Configurar Facebook App

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app
3. Adicione o produto "Facebook Login"
4. Gere um Page Access Token com permissões:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_read_user_content`

### 4. Instalar Redis

**Windows:**
```bash
# Usar WSL ou Docker
docker run -d -p 6379:6379 redis
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Mac
brew install redis
```

## 🚀 Executar

```bash
# Modo desenvolvimento (backend + frontend)
npm run dev

# Apenas backend
npm run server

# Apenas frontend
npm run client
```

Acesse: http://localhost:5173

## 📖 Como usar

1. **Carregar Posts**: Busque posts de páginas que você segue
2. **Editar Texto**: Use IA para reescrever o conteúdo
3. **Editar Imagem**: Remova logos indesejados e adicione o seu
4. **Agendar/Publicar**: Escolha quando postar

## 🛠️ Tecnologias

- **Backend**: Node.js, Express
- **Frontend**: React, TailwindCSS, shadcn/ui
- **IA**: OpenAI GPT-4, DALL-E (inpainting)
- **APIs**: Facebook Graph API
- **Filas**: Bull + Redis

## 📝 Notas Importantes

- Respeite os direitos autorais ao repostar conteúdo
- Verifique os termos de uso do Facebook
- Mantenha suas chaves de API seguras
- Use tokens de acesso com permissões mínimas necessárias

## 🔒 Segurança

- Nunca commite o arquivo `.env`
- Rotacione suas chaves regularmente
- Use tokens de curta duração quando possível
