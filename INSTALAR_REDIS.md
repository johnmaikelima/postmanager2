# 🚀 Como Instalar o Redis - Guia Rápido

## ✅ Dependências do Node.js - INSTALADAS!

Todas as dependências do projeto já foram instaladas com sucesso.

---

## 📦 Instalar Redis - 3 Opções

### ⭐ OPÇÃO 1: Instalar Ubuntu no WSL (RECOMENDADO)

**Passo 1:** Abra o PowerShell como Administrador e execute:

```powershell
wsl --install Ubuntu-24.04
```

**Passo 2:** Após a instalação, o Ubuntu vai abrir automaticamente. Crie um usuário e senha.

**Passo 3:** No terminal do Ubuntu (WSL), execute:

```bash
sudo apt-get update
sudo apt-get install redis-server -y
```

**Passo 4:** Inicie o Redis:

```bash
sudo service redis-server start
```

**Passo 5:** Teste se está funcionando:

```bash
redis-cli ping
```

Se retornar `PONG`, está funcionando! ✅

**Para iniciar o Redis sempre que precisar:**
```bash
wsl sudo service redis-server start
```

---

### 🐳 OPÇÃO 2: Instalar Docker Desktop

**Passo 1:** Baixe o Docker Desktop:
- Link: https://www.docker.com/products/docker-desktop/

**Passo 2:** Instale e reinicie o computador

**Passo 3:** Abra o PowerShell e execute:

```powershell
docker run -d -p 6379:6379 --name redis redis
```

**Para iniciar o Redis sempre que precisar:**
```powershell
docker start redis
```

---

### 💻 OPÇÃO 3: Redis para Windows (Não oficial)

**Passo 1:** Baixe o Redis para Windows:
- Link: https://github.com/tporadowski/redis/releases

**Passo 2:** Extraia o arquivo ZIP

**Passo 3:** Execute `redis-server.exe`

**Passo 4:** Deixe a janela aberta enquanto usa o sistema

---

## 🎯 Qual opção escolher?

| Opção | Vantagens | Desvantagens |
|-------|-----------|--------------|
| **WSL + Ubuntu** | ✅ Oficial, estável, fácil | Precisa instalar Ubuntu |
| **Docker** | ✅ Isolado, profissional | Precisa instalar Docker |
| **Windows** | ✅ Mais simples | ❌ Não oficial |

**Recomendo: Opção 1 (WSL + Ubuntu)** - É a mais confiável!

---

## ✅ Próximos Passos

Após instalar o Redis:

1. **Configure suas chaves de API no arquivo `.env`**
   - Facebook App ID, Access Token, Page ID
   - OpenAI API Key

2. **Inicie o sistema:**
   ```bash
   npm run dev
   ```

3. **Acesse:**
   ```
   http://localhost:5173
   ```

---

## 🆘 Precisa de Ajuda?

**Para instalar Ubuntu no WSL, execute no PowerShell (como Admin):**
```powershell
wsl --install Ubuntu-24.04
```

Depois siga os passos acima!

---

## 🔄 Comandos Úteis

### Verificar se Redis está rodando:
```bash
# WSL
wsl redis-cli ping

# Docker
docker ps
```

### Parar Redis:
```bash
# WSL
wsl sudo service redis-server stop

# Docker
docker stop redis
```

### Iniciar Redis:
```bash
# WSL
wsl sudo service redis-server start

# Docker
docker start redis
```

---

Boa sorte! 🎉
