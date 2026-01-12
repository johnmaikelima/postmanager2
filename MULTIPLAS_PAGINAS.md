# 📱 Sistema de Múltiplas Páginas - IMPLEMENTADO!

## ✅ Nova Funcionalidade Adicionada

Agora você pode **selecionar em qual página publicar** diretamente na interface!

---

## 🎯 Como Funciona

### 1. **Sistema carrega suas páginas automaticamente**
Quando você abre o Editor de Posts, o sistema:
- Busca todas as páginas que você administra no Facebook
- Exibe um seletor com todas elas
- Mostra nome e número de seguidores de cada página

### 2. **Você escolhe onde publicar**
Antes de publicar ou agendar, você pode:
- Selecionar qual página receberá o post
- Ver quantos seguidores cada página tem
- Trocar de página a qualquer momento

### 3. **Publica na página escolhida**
O post será publicado na página que você selecionou!

---

## 🖼️ Interface

No **Editor de Posts**, você verá uma nova seção:

```
┌─────────────────────────────────────────┐
│ 📱 Selecione a Página para Publicar    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Minha Página Principal (5.2k seg.) ▼│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Você tem 3 páginas disponíveis         │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuração

### No arquivo `.env`:

Você **NÃO precisa mais** definir uma página fixa!

**Antes (antigo):**
```env
FACEBOOK_PAGE_ID=123456789  # Apenas uma página
```

**Agora (novo):**
```env
# O sistema busca TODAS as suas páginas automaticamente!
# Você escolhe na interface qual usar
```

### Mas você ainda pode definir uma página padrão (opcional):
```env
FACEBOOK_PAGE_ID=123456789  # Será usada se não selecionar outra
```

---

## 📋 Requisitos

Para que funcione, você precisa:

### 1. **Token de Acesso com permissões corretas:**
```
pages_read_engagement
pages_manage_posts
pages_read_user_content
```

### 2. **Ser administrador das páginas:**
- Você precisa ter permissão de admin nas páginas
- Páginas onde você é apenas editor podem não aparecer

---

## 🚀 Como Usar

### Passo 1: Configure o Facebook
```env
FACEBOOK_ACCESS_TOKEN=seu_token_aqui
```

### Passo 2: Inicie o sistema
```bash
npm run dev
```

### Passo 3: Vá para "Editor de Posts"
- O sistema carrega suas páginas automaticamente

### Passo 4: Escolha a página
- Selecione no dropdown qual página usar

### Passo 5: Publique!
- Clique em "Publicar Agora" ou "Agendar"
- O post vai para a página selecionada

---

## 💡 Exemplos de Uso

### Exemplo 1: Publicar em páginas diferentes
```
1. Escreva um post sobre "Promoção de Natal"
2. Selecione "Loja Principal"
3. Publique
4. Escreva outro post sobre o mesmo tema
5. Selecione "Loja Filial"
6. Publique
```

### Exemplo 2: Testar em página de testes
```
1. Crie um post
2. Selecione "Página de Testes"
3. Publique para ver como fica
4. Se gostar, publique na página principal
```

### Exemplo 3: Gerenciar múltiplos clientes
```
1. Configure o token com acesso a várias páginas
2. Selecione a página do Cliente A
3. Publique posts do Cliente A
4. Troque para página do Cliente B
5. Publique posts do Cliente B
```

---

## 🔍 Detalhes Técnicos

### Nova API Endpoint:
```
GET /api/facebook/pages
```

Retorna:
```json
{
  "success": true,
  "count": 3,
  "pages": [
    {
      "id": "123456789",
      "name": "Minha Página",
      "picture": { "data": { "url": "..." } },
      "fan_count": 5234,
      "category": "Loja de Varejo"
    }
  ]
}
```

### Parâmetro adicional na publicação:
```javascript
{
  "message": "Texto do post",
  "imagePath": "/uploads/image.jpg",
  "targetPageId": "123456789"  // NOVO!
}
```

---

## ⚠️ Observações Importantes

### 1. **Token precisa ter acesso a todas as páginas**
- Se você administra 5 páginas mas o token só tem acesso a 2
- Apenas essas 2 aparecerão no seletor

### 2. **Páginas pessoais não aparecem**
- Apenas páginas (Pages) do Facebook
- Perfis pessoais não são suportados pela API

### 3. **Permissões necessárias**
- Você precisa ser **admin** ou **editor** da página
- Moderadores podem não ter permissão para publicar

### 4. **Primeira página é selecionada por padrão**
- Quando abre o editor, a primeira página já vem selecionada
- Você pode trocar antes de publicar

---

## 🎨 Melhorias Futuras (Opcional)

Possíveis melhorias que podem ser adicionadas:

- [ ] Mostrar foto da página no seletor
- [ ] Filtrar páginas por categoria
- [ ] Salvar última página usada
- [ ] Publicar em múltiplas páginas ao mesmo tempo
- [ ] Agendar posts diferentes para páginas diferentes

---

## 🐛 Solução de Problemas

### "Nenhuma página aparece no seletor"

**Possíveis causas:**
1. Token não tem permissão `pages_read_engagement`
2. Você não é admin de nenhuma página
3. Token expirou

**Solução:**
- Gere um novo token com permissões corretas
- Verifique se você é admin das páginas

### "Erro ao publicar na página selecionada"

**Possíveis causas:**
1. Token não tem permissão `pages_manage_posts`
2. Página foi removida ou desativada
3. Você perdeu permissão de admin

**Solução:**
- Verifique permissões do token
- Confirme que a página ainda existe
- Verifique seu nível de acesso na página

### "Página aparece mas não consigo publicar"

**Possíveis causas:**
1. Você é moderador, não admin
2. Página tem restrições de publicação
3. Token tem permissões de leitura mas não de escrita

**Solução:**
- Peça permissão de admin ao dono da página
- Verifique configurações da página
- Gere novo token com `pages_manage_posts`

---

## 📞 Testando

Para testar se está funcionando:

### 1. Teste a API diretamente:
```bash
curl http://localhost:3000/api/facebook/pages
```

Deve retornar suas páginas.

### 2. Teste na interface:
1. Abra o Editor de Posts
2. Veja se o seletor aparece
3. Veja se suas páginas estão listadas

### 3. Teste publicação:
1. Selecione uma página
2. Digite um texto de teste
3. Publique
4. Verifique na página do Facebook

---

## 🎉 Pronto!

Agora você pode gerenciar múltiplas páginas facilmente!

**Vantagens:**
- ✅ Não precisa trocar de conta
- ✅ Gerencia tudo em um lugar
- ✅ Vê todas as páginas de uma vez
- ✅ Publica onde quiser com 1 clique

Aproveite! 🚀
