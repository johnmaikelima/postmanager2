# 🔧 Guia: Configurar Google Cloud Console para Text-to-Speech

## Passo 1: Criar uma Conta Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Selecionar um projeto"** (canto superior esquerdo)
3. Clique em **"NOVO PROJETO"**
4. Digite um nome: `Post Manager Video Generator`
5. Clique em **"CRIAR"**
6. Aguarde alguns segundos até o projeto ser criado

## Passo 2: Ativar a API de Text-to-Speech

1. No console, vá para **"APIs e Serviços"** (menu esquerdo)
2. Clique em **"Biblioteca"**
3. Na barra de busca, digite: `Text-to-Speech`
4. Clique em **"Cloud Text-to-Speech API"**
5. Clique no botão **"ATIVAR"** (azul)
6. Aguarde a ativação (pode levar alguns segundos)

## Passo 3: Criar Credenciais (Chave de Serviço)

1. Vá para **"APIs e Serviços"** → **"Credenciais"** (menu esquerdo)
2. Clique em **"+ CRIAR CREDENCIAIS"** (botão azul no topo)
3. Selecione **"Conta de Serviço"**
4. Preencha:
   - **Nome da conta de serviço**: `post-manager-tts`
   - **ID da conta de serviço**: (preenchido automaticamente)
5. Clique em **"CRIAR E CONTINUAR"**
6. Na próxima tela, clique em **"CONTINUAR"** (sem preencher nada)
7. Clique em **"CONCLUÍDO"**

## Passo 4: Gerar Arquivo JSON de Credenciais

1. Você será redirecionado para a página de credenciais
2. Procure por **"Contas de Serviço"** na seção esquerda
3. Clique na conta que criou: `post-manager-tts`
4. Vá para a aba **"CHAVES"**
5. Clique em **"Adicionar Chave"** → **"Criar nova chave"**
6. Selecione **"JSON"**
7. Clique em **"CRIAR"**
8. Um arquivo JSON será baixado automaticamente
   - **Salve este arquivo em um local seguro!**
   - Nome padrão: `post-manager-tts-xxxxx.json`

## Passo 5: Configurar no Projeto Post Manager

### Opção A: Usando Variável de Ambiente (Recomendado)

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a linha:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/caminho/completo/para/arquivo.json
   ```
   
   **Exemplo no Windows:**
   ```
   GOOGLE_APPLICATION_CREDENTIALS=C:/Users/Acer/Desktop/post-manager-tts-xxxxx.json
   ```
   
   **Exemplo no Linux/Mac:**
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/home/usuario/post-manager-tts-xxxxx.json
   ```

3. Salve o arquivo `.env`
4. Reinicie o servidor (`npm run dev`)

### Opção B: Copiar Arquivo para o Projeto

1. Copie o arquivo JSON baixado
2. Cole na pasta raiz do projeto: `/server/config/`
3. Renomeie para: `google-credentials.json`
4. Adicione ao `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./server/config/google-credentials.json
   ```

## Passo 6: Testar a Configuração

1. Abra o navegador em: `http://localhost:5175`
2. Vá para **"Gerar Vídeos"** na navegação
3. Selecione uma notícia
4. Clique em **"Gerar Vídeo"**
5. Se funcionar, você verá a narração sendo gerada ✅

## ⚠️ Importante: Segurança

- **NUNCA** compartilhe o arquivo JSON
- **NUNCA** faça commit do arquivo JSON no Git
- Adicione ao `.gitignore`:
  ```
  google-credentials.json
  *-xxxxx.json
  ```

## 💰 Custos

- **Primeiros 1 milhão de caracteres/mês**: GRÁTIS
- Depois disso: ~$16 por milhão de caracteres
- Para seu projeto: praticamente grátis!

## 🆘 Troubleshooting

### Erro: "GOOGLE_APPLICATION_CREDENTIALS not set"
- Verifique se o caminho no `.env` está correto
- Reinicie o servidor após adicionar a variável
- Use o caminho absoluto completo

### Erro: "Permission denied"
- Verifique se o arquivo JSON existe no caminho especificado
- Verifique permissões do arquivo (deve ser legível)

### Erro: "API not enabled"
- Volte ao passo 2 e confirme se a API foi ativada
- Aguarde 5 minutos após ativar (às vezes demora)

## ✅ Próximos Passos

Após configurar:
1. Teste gerando um vídeo
2. Ajuste as configurações de voz (velocidade, idioma)
3. Explore os efeitos e transições
4. (Opcional) Configure integração com YouTube

---

**Dúvidas?** Consulte a documentação oficial:
- Google Cloud: https://cloud.google.com/text-to-speech/docs
- Guia de Autenticação: https://cloud.google.com/docs/authentication/getting-started
