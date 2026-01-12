# 🏗️ Estrutura do Projeto - Post Generator

## 📁 Visão Geral da Estrutura

```
PostGenerator/
├── 📄 package.json              # Dependências e scripts
├── 📄 .env.example              # Exemplo de variáveis de ambiente
├── 📄 .env                      # Suas configurações (NÃO COMMITAR!)
├── 📄 .gitignore                # Arquivos ignorados pelo Git
├── 📄 README.md                 # Documentação principal
├── 📄 GUIA_INSTALACAO.md        # Guia passo a passo
├── 📄 EXEMPLOS_USO.md           # Exemplos práticos
├── 📄 vite.config.js            # Configuração do Vite
├── 📄 tailwind.config.js        # Configuração do TailwindCSS
├── 📄 postcss.config.js         # Configuração do PostCSS
├── 📄 jsconfig.json             # Configuração do JavaScript
├── 📄 index.html                # HTML principal
│
├── 📂 server/                   # Backend (Node.js + Express)
│   ├── 📄 index.js              # Servidor principal
│   │
│   ├── 📂 routes/               # Rotas da API
│   │   ├── 📄 facebook.js       # Endpoints do Facebook
│   │   ├── 📄 ai.js             # Endpoints de IA
│   │   ├── 📄 image.js          # Endpoints de imagens
│   │   └── 📄 post.js           # Endpoints de posts
│   │
│   └── 📂 services/             # Lógica de negócio
│       ├── 📄 facebook.js       # Integração Facebook API
│       ├── 📄 openai.js         # Integração OpenAI API
│       ├── 📄 image.js          # Processamento de imagens
│       └── 📄 queue.js          # Sistema de filas
│
├── 📂 src/                      # Frontend (React)
│   ├── 📄 main.jsx              # Entry point do React
│   ├── 📄 App.jsx               # Componente principal
│   ├── 📄 index.css             # Estilos globais
│   │
│   └── 📂 components/           # Componentes React
│       ├── 📄 FeedLoader.jsx    # Carregador de posts
│       ├── 📄 PostEditor.jsx    # Editor de textos
│       ├── 📄 ImageEditor.jsx   # Editor de imagens
│       └── 📄 ScheduledPosts.jsx # Posts agendados
│
├── 📂 uploads/                  # Imagens processadas (criado automaticamente)
└── 📂 temp/                     # Arquivos temporários (criado automaticamente)
```

---

## 🔧 Backend (Server)

### `server/index.js`
**Responsabilidade:** Servidor Express principal
- Configura middleware (CORS, JSON parsing)
- Registra rotas
- Inicializa sistema de filas
- Error handling

### `server/routes/`
**Responsabilidade:** Definir endpoints da API

#### `facebook.js`
```
GET  /api/facebook/posts/:pageId    # Buscar posts de uma página
GET  /api/facebook/posts            # Buscar posts de múltiplas páginas
GET  /api/facebook/page/:pageId     # Info de uma página
POST /api/facebook/publish          # Publicar post
```

#### `ai.js`
```
POST /api/ai/rewrite      # Reescrever texto
POST /api/ai/variations   # Gerar variações
POST /api/ai/hashtags     # Gerar hashtags
POST /api/ai/analyze      # Analisar texto
```

#### `image.js`
```
POST /api/image/upload       # Upload de imagem
POST /api/image/add-logo     # Adicionar logo
POST /api/image/remove-area  # Remover área
POST /api/image/resize       # Redimensionar
POST /api/image/optimize     # Otimizar
POST /api/image/filter       # Aplicar filtro
```

#### `post.js`
```
POST   /api/posts/schedule        # Agendar post
DELETE /api/posts/schedule/:id    # Cancelar post
GET    /api/posts/scheduled       # Listar agendados
```

### `server/services/`
**Responsabilidade:** Lógica de negócio e integrações

#### `facebook.js`
- `getPagePosts()` - Busca posts de uma página
- `getMultiplePagesPosts()` - Busca de múltiplas páginas
- `publishTextPost()` - Publica texto
- `publishPhotoPost()` - Publica com foto
- `getPageInfo()` - Info da página
- `downloadImage()` - Baixa imagem

#### `openai.js`
- `rewriteText()` - Reescreve texto com IA
- `generateVariations()` - Gera variações
- `generateHashtags()` - Gera hashtags
- `analyzeAndSuggest()` - Analisa e sugere melhorias

#### `image.js`
- `addLogo()` - Adiciona logo à imagem
- `removeArea()` - Remove área selecionada
- `resize()` - Redimensiona imagem
- `optimize()` - Otimiza para web
- `applyFilter()` - Aplica filtros
- `cleanupOldFiles()` - Limpa arquivos antigos

#### `queue.js`
- `setupQueues()` - Configura sistema de filas
- `schedulePost()` - Agenda publicação
- `cancelScheduledPost()` - Cancela agendamento
- `getScheduledPosts()` - Lista agendados

---

## 🎨 Frontend (React)

### `src/App.jsx`
**Responsabilidade:** Layout principal e navegação
- Header com logo
- Tabs de navegação
- Renderiza componentes baseado na tab ativa
- Footer

### `src/components/`

#### `FeedLoader.jsx`
**Funcionalidades:**
- ✅ Carrega posts de páginas do Facebook
- ✅ Exibe grid de posts com imagens
- ✅ Botão para atualizar feed
- ✅ Seleção de post para editar
- ✅ Link para post original

#### `PostEditor.jsx`
**Funcionalidades:**
- ✅ Editor de texto original e editado
- ✅ Seleção de tom de voz
- ✅ Reescrita com IA
- ✅ Geração de variações
- ✅ Geração de hashtags
- ✅ Análise de texto
- ✅ Publicação imediata
- ✅ Agendamento de posts

#### `ImageEditor.jsx`
**Funcionalidades:**
- ✅ Upload de imagem e logo
- ✅ Adição de logo com posicionamento
- ✅ Seleção de área para remoção
- ✅ Remoção de objetos/logos
- ✅ Aplicação de filtros
- ✅ Otimização para web
- ✅ Download da imagem editada
- ✅ Preview em tempo real

#### `ScheduledPosts.jsx`
**Funcionalidades:**
- ✅ Lista posts agendados
- ✅ Exibe data/hora de publicação
- ✅ Cancelamento de posts
- ✅ Auto-refresh a cada 30s
- ✅ Preview de imagens

---

## 🔄 Fluxo de Dados

### 1. Carregar Posts
```
Usuário → FeedLoader → API /facebook/posts → Facebook Graph API
                                            ↓
                                    Retorna posts
                                            ↓
                                    Exibe no grid
```

### 2. Reescrever Texto
```
Usuário → PostEditor → API /ai/rewrite → OpenAI GPT-4
                                        ↓
                                Texto reescrito
                                        ↓
                                Exibe no editor
```

### 3. Editar Imagem
```
Usuário → ImageEditor → Upload → API /image/add-logo → Sharp (processamento)
                                                      ↓
                                              Imagem processada
                                                      ↓
                                              Salva em /uploads
                                                      ↓
                                              Retorna URL
```

### 4. Agendar Post
```
Usuário → PostEditor → API /posts/schedule → Bull Queue + Redis
                                            ↓
                                    Job agendado
                                            ↓
                            Aguarda horário agendado
                                            ↓
                            Publica automaticamente
```

---

## 🗄️ Armazenamento

### Arquivos
```
uploads/          # Imagens processadas (permanente)
temp/             # Arquivos temporários (limpo automaticamente)
```

### Redis
```
Queue: post-publishing
├── Jobs agendados (delayed)
├── Jobs em processamento (active)
├── Jobs completados (completed)
└── Jobs falhados (failed)
```

---

## 🔐 Segurança

### Variáveis de Ambiente (.env)
```env
# Nunca commitar!
FACEBOOK_ACCESS_TOKEN=...
OPENAI_API_KEY=...
```

### Validações
- ✅ Validação de tipos de arquivo (apenas imagens)
- ✅ Limite de tamanho (10MB)
- ✅ Sanitização de inputs
- ✅ Error handling em todas as rotas

---

## 📊 Tecnologias Utilizadas

### Backend
- **Express** - Framework web
- **Axios** - HTTP client
- **Sharp** - Processamento de imagens
- **Bull** - Sistema de filas
- **Redis** - Armazenamento de filas
- **Multer** - Upload de arquivos
- **OpenAI** - API de IA
- **node-cron** - Agendamento

### Frontend
- **React** - Framework UI
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

---

## 🚀 Scripts Disponíveis

```bash
npm run dev        # Inicia backend + frontend
npm run server     # Apenas backend (porta 3000)
npm run client     # Apenas frontend (porta 5173)
npm run build      # Build para produção
npm run preview    # Preview do build
```

---

## 📈 Próximas Melhorias

### Curto Prazo
- [ ] Suporte a múltiplas páginas do Facebook
- [ ] Histórico de posts publicados
- [ ] Estatísticas de engajamento
- [ ] Templates de posts

### Médio Prazo
- [ ] Integração com Instagram
- [ ] Editor de vídeos
- [ ] Análise de sentimento avançada
- [ ] Dashboard de analytics

### Longo Prazo
- [ ] App mobile
- [ ] Integração com outras redes sociais
- [ ] IA para sugestão de horários
- [ ] Sistema de aprovação de posts

---

## 🐛 Debug

### Logs do Backend
```bash
# Terminal onde rodou npm run server
```

### Logs do Frontend
```bash
# Console do navegador (F12)
```

### Logs do Redis
```bash
# Docker
docker logs redis

# WSL
sudo tail -f /var/log/redis/redis-server.log
```

---

## 📞 Arquivos de Ajuda

1. **README.md** - Visão geral e features
2. **GUIA_INSTALACAO.md** - Como instalar
3. **EXEMPLOS_USO.md** - Como usar
4. **ESTRUTURA_PROJETO.md** - Este arquivo

---

Agora você entende toda a estrutura do projeto! 🎉
