# 📋 CHECKLISTS + COMANDOS PRONTOS PARA COPIAR/COLAR

## CHECKLIST 1: Google Cloud Console (OAuth Setup)

- [ ] Acessar https://console.cloud.google.com
- [ ] Selecionar projeto ou criar novo
- [ ] Ativar "Google+ API" / "OAuth API"
- [ ] Ir para "Credentials"
- [ ] Clique "Create Credentials" → "OAuth 2.0 Client IDs"
- [ ] Tipo: "Web application"
- [ ] Nome: "SALVA-PLANTAO-PROD"
- [ ] Adicionar em "Authorized JavaScript origins":
  - [ ] `https://appsalvaplantao.com.br`
  - [ ] `http://localhost:5000` (opcional, para dev)
- [ ] Adicionar em "Authorized redirect URIs":
  - [ ] `https://appsalvaplantao.com.br/api/auth/google/callback`
  - [ ] `http://localhost:5000/api/auth/google/callback` (opcional)
- [ ] Clicar "Create"
- [ ] Copiar **Client ID** → `$googleClientId`
- [ ] Copiar **Client Secret** → `$googleClientSecret`
- [ ] ✅ Pronto!

---

## CHECKLIST 2: Asaas Dashboard (API Key + Webhook)

### 2a. Obter API Key

- [ ] Acessar https://www.asaas.com (ou sandbox se quiser testar)
- [ ] Configurações → Integrações → API
- [ ] Gerar nova "Access Token" (se não existir)
- [ ] Copiar token → `$asaasApiKey`
- [ ] **Guardar em local seguro!**

### 2b. Registrar Webhook

- [ ] Ainda em Integrações → Webhooks
- [ ] Clique "Novo Webhook" ou "Add Webhook"
- [ ] URL: `https://appsalvaplantao.com.br/api/webhooks/asaas`
- [ ] Eventos a ativar:
  - [ ] PAYMENT_CONFIRMED
  - [ ] PAYMENT_RECEIVED
  - [ ] PAYMENT_UPDATED
  - [ ] PAYMENT_OVERDUE
  - [ ] PAYMENT_DELETED
  - [ ] PAYMENT_REFUNDED
- [ ] Token/Autenticação: Gerar token secreto → `$asaasWebhookToken`
- [ ] Salvar
- [ ] ✅ Pronto!

---

## CHECKLIST 3: Variáveis de Ambiente

Você deve ter agora:

```powershell
# Google OAuth
$googleClientId = "xxxxxxxx.apps.googleusercontent.com"
$googleClientSecret = "GOCSPX-xxxxxxxxxxxxxx"

# Asaas
$asaasApiKey = "sk_live_xxxxxxx" (ou sk_test para sandbox)
$asaasWebhookToken = "seu_token_secreto_aleatorio"

# Opcional
$publicBaseUrl = "https://appsalvaplantao.com.br"
```

---

## COMANDO 1: Deploy com Env Vars (Production)

```powershell
# PowerShell - Copie e adapte os valores

$projectId = "salva-plantao-prod1"
$region = "southamerica-east1"
$service = "salva-plantao-prod"

# SUBSTITUA ESSES VALORES:
$googleClientId = "PUT_YOUR_GOOGLE_CLIENT_ID_HERE"
$googleClientSecret = "PUT_YOUR_GOOGLE_CLIENT_SECRET_HERE"
$asaasApiKey = "PUT_YOUR_ASAAS_API_KEY_HERE"
$asaasWebhookToken = "PUT_YOUR_ASAAS_WEBHOOK_TOKEN_HERE"

# Deploy
gcloud run deploy $service `
  --region $region `
  --update-env-vars `
  GOOGLE_CLIENT_ID=$googleClientId,`
  GOOGLE_CLIENT_SECRET=$googleClientSecret,`
  ASAAS_API_KEY=$asaasApiKey,`
  ASAAS_WEBHOOK_TOKEN=$asaasWebhookToken,`
  ASAAS_SANDBOX=false,`
  PUBLIC_BASE_URL=https://appsalvaplantao.com.br `
  --project $projectId

echo "✅ Deploy concluído! Aguarde 2-3 minutos para a nova revisão ficar ativa."
```

**Tempo estimado:** 5-10 minutos

---

## COMANDO 2: Verificar Env Vars

```powershell
# Verificar se as env vars foram configuradas
gcloud run services describe salva-plantao-prod `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

**Você deve ver:**
- ✅ DATABASE_URL
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ BUILD_SHA
- ✅ BUILD_TIME
- ✅ **GOOGLE_CLIENT_ID** (novo)
- ✅ **GOOGLE_CLIENT_SECRET** (novo)
- ✅ **ASAAS_API_KEY** (novo)
- ✅ **ASAAS_WEBHOOK_TOKEN** (novo)
- ✅ ASAAS_SANDBOX
- ✅ PUBLIC_BASE_URL

---

## COMANDO 3: Ver Logs (Troubleshooting)

```powershell
# Últimos 50 logs
gcloud run logs read salva-plantao-prod `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --limit 50

# Seguir logs em tempo real
gcloud run logs read salva-plantao-prod `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --follow

# Apenas erros
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=salva-plantao-prod AND severity=ERROR" `
  --limit 20 `
  --project salva-plantao-prod1 `
  --format=json
```

---

## TESTE 1: /api/health (Build Metadata)

```powershell
# PowerShell
$response = Invoke-WebRequest -Uri "https://appsalvaplantao.com.br/api/health" -UseBasicParsing
$response.StatusCode
$response.Content | ConvertFrom-Json | Format-Table

# curl (se tiver Git Bash ou WSL)
curl -i https://appsalvaplantao.com.br/api/health
```

**Esperado:**
```
StatusCode        : 200
Content-Type      : application/json

{
  "appName": "Salva Plantão",
  "version": "1.0.0",
  "gitCommit": "1a70af4f...",
  "buildTime": "2026-02-01T18:00:50Z",
  "serverTime": "2026-02-01T...",
  "apiBaseUrl": "https://appsalvaplantao.com.br"
}
```

✅ **Sucesso:** Status 200 + JSON válido

---

## TESTE 2: Google OAuth Start (Fluxo Completo)

### Passo 1: Iniciar OAuth

```powershell
# Abrir no navegador
Start-Process "https://appsalvaplantao.com.br/api/auth/google/start"

# Ou apenas:
https://appsalvaplantao.com.br/api/auth/google/start
```

### Passo 2: Verificar Redirect

**Esperado:**
1. ✅ Redireciona para `accounts.google.com/o/oauth2/v2/auth?...`
2. ✅ Página de login Google aparece
3. ✅ Você clica em uma conta Google
4. ✅ Redireciona para `https://appsalvaplantao.com.br/auth/callback?token=...`
5. ✅ Página de callback renderiza (próxima página do app)

### Passo 3: Validar Usuário no Banco

```bash
# Conectar ao banco Postgres
psql $DATABASE_URL

# Verificar se usuário foi criado
SELECT id, email, firstName, lastName, authProvider, status 
FROM users 
WHERE email = '<seu_email_google>';

# Esperado:
# id | email | firstName | lastName | authProvider | status
# uuid | seu_email@gmail.com | John | Doe | google | pending
```

✅ **Sucesso:** Usuário criado com `authProvider=google` e `status=pending`

---

## TESTE 3: /api/auth/me (Get User)

```powershell
# Após fazer login via Google, você tem um JWT em localStorage
# Extraia o token do navegador (Dev Tools → Application → localStorage)

# Depois use:
$token = "seu_jwt_token_aqui"
$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest `
    -Uri "https://appsalvaplantao.com.br/api/auth/me" `
    -Headers $headers `
    -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json | Format-Table
```

**Esperado:**
```
StatusCode : 200

{
  "userId": "uuid-here",
  "email": "seu_email@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "status": "pending"
}
```

✅ **Sucesso:** Status 200 + dados do usuário corretos

---

## TESTE 4: Webhook Asaas (Mock)

```powershell
# Simular webhook de pagamento confirmado
$token = "seu_webhook_token_secreto"
$userId = "uuid-do-usuario"
$orderId = "1"

$body = @{
    event = "PAYMENT_CONFIRMED"
    payment = @{
        id = "asaas-pay-123"
        externalReference = "$userId|$orderId"
        status = "paid"
    }
} | ConvertTo-Json

$headers = @{
    "x-asaas-webhook-token" = $token
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest `
    -Uri "https://appsalvaplantao.com.br/api/webhooks/asaas" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json
```

**Esperado:**
```
StatusCode : 200

{
  "received": true
}
```

### Validar Efeitos no Banco

```sql
-- Verificar se billingOrder foi marcada como paid
SELECT id, status, paidAt 
FROM billing_orders 
WHERE id = 1;

-- Esperado:
-- id | status | paidAt
-- 1 | paid | 2026-02-01 18:30:00

-- Verificar se user.subscriptionExpiresAt foi atualizado
SELECT id, status, subscriptionExpiresAt 
FROM users 
WHERE id = 'uuid-do-usuario';

-- Esperado:
-- id | status | subscriptionExpiresAt
-- uuid | active | 2026-03-03 18:30:00 (30 dias depois)
```

✅ **Sucesso:** Order marcada como "paid" + subscription ativada

---

## TESTE 5: Gating de Usuário Inadimplente

### Setup: Criar usuário com assinatura expirada

```sql
UPDATE users 
SET subscriptionExpiresAt = '2025-12-31T00:00:00Z' 
WHERE id = 'uuid-do-usuario';
```

### Tentar acessar rota protegida

```powershell
$token = "jwt_token_do_usuario"
$headers = @{ "Authorization" = "Bearer $token" }

$response = Invoke-WebRequest `
    -Uri "https://appsalvaplantao.com.br/api/shifts/list" `
    -Headers $headers `
    -UseBasicParsing `
    -SkipHttpErrorCheck  # Permite capturar erros HTTP

$response.StatusCode
$response.Content | ConvertFrom-Json
```

**Esperado:**
```
StatusCode : 403

{
  "message": "Assinatura expirada",
  "status": "active",
  "subscriptionExpired": true,
  "expiresAt": "2025-12-31T00:00:00Z"
}
```

✅ **Sucesso:** Usuário bloqueado com mensagem clara

---

## TESTE 6: Cupom (Admin)

### Criar cupom

```powershell
$adminToken = "jwt_token_do_admin"
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

$body = @{
    code = "TESTE10"
    type = "percent"
    value = 10
    maxRedemptions = 100
    expiresAt = "2026-12-31T23:59:59Z"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "https://appsalvaplantao.com.br/api/promo-coupons" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json | Format-Table
```

**Esperado:**
```
StatusCode : 201

{
  "id": 1,
  "code": "TESTE10",
  "type": "percent",
  "value": 10,
  "maxRedemptions": 100,
  "currentUses": 0,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

### Validar cupom (user)

```powershell
$response = Invoke-WebRequest `
    -Uri "https://appsalvaplantao.com.br/api/promo-coupons/validate/TESTE10" `
    -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json | Format-Table
```

**Esperado:**
```
StatusCode : 200

{
  "valid": true,
  "code": "TESTE10",
  "type": "percent",
  "value": 10,
  "remainingUses": 100,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

✅ **Sucesso:** Cupom criado e validável

---

## TROUBLESHOOTING

### Erro: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados"

**Solução:**
1. Confirme que você rodou o comando de deploy com `--update-env-vars`
2. Espere 2-3 minutos para a nova revisão ficar pronta
3. Verifique: `gcloud run services describe ... --format=...`
4. Se ainda não aparecer, faça deploy novamente com `--no-cache`

### Erro: "Webhook token inválido"

**Solução:**
1. Confirme que `x-asaas-webhook-token` header está sendo enviado
2. Verifique se o token nos headers **exatamente** corresponde a `ASAAS_WEBHOOK_TOKEN`
3. Se Asaas envia webhook, copie o token exato que você configurou em Asaas → Webhooks

### Erro: "Google redirect_uri mismatch"

**Solução:**
1. Verifique URL em Google Cloud Console Credentials
2. Deve ser **exatamente**: `https://appsalvaplantao.com.br/api/auth/google/callback`
3. Sem trailing slash, sem http (deve ser https)
4. Salve e aguarde 5 minutos para ativar

### Erro 403 em /api/auth/me

**Solução:**
1. Verifique se JWT é válido (pode ter expirado)
2. Faça login novamente para obter novo token
3. Confirme que token está no header: `Authorization: Bearer <token>`

---

## VALIDAÇÃO FINAL (Checklist de Go-Live)

- [ ] `/api/health` retorna 200 com JSON
- [ ] Google OAuth start redireciona para Google
- [ ] Callback finaliza e cria usuário no banco
- [ ] `/api/auth/me` retorna dados do usuário
- [ ] Webhook Asaas recebe e processa eventos
- [ ] User com assinatura expirada é bloqueado
- [ ] Admin consegue criar cupom
- [ ] Cupom valida corretamente
- [ ] Planos de billing são exibidos no frontend
- [ ] Checkout redireciona para Asaas
- [ ] Pagamento confirmado ativa subscription

**Quando tudo ✅:** Sistema está pronto para produção!

---

**Última atualização:** 2026-02-01  
**Versão:** 1.0  
**Status:** Pronto para implementação
