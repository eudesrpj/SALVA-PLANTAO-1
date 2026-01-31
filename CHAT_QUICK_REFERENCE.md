# 🚀 Quick Reference - Chat Médico System

**Status**: ✅ Produção  
**Última Atualização**: 31 Jan 2026  
**Revisão**: salva-plantao-prod-00024-hzk

---

## 📍 Endpoints Disponíveis

### Conversas

```bash
# Listar conversas do usuário autenticado
GET /api/conversations
Authorization: Bearer <JWT>
Response: 200 OK - Array de conversas

# Criar nova conversa
POST /api/conversations
Content-Type: application/json
Authorization: Bearer <JWT>
Body: { "title": "Novo Chat" }
Response: 201 Created - { id, title, createdAt }

# Obter conversa com histórico
GET /api/conversations/:id
Authorization: Bearer <JWT>
Response: 200 OK - { id, title, messages[] }

# Deletar conversa
DELETE /api/conversations/:id
Authorization: Bearer <JWT>
Response: 204 No Content
```

### Mensagens

```bash
# Enviar mensagem e obter resposta
POST /api/conversations/:id/messages
Content-Type: application/json
Authorization: Bearer <JWT>
Body: { "content": "Sua pergunta..." }
Response: 200 OK - SSE stream com respostas

# Parser da resposta SSE
data: {"status":"streaming","content":"parte da resposta"}
data: {"status":"streaming","content":"mais conteúdo"}
data: {"done":true,"status":"success"}
```

### Sistema

```bash
# Health check do chat
GET /api/chat/health
Response: 200 OK
{
  "status": "ok",
  "ai_available": false,
  "timestamp": "2026-01-31T22:20:00Z"
}
```

---

## 🔐 Requisitos de Autenticação

Todas as rotas requerem JWT válido em cookies:

```
Cookie: __session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sem autenticação → `401 Unauthorized`

---

## ✅ Validações

### Criar Conversa
- `title` (opcional): 1-255 caracteres

### Enviar Mensagem
- `content` (obrigatório): 1-5000 caracteres

### Rejeições
- **400**: Dados inválidos
- **401**: Não autenticado  
- **404**: Conversa não encontrada
- **429**: Rate limit excedido (> 20 msgs/min)

---

## 🛡️ Segurança

### Sanitização Automática
- Remove HTML tags
- Remove `javascript:` protocol
- Remove event handlers (onclick, etc)

### Detecção de Padrões
Mensagens contendo são rejeitadas:
- CPF: `123.456.789-01`
- Email: `user@domain.com`
- Telefone: `(11) 9999-9999`

### Rate Limiting
- 20 mensagens por minuto por usuário
- Janela deslizante
- Resposta 429 ao exceder

---

## 🔄 Fluxo Completo de Chat

```
1. Autenticar
   POST /api/auth/login-password
   
2. Criar Conversa
   POST /api/conversations
   ← ID: 123
   
3. Enviar Mensagem
   POST /api/conversations/123/messages
   Body: { "content": "Olá!" }
   ← SSE Stream resposta
   
4. Histórico
   GET /api/conversations/123
   ← Array com todas mensagens
   
5. Limpar
   DELETE /api/conversations/123
```

---

## 📊 Respostas Comuns

### ✅ Sucesso
```json
{
  "status": "fallback",
  "message": "Desculpe, o assistente de IA está temporariamente indisponível..."
}
```

### ❌ Erro de Validação
```json
{
  "error": "Mensagem muito longa"
}
```

### ❌ Rate Limited
```json
{
  "error": "Muitas mensagens enviadas. Tente novamente em alguns segundos."
}
```

---

## 🔧 Troubleshooting

### Chat retorna status vazio
- Verificar autenticação: `curl -i GET /api/conversations`
- Verificar logs: `gcloud run services logs read salva-plantao-prod`

### Mensagens não aparecem
- Verificar ID da conversa: `GET /api/conversations`
- Verificar permissões: Deve estar autenticado como o usuário correto

### Rate limit muito rigoroso
- Limite é 20 msgs/minuto por usuário
- Janela reseta a cada minuto
- Para teste: usar usuários diferentes

### Validação muito restritiva
- Evitar CPF, emails, telefones em mensagens
- Limite de 5000 caracteres por mensagem

---

## 📈 Monitoramento

### Verificar Saúde
```bash
curl https://salva-plantao-prod-sd2sb3pbvq-rj.a.run.app/api/chat/health
```

### Ver Logs Recentes
```bash
gcloud run services logs read salva-plantao-prod --region=southamerica-east1 --limit=50 | grep "\[CHAT\]"
```

### Métricas Esperadas
- Tempo resposta: 50-100ms (fallback)
- Taxa erro: 0%
- Uptime: 100%

---

## 🚀 Deploy da Próxima Versão

```bash
# Atualizar código
git add .
git commit -m "feat(chat): sua mudança"
git push origin main

# Build e deploy
npm run build
gcloud run deploy salva-plantao-prod --source . --region southamerica-east1

# Verificar logs
gcloud run services logs read salva-plantao-prod --limit=30
```

---

## 📚 Referências

- Documentação Completa: [CHAT_SYSTEM_VERIFICATION.md](./CHAT_SYSTEM_VERIFICATION.md)
- Código Backend: [server/replit_integrations/chat/](./server/replit_integrations/chat/)
- Variáveis Prod: Cloud Run Secrets (DATABASE_URL, JWT_SECRET, etc)

---

**Last Updated**: 31 Jan 2026  
**Status**: ✅ Pronto para Produção
