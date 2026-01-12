# 🛠️ Comandos Úteis - Post Generator

Referência rápida de comandos para gerenciar o sistema.

---

## 🚀 Inicialização

### Instalar dependências
```bash
npm install
```

### Iniciar sistema completo
```bash
npm run dev
```

### Iniciar apenas backend
```bash
npm run server
```

### Iniciar apenas frontend
```bash
npm run client
```

---

## 🐳 Redis (Docker)

### Iniciar Redis
```bash
docker run -d -p 6379:6379 --name redis redis
```

### Parar Redis
```bash
docker stop redis
```

### Reiniciar Redis
```bash
docker restart redis
```

### Ver logs do Redis
```bash
docker logs redis
```

### Remover container Redis
```bash
docker rm -f redis
```

### Verificar se está rodando
```bash
docker ps
```

---

## 🐧 Redis (WSL/Linux)

### Iniciar Redis
```bash
sudo service redis-server start
```

### Parar Redis
```bash
sudo service redis-server stop
```

### Reiniciar Redis
```bash
sudo service redis-server restart
```

### Status do Redis
```bash
sudo service redis-server status
```

### Conectar ao Redis CLI
```bash
redis-cli
```

### Limpar todos os dados do Redis
```bash
redis-cli FLUSHALL
```

---

## 📦 NPM

### Limpar cache
```bash
npm cache clean --force
```

### Reinstalar dependências
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Atualizar dependências
```bash
npm update
```

### Verificar dependências desatualizadas
```bash
npm outdated
```

---

## 🔍 Debug

### Ver logs do servidor em tempo real
```bash
npm run server
# Logs aparecem no terminal
```

### Testar endpoint da API
```bash
# Health check
curl http://localhost:3000/health

# Buscar posts
curl http://localhost:3000/api/facebook/posts

# Testar reescrita (POST)
curl -X POST http://localhost:3000/api/ai/rewrite ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Teste de texto\",\"tone\":\"professional\"}"
```

### Ver posts agendados no Redis
```bash
redis-cli
> KEYS *
> LRANGE bull:post-publishing:delayed 0 -1
```

---

## 🧹 Limpeza

### Limpar uploads antigos
```bash
# Windows
del /q uploads\*

# Linux/Mac
rm -rf uploads/*
```

### Limpar arquivos temporários
```bash
# Windows
del /q temp\*

# Linux/Mac
rm -rf temp/*
```

### Limpar tudo e reinstalar
```bash
# Parar servidor (Ctrl+C)
rmdir /s /q node_modules
rmdir /s /q uploads
rmdir /s /q temp
del package-lock.json
npm install
```

---

## 🔐 Variáveis de Ambiente

### Criar arquivo .env
```bash
copy .env.example .env
```

### Editar .env
```bash
notepad .env
```

### Verificar variáveis carregadas
```javascript
// No código Node.js
console.log(process.env.FACEBOOK_ACCESS_TOKEN);
```

---

## 🌐 Rede

### Verificar portas em uso
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3000
lsof -i :5173
```

### Matar processo em porta específica
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
kill -9 $(lsof -t -i:3000)
```

---

## 📊 Monitoramento

### Ver uso de memória
```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

### Ver espaço em disco
```bash
# Windows
dir uploads

# Linux/Mac
du -sh uploads/
```

---

## 🔄 Git

### Inicializar repositório
```bash
git init
```

### Adicionar arquivos
```bash
git add .
```

### Commit
```bash
git commit -m "Initial commit"
```

### Verificar status
```bash
git status
```

### Ver arquivos ignorados
```bash
type .gitignore
```

---

## 🧪 Testes

### Testar conexão Facebook
```bash
curl "https://graph.facebook.com/v18.0/me?access_token=SEU_TOKEN"
```

### Testar conexão OpenAI
```bash
curl https://api.openai.com/v1/models ^
  -H "Authorization: Bearer SEU_API_KEY"
```

### Testar Redis
```bash
redis-cli ping
# Deve retornar: PONG
```

---

## 📝 Logs

### Salvar logs em arquivo
```bash
npm run server > logs.txt 2>&1
```

### Ver últimas linhas do log
```bash
# Windows
type logs.txt | more

# Linux/Mac
tail -f logs.txt
```

---

## 🔧 Troubleshooting Rápido

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port already in use"
```bash
# Mudar porta no .env
PORT=3001
```

### Erro: "Redis connection failed"
```bash
# Verificar se Redis está rodando
docker ps
# ou
sudo service redis-server status
```

### Erro: "Invalid access token"
```bash
# Gerar novo token no Facebook Developers
# Atualizar no .env
```

### Erro: "OpenAI API key invalid"
```bash
# Verificar chave no .env
# Gerar nova chave em platform.openai.com
```

### Frontend não carrega
```bash
# Limpar cache do navegador
# Ou tentar em aba anônima
# Verificar console (F12)
```

### Imagens não aparecem
```bash
# Verificar permissões da pasta uploads
# Criar pasta manualmente se necessário
mkdir uploads
mkdir temp
```

---

## 🚀 Produção

### Build para produção
```bash
npm run build
```

### Preview do build
```bash
npm run preview
```

### Rodar em produção
```bash
NODE_ENV=production npm run server
```

---

## 📱 Atalhos do Sistema

### No navegador
- `F12` - Abrir DevTools
- `Ctrl + Shift + R` - Recarregar sem cache
- `Ctrl + Shift + I` - Abrir Inspector

### No terminal
- `Ctrl + C` - Parar servidor
- `Ctrl + L` - Limpar terminal
- `↑` / `↓` - Navegar histórico de comandos

---

## 🔍 Comandos de Diagnóstico

### Verificar versão do Node
```bash
node --version
```

### Verificar versão do NPM
```bash
npm --version
```

### Verificar instalação do Redis
```bash
redis-cli --version
```

### Verificar instalação do Docker
```bash
docker --version
```

### Listar processos Node rodando
```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

---

## 💾 Backup

### Backup do .env
```bash
copy .env .env.backup
```

### Backup de uploads
```bash
# Windows
xcopy uploads uploads_backup /E /I

# Linux/Mac
cp -r uploads uploads_backup
```

### Backup completo
```bash
# Criar arquivo zip com tudo
# Exceto node_modules, uploads, temp
```

---

## 🎯 Comandos Mais Usados

```bash
# 1. Iniciar sistema
npm run dev

# 2. Parar sistema
Ctrl + C

# 3. Reinstalar dependências
npm install

# 4. Verificar Redis
docker ps

# 5. Ver logs
# (já aparecem no terminal)

# 6. Limpar cache
npm cache clean --force

# 7. Atualizar código
git pull

# 8. Testar API
curl http://localhost:3000/health
```

---

## 📞 Precisa de Ajuda?

1. Verifique os logs no terminal
2. Verifique o console do navegador (F12)
3. Consulte `GUIA_INSTALACAO.md`
4. Consulte `README.md`
5. Verifique se todas as variáveis do `.env` estão corretas

---

## 🎓 Dica Final

Crie um arquivo `start.bat` (Windows) ou `start.sh` (Linux/Mac) com seus comandos favoritos:

**start.bat:**
```batch
@echo off
echo Iniciando Redis...
docker start redis
timeout /t 2
echo Iniciando Post Generator...
npm run dev
```

**start.sh:**
```bash
#!/bin/bash
echo "Iniciando Redis..."
sudo service redis-server start
sleep 2
echo "Iniciando Post Generator..."
npm run dev
```

Depois é só executar:
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

---

Mantenha este arquivo aberto para referência rápida! 📌
