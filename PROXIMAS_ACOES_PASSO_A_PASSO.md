# 🚀 PRÓXIMAS AÇÕES - PASSO A PASSO

**Data:** 1º de fevereiro de 2026  
**Status:** Código 100% pronto. Aguardando configurações externas.  
**Tempo estimado:** 40-60 minutos (incluindo todas as etapas)

---

## ⏳ ROADMAP DE EXECUÇÃO

```
PASSO 1: Google Cloud Console Setup (15 min)
   └─ Criar OAuth 2.0 Client ID
   └─ Registrar authorized origins
   └─ Registrar redirect URIs
   └─ Obter Client ID e Secret

PASSO 2: Asaas Dashboard Setup (10 min)
   └─ Gerar API Key
   └─ Registrar webhook URL
   └─ Gerar/copiar webhook token

PASSO 3: Deploy com gcloud (10-15 min)
   └─ Executar comando deploy com env vars
   └─ Aguardar nova revisão ficar ativa
   └─ Validar env vars com describe

PASSO 4: Testes End-to-End (15-20 min)
   └─ Teste /api/health
   └─ Teste Google OAuth completo
   └─ Teste /api/auth/me
   └─ Teste webhook Asaas
   └─ Teste gating/inadimplentes
   └─ Teste cupons

PASSO 5: Verificação Final (5 min)
   └─ Confirmar todos os testes passando
   └─ Validar logs em Cloud Logging
   └─ Go-live!
```

---

## PASSO 1️⃣: GOOGLE CLOUD CONSOLE

### 1.1 Acessar Google Cloud Console

```
URL: https://console.cloud.google.com
```

**Se você não tem projeto ainda:**
1. Clique "Select a Project" → "New Project"
2. Nome: "Salva Plantão" ou "SALVA-PLANTAO-PROD"
3. Clique "Create"

### 1.2 Ativar Google+ API / OAuth

1. No painel, procure "APIs & Services"
2. Clique "Enable APIs and Services"
3. Procure por "Google+ API" ou "OAuth 2.0"
4. Clique "Enable"
5. Aguarde (~1 minuto)

### 1.3 Criar OAuth 2.0 Client ID

1. No menu, vá para "Credentials"
2. Clique "Create Credentials" → "OAuth client ID"
3. Se pedir para "Create Consent Screen" primeiro:
   - Clique "Create Consent Screen"
   - User Type: "External"
   - Preencha: App name = "Salva Plantão"
   - Scopes: "openid", "email", "profile"
   - Salve e volte para Credentials

### 1.4 Configurar OAuth 2.0 Client

1. Clique "Create Credentials" → "OAuth client ID" (novamente)
2. Application Type: **"Web application"**
3. Name: "SALVA-PLANTAO-PROD"
4. Em "Authorized JavaScript origins", adicione:
   ```
   https://appsalvaplantao.com.br
   http://localhost:5000
   http://localhost:5173
   ```
5. Em "Authorized redirect URIs", adicione:
   ```
   https://appsalvaplantao.com.br/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   http://localhost:5173/api/auth/google/callback
   ```
6. Clique "Create"

### 1.5 Copiar Valores

Uma modal vai aparecer com:
- **Client ID** → Copie e salve em lugar seguro
- **Client Secret** → Copie e salve em lugar seguro (NÃO COMPARTILHE!)

**Salve em um arquivo temporário:**
```
GOOGLE_CLIENT_ID=xxxxx-yyyyyyy.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-zzzzzzzzzzzzz
```

✅ **PASSO 1 CONCLUÍDO**

---

## PASSO 2️⃣: ASAAS SETUP

### 2.1 Acessar Asaas

```
URL: https://www.asaas.com (produção)
OU
URL: https://app.asaas.com (sandbox, se preferir testar)
```

**Faça login com suas credenciais Asaas**

### 2.2 Gerar API Key

1. No menu superior, vá para **Configurações** ou **Settings**
2. Procure por **Integrações** → **API**
3. Se não tiver Access Token:
   - Clique "Gerar novo Access Token" ou "Generate Token"
4. Copie o token → Salve com segurança

**Salve:**
```
ASAAS_API_KEY=sk_live_xxxxxxxx (ou sk_test para sandbox)
```

### 2.3 Registrar Webhook

1. Ainda em Integrações, vá para **Webhooks**
2. Clique "Adicionar novo Webhook" ou "Add Webhook"
3. URL do Webhook:
   ```
   https://appsalvaplantao.com.br/api/webhooks/asaas
   ```
4. Eventos a ativar (selecione todos):
   - [ ] PAYMENT_CONFIRMED
   - [ ] PAYMENT_RECEIVED
   - [ ] PAYMENT_UPDATED
   - [ ] PAYMENT_OVERDUE
   - [ ] PAYMENT_DELETED
   - [ ] PAYMENT_REFUNDED
5. Token/Autenticação:
   - Gere um token secreto (pode ser um UUID, ex: `550e8400-e29b-41d4-a716-446655440000`)
   - Copie e salve com segurança

**Salve:**
```
ASAAS_WEBHOOK_TOKEN=seu_token_secreto_aleatorio
ASAAS_SANDBOX=false
```

✅ **PASSO 2 CONCLUÍDO**

---

## PASSO 3️⃣: DEPLOY COM GCLOUD

### 3.1 Preparar Valores

Você agora tem:
```
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=yyyyy
ASAAS_API_KEY=zzzzz
ASAAS_WEBHOOK_TOKEN=wwwww
```

### 3.2 Executar Deploy (PowerShell)

Abra PowerShell e execute:

```powershell
# Variables
$projectId = "salva-plantao-prod1"
$region = "southamerica-east1"
$service = "salva-plantao-prod"

# SUBSTITUTE WITH YOUR VALUES
$googleClientId = "PASTE_YOUR_GOOGLE_CLIENT_ID"
$googleClientSecret = "PASTE_YOUR_GOOGLE_CLIENT_SECRET"
$asaasApiKey = "PASTE_YOUR_ASAAS_API_KEY"
$asaasWebhookToken = "PASTE_YOUR_ASAAS_WEBHOOK_TOKEN"

# Deploy
gcloud run deploy $service `
  --project=$projectId `
  --region=$region `
  --update-env-vars `
  GOOGLE_CLIENT_ID=$googleClientId,`
  GOOGLE_CLIENT_SECRET=$googleClientSecret,`
  ASAAS_API_KEY=$asaasApiKey,`
  ASAAS_WEBHOOK_TOKEN=$asaasWebhookToken,`
  ASAAS_SANDBOX=false,`
  APP_URL=https://appsalvaplantao.com.br,`
  PUBLIC_BASE_URL=https://appsalvaplantao.com.br

echo "Deployment iniciado. Aguarde 2-3 minutos..."
```

**O que esperar:**
- Mensagem de sucesso com revision ID (ex: `salva-plantao-prod-00056-abc`)
- Output mostra URL de acesso

### 3.3 Verificar Deploy

Aguarde 2-3 minutos, depois execute:

```powershell
gcloud run services describe salva-plantao-prod `
  --project=salva-plantao-prod1 `
  --region=southamerica-east1 `
  --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

**Você deve ver:**
- ✅ GOOGLE_CLIENT_ID (novo)
- ✅ GOOGLE_CLIENT_SECRET (novo)
- ✅ ASAAS_API_KEY (novo)
- ✅ ASAAS_WEBHOOK_TOKEN (novo)
- ✅ ASAAS_SANDBOX=false
- ✅ APP_URL=https://appsalvaplantao.com.br
- ✅ PUBLIC_BASE_URL=https://appsalvaplantao.com.br
- ✅ Outras vars já existentes (DATABASE_URL, JWT_SECRET, etc)

✅ **PASSO 3 CONCLUÍDO**

---

## PASSO 4️⃣: TESTES END-TO-END

### 4.1 TESTE 1: /api/health

Valida que o servidor está respondendo com metadata correta.

**PowerShell:**
```powershell
$response = Invoke-WebRequest -Uri "https://appsalvaplantao.com.br/api/health" -UseBasicParsing
$response.StatusCode
$response.Content | ConvertFrom-Json | Format-Table
```

**Esperado:**
```
StatusCode: 200

appName              : Salva Plantão
version              : 1.0.0
gitCommit            : 1a70af4f...
buildTime            : 2026-02-01T18:00:50Z
serverTime           : 2026-02-01T... (hora atual)
apiBaseUrl           : https://appsalvaplantao.com.br
```

✅ **PASSOU SE:** Status 200 + JSON válido com apiBaseUrl correto

---

### 4.2 TESTE 2: Google OAuth Completo

Testa fluxo OAuth inteiro (login, callback, JWT).

**Passo 1: Abrir navegador**
```
https://appsalvaplantao.com.br/api/auth/google/start
```

**Passo 2: Completar fluxo**
1. Você é redirecionado para `accounts.google.com`
2. Faça login com sua conta Google
3. Clique "Allow" na permissão de acesso
4. Você é redirecionado para `/auth/callback?token=...`
5. Página renderiza com sucesso

**Passo 3: Validar usuário no banco**
```bash
psql $DATABASE_URL

SELECT id, email, authProvider, status 
FROM users 
WHERE email = '<seu_email_google>';
```

**Esperado:**
```
id    | email               | authProvider | status
uuid  | seu_email@gmail.com | google       | pending
```

✅ **PASSOU SE:** Usuário criado com authProvider=google

---

### 4.3 TESTE 3: /api/auth/me

Testa que JWT está sendo retornado e é válido.

**Passo 1: Extrair JWT**
1. Abra Dev Tools (F12) → Application → Cookies
2. Procure por cookie `auth_token` ou `refresh_token`
3. Copie o valor

**Passo 2: Chamar /api/auth/me**
```powershell
$token = "JWT_TOKEN_AQUI"
$headers = @{ "Authorization" = "Bearer $token" }

$response = Invoke-WebRequest `
  -Uri "https://appsalvaplantao.com.br/api/auth/me" `
  -Headers $headers `
  -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json | Format-Table
```

**Esperado:**
```
StatusCode: 200

userId              : uuid
email               : seu_email@gmail.com
firstName           : John
lastName            : Doe
role                : user
status              : pending
profileImageUrl     : (URL da foto Google ou null)
```

✅ **PASSOU SE:** Status 200 + Dados do usuário retornados

---

### 4.4 TESTE 4: Webhook Asaas (Simulação)

Testa que webhook pode receber e processar pagamento.

**PowerShell:**
```powershell
$token = "seu_webhook_token_exato"
$userId = "uuid_do_usuario_criado_no_teste_2"

$body = @{
    event = "PAYMENT_CONFIRMED"
    payment = @{
        id = "asaas-pay-test-123"
        externalReference = "$userId|1"
        status = "paid"
        billingDate = Get-Date -Format "yyyy-MM-dd"
        dueDate = Get-Date -Format "yyyy-MM-dd"
        value = 29.90
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
  -UseBasicParsing `
  -SkipHttpErrorCheck

$response.StatusCode
$response.Content | ConvertFrom-Json
```

**Esperado:**
```
StatusCode: 200

received: true
```

**Passo 2: Validar banco**
```bash
SELECT status, paidAt FROM billing_orders WHERE id = 1;
```

✅ **PASSOU SE:** Status 200 + Banco atualizado

---

### 4.5 TESTE 5: Gating (Inadimplentes)

Testa que usuário com assinatura expirada é bloqueado.

**Passo 1: Expirar subscription**
```bash
UPDATE users 
SET subscriptionExpiresAt = '2025-01-01T00:00:00Z' 
WHERE id = 'uuid_do_usuario';
```

**Passo 2: Tentar acessar rota protegida**
```powershell
$token = "JWT_DO_USUARIO_EXPIRADO"
$headers = @{ "Authorization" = "Bearer $token" }

$response = Invoke-WebRequest `
  -Uri "https://appsalvaplantao.com.br/api/shifts/list" `
  -Headers $headers `
  -UseBasicParsing `
  -SkipHttpErrorCheck

$response.StatusCode
$response.Content | ConvertFrom-Json
```

**Esperado:**
```
StatusCode: 403

message: "Assinatura expirada"
status: "active"
subscriptionExpired: true
expiresAt: "2025-01-01T00:00:00Z"
```

✅ **PASSOU SE:** Status 403 com mensagem clara

---

### 4.6 TESTE 6: Cupom (Admin)

Testa criação e validação de cupom.

**Passo 1: Criar cupom (admin)**
```powershell
$adminToken = "JWT_DO_ADMIN"
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
$response.Content | ConvertFrom-Json
```

**Esperado:**
```
StatusCode: 201

id: 1
code: "TESTE10"
type: "percent"
value: 10
maxRedemptions: 100
currentUses: 0
```

**Passo 2: Validar cupom (usuário comum)**
```powershell
$response = Invoke-WebRequest `
  -Uri "https://appsalvaplantao.com.br/api/promo-coupons/validate/TESTE10" `
  -UseBasicParsing

$response.StatusCode
$response.Content | ConvertFrom-Json
```

**Esperado:**
```
StatusCode: 200

valid: true
code: "TESTE10"
type: "percent"
value: 10
remainingUses: 100
```

✅ **PASSOU SE:** Cupom criado e validado

---

## PASSO 5️⃣: VERIFICAÇÃO FINAL

### 5.1 Checklist de Go-Live

- [ ] `/api/health` retorna 200 + JSON ✅
- [ ] OAuth redireciona para Google ✅
- [ ] Callback cria usuário no DB ✅
- [ ] `/api/auth/me` retorna dados ✅
- [ ] Webhook processa PAYMENT_CONFIRMED ✅
- [ ] Usuário inadimplente recebe 403 ✅
- [ ] Cupom criável e validável ✅
- [ ] Logs de Cloud Logging sem ERRORS ✅
- [ ] Google Console mostra requisições de OAuth ✅
- [ ] Asaas Dashboard mostra webhook recebido ✅

### 5.2 Verificar Logs

```powershell
# Últimos 50 logs
gcloud run logs read salva-plantao-prod `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --limit 50

# Apenas errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=salva-plantao-prod AND severity=ERROR" `
  --limit 20 `
  --project salva-plantao-prod1
```

**Esperado:** Nenhum erro crítico relacionado a GOOGLE_CLIENT_ID, ASAAS_API_KEY, etc.

### 5.3 Status Final

✅ **Quando todos os testes passam:**
```
🎉 Sistema está PRONTO PARA PRODUÇÃO!
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

| Erro | Solução |
|---|---|
| `GOOGLE_CLIENT_ID not configured` | Execute deploy novamente, aguarde 2-3 min, verifique com describe |
| `Webhook token invalid` | Confirme que `x-asaas-webhook-token` header **exatamente** bate com env var |
| `redirect_uri mismatch` | URL em Google Console deve ser **exatamente**: `https://appsalvaplantao.com.br/api/auth/google/callback` (sem trailing slash) |
| `403 Forbidden` em qualquer rota | Usuário pode estar inadimplente - verifique `subscriptionExpiresAt` no banco |
| `JWT expired` | Usuário fez login há muito tempo - faça novo login |

---

## ✅ RESUMO

```
┌─────────────────────────────────────────────┐
│  1. Google Cloud Console (15 min)           │
│  2. Asaas Dashboard (10 min)                │
│  3. Deploy com gcloud (15 min)              │
│  4. Testes 1-6 (20 min)                     │
│  5. Verificação Final (5 min)               │
└─────────────────────────────────────────────┘
        TOTAL: 60-65 MINUTOS
        
        Resultado: Sistema em produção ✅
```

**Você tem tudo que precisa. Comece agora!**
