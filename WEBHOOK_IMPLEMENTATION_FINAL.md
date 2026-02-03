# 🚀 Webhook Asaas - Implementação Final (Completa)

## 📋 Resumo Executivo

Implementação **completa** e **testável** do webhook Asaas com:

✅ **Idempotência**: Eventos duplicados não criam registros duplicados  
✅ **Timestamps corretos**: `processedAt >= receivedAt` (garantido pelo banco)  
✅ **Sem warnings**: Path resolving do package.json corrigido  
✅ **SSL documentado**: Cloud SQL SSL configurado e testável  
✅ **Script de teste**: Automatizado e pronto para usar

---

## 📁 Arquivos Alterados

### 1. **server/auth/billingRoutes.ts**
- Corrigi referência de campos webhook event: `status` (ao invés de `processingStatus`)
- Validação correta de status: "received", "processed", "error"
- Idempotência via `eventKey` UNIQUE constraint

### 2. **server/storage.ts**
- `markWebhookEventProcessed()`: Agora usa `sql\`now()\`` (banco) ao invés de `new Date()` (app)
- Garante que `processedAt >= receivedAt` **sempre**
- Mapeia status "failed" → "error" para consistência

### 3. **server/index.ts**
- Resolve package.json via `process.cwd()` ao invés de `__dirname`
- Silencia warning ENOENT em produção
- Path sempre correto em dev e build

### 4. **package.json**
- Adicionado comando: `"test:webhook": "node webhook-test.js"`

### 5. **webhook-test.js** (novo)
- Script Node.js para testar idempotência
- Dispara 2 POSTs idênticos
- Valida resposta de duplicate detection

### 6. **CLOUD_SQL_SSL_CONFIG.md** (novo)
- Documentação completa de SSL/TLS
- Modos: no-verify (dev), require, verify-ca (prod)
- Troubleshooting e boas práticas

---

## 🧪 Como Testar

### Pré-requisitos

```bash
# 1. Ter DATABASE_URL configurado
export DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=no-verify

# 2. Ter ASAAS_WEBHOOK_TOKEN definido
export ASAAS_WEBHOOK_TOKEN=seu-token-secreto-aqui

# 3. Servidor rodando em localhost:5000
npm start  # ou npm run dev
```

### Teste 1: Type Checking

```bash
npm run check
# ✅ Deve passar sem erros
```

### Teste 2: Idempotência (Automatizado)

```bash
npm run test:webhook
```

**Output esperado:**
```
🧪 Testing Asaas Webhook Idempotency

📍 Target: http://localhost:5000/api/webhooks/asaas
🔑 Webhook Token: seu-token-secreto-aqui
📦 Test Payload: {
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "asaas-pay-test-...",
    ...
  }
}

---

📤 Sending Request 1 (first event)...
✅ Response 1:
   Status: 200
   Body: {
     "received": true,
     "status": "processed"
   }

📤 Sending Request 2 (duplicate event)...
✅ Response 2:
   Status: 200
   Body: {
     "received": true,
     "duplicate": true
   }

---

🔍 VALIDATION

✅ Request 1 returned 200: true
✅ Request 2 returned 200: true
📌 Request 1 status: "processed"
📌 Request 2 status: undefined
📌 Request 2 marked as duplicate: true

---

✅ ALL TESTS PASSED!
   - Both webhooks returned 200 OK
   - Duplicate webhook correctly identified
   - Idempotency working correctly
```

### Teste 3: Validação no Banco

```bash
psql $DATABASE_URL

-- Contar webhook events para o eventKey
SELECT COUNT(*) as total,
       COUNT(DISTINCT event_key) as unique_keys,
       status,
       event_key
FROM webhook_events
WHERE event_key LIKE 'asaas:PAYMENT_CONFIRMED:%'
GROUP BY status, event_key;

-- ✅ Esperado: total=1, unique_keys=1 (para o mesmo evento)
```

### Teste 4: Timestamps (Validação Manual)

```bash
SELECT 
  id,
  event_key,
  received_at,
  processed_at,
  (processed_at >= received_at) as valid_order,
  EXTRACT(EPOCH FROM (processed_at - received_at)) as delay_seconds
FROM webhook_events
WHERE processed_at IS NOT NULL
LIMIT 5;

-- ✅ Esperado: valid_order = true para todos os registros
```

---

## 🔄 Fluxo de Idempotência

```
Webhook do Asaas chega →
  ↓
1️⃣ Valida token
  ↓
2️⃣ Gera eventKey = "asaas:PAYMENT_CONFIRMED:pay_123"
  ↓
3️⃣ Busca se eventKey já existe no BD
  ↓
   ├─ SIM e status="processed" → Retorna 200 com { duplicate: true }
   ├─ SIM e status="error" → Retenta processing (log)
   └─ NÃO → Cria novo registro com status="received"
  ↓
4️⃣ Processa evento (atualiza user, etc)
  ↓
5️⃣ Marca como processed (status + processedAt do banco)
  ↓
6️⃣ Retorna 200 { received: true, status: "processed" }
```

## 🗂️ Constraint de Idempotência

Na tabela `webhook_events`:

```sql
CONSTRAINT webhook_events_event_key_key UNIQUE (event_key)
```

**O que faz:**
- Garante que cada `eventKey` seja único
- Se tentarmos inserir novamente, o banco rejeita com `UNIQUE violation`
- Combinado com a lógica do app, temos idempotência **garantida**

---

## 📊 Status dos Campos

### received_at
- **Tipo**: timestamp
- **Padrão**: `DEFAULT NOW()` no banco
- **Definido em**: Criação do registro
- **Nunca muda**: ✅

### processed_at
- **Tipo**: timestamp
- **Padrão**: NULL
- **Definido em**: Quando `markWebhookEventProcessed()` é chamado
- **Valor**: `sql\`now()\`` (do banco, não da app)
- **Garantia**: `processedAt >= receivedAt` ✅

### status
- **"received"**: Webhook recebido, aguardando processamento
- **"processed"**: Webhook processado com sucesso
- **"error"**: Erro durante processamento (não bloqueia retry automático de Asaas)

---

## 🛡️ SSL/TLS - Resumo Rápido

### Dev Local
```bash
DATABASE_URL=postgresql://...?sslmode=no-verify
```

### Produção (Google Cloud SQL)
```bash
DATABASE_URL=postgresql://...?sslmode=require
# ou com CA explícito:
DATABASE_URL=postgresql://...?sslmode=verify-ca
DB_CA_CERT_PATH=/path/to/ca.pem
```

**Documentação completa**: [CLOUD_SQL_SSL_CONFIG.md](CLOUD_SQL_SSL_CONFIG.md)

---

## 🚀 Deploy

### Build
```bash
npm run build
# Gera:
# - dist/index.cjs (servidor)
# - dist/public/ (frontend)
```

### Dev
```bash
npm run dev
# Inicia com Vite middleware (hot reload)
```

### Produção
```bash
npm start
# Inicia servidor standalone em localhost:5000
```

---

## 📝 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com hot reload |
| `npm start` | Prod server em localhost:5000 |
| `npm run build` | Build para produção |
| `npm run check` | Type checking (TypeScript) |
| `npm run db:push` | Aplicar migrations Drizzle |
| `npm run test:webhook` | Testar idempotência do webhook |

---

## ✅ Checklist Final

- [x] Webhook handler validando token Asaas
- [x] Chave idempotente: `asaas:${event}:${payment.id}`
- [x] UNIQUE constraint em `event_key`
- [x] Script de teste de duplicatas
- [x] Timestamps corretos (BD, não app)
- [x] Package.json warning removido
- [x] SSL/TLS documentado
- [x] Type checking passando
- [x] Commits pequenos e claros

---

## 🎯 Próximos Passos (Opcional)

1. **Testar com webhook real do Asaas**
   - Configurar URL no dashboard do Asaas
   - Simular evento de pagamento
   - Validar que chegou e foi processado

2. **Monitoramento**
   - Dashboard de webhook events (admin page)
   - Alertas para status "error"

3. **Retry automático**
   - Se status="error", reprocessar periodicamente

4. **Logs estruturados**
   - JSON logging para ELK stack / DataDog

---

## 📞 Suporte

Qualquer dúvida, consulte:
- [CLOUD_SQL_SSL_CONFIG.md](CLOUD_SQL_SSL_CONFIG.md) para SSL
- [server/auth/billingRoutes.ts](server/auth/billingRoutes.ts#L242) para handler
- [server/storage.ts](server/storage.ts#L3450) para métodos de storage

---

**Gerado em**: 3 de fevereiro de 2026  
**Status**: ✅ Pronto para Produção
