# 📚 REFERÊNCIA RÁPIDA - VALORES E ROTAS

**Documento:** Lookup rápido de todas as informações extraídas do código  
**Atualizado:** 1º de fevereiro de 2026  
**Status:** 100% confirmado no código real

---

## 🔗 ROTAS DE AUTH

| Rota | HTTP | Path Exato | Arquivo | Linha | O que faz |
|---|---|---|---|---|---|
| Google Start | GET | `/api/auth/google/start` | `server/auth/googleAuth.ts` | 61 | Inicia OAuth, redireciona para Google |
| Google Callback | GET | `/api/auth/google/callback` | `server/auth/googleAuth.ts` | 92 | Recebe code, cria usuário, retorna JWT |
| Logout | POST | `/api/auth/logout` | `server/auth/independentAuth.ts` | 381 | Limpa cookies auth |
| Me | GET | `/api/auth/me` | `server/auth/independentAuth.ts` | 387 | Retorna dados do usuário (requer JWT) |

---

## 🔑 ENV VARS PARA CONFIGURAR

### Google OAuth
```
GOOGLE_CLIENT_ID=<do Google Console>
GOOGLE_CLIENT_SECRET=<do Google Console>
```

### Asaas
```
ASAAS_API_KEY=<do Asaas Dashboard>
ASAAS_WEBHOOK_TOKEN=<você gera/configura>
ASAAS_SANDBOX=false (ou true para sandbox)
```

### Base URL
```
APP_URL=https://appsalvaplantao.com.br
PUBLIC_BASE_URL=https://appsalvaplantao.com.br
```

---

## 🌐 URLS PARA GOOGLE CONSOLE

### Authorized JavaScript Origins (prod + dev)
```
https://appsalvaplantao.com.br
http://localhost:5000
http://localhost:5173
```

### Authorized Redirect URIs (prod + dev)
```
https://appsalvaplantao.com.br/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
http://localhost:5173/api/auth/google/callback
```

---

## 🔔 WEBHOOK ASAAS

| Propriedade | Valor |
|---|---|
| **HTTP Method** | POST |
| **Path** | `/api/webhooks/asaas` |
| **URL Produção** | `https://appsalvaplantao.com.br/api/webhooks/asaas` |
| **URL Dev** | `http://localhost:5000/api/webhooks/asaas` |
| **Arquivo** | `server/auth/billingRoutes.ts` |
| **Linha** | 242 |
| **Header** | `x-asaas-webhook-token: <seu_token>` |
| **Content-Type** | `application/json` |

---

## 🚀 GCLOUD DEPLOY

### Project Info
```
Project ID: salva-plantao-prod1
Service: salva-plantao-prod
Region: southamerica-east1
```

### Comando PowerShell (copie e execute)
```powershell
$projectId = "salva-plantao-prod1"
$region = "southamerica-east1"
$service = "salva-plantao-prod"

$googleClientId = "YOUR_VALUE"
$googleClientSecret = "YOUR_VALUE"
$asaasApiKey = "YOUR_VALUE"
$asaasWebhookToken = "YOUR_VALUE"

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
```

### Verificar Deploy
```powershell
gcloud run services describe $service `
  --project=$projectId `
  --region=$region `
  --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

---

## 🖥️ DEV SERVERS

| Server | Porta | Variável | Arquivo |
|---|---|---|---|
| Backend | 5000 | `PORT` | `server/index.ts` (linha 188) |
| Frontend (Vite) | 5173 | - | `vite.config.ts` (padrão) |

---

## 📍 DOMÍNIO

```
Production: https://appsalvaplantao.com.br
Localhost: http://localhost:5000 (backend)
           http://localhost:5173 (frontend)
```

---

## 📊 OAUTH FLOW

```
1. User acessa /api/auth/google/start
   ↓
2. Servidor gera state/verifier/nonce, redireciona para Google
   ↓
3. Google redirects para /api/auth/google/callback?code=...&state=...
   ↓
4. Servidor valida, faz token exchange, cria user, gera JWT
   ↓
5. Redireciona para /auth/callback?token=...
   ↓
6. Frontend armazena JWT, pode fazer /api/auth/me
```

---

## 🧪 TESTES RÁPIDOS

### Health Check
```powershell
Invoke-WebRequest -Uri "https://appsalvaplantao.com.br/api/health" -UseBasicParsing
```
**Esperado:** 200 + JSON com apiBaseUrl

### OAuth Start
```
https://appsalvaplantao.com.br/api/auth/google/start
```
**Esperado:** Redireciona para accounts.google.com

### Get User
```powershell
$token = "your_jwt_here"
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-WebRequest -Uri "https://appsalvaplantao.com.br/api/auth/me" -Headers $headers -UseBasicParsing
```
**Esperado:** 200 + JSON com userId, email, etc

### Webhook (test)
```powershell
$body = @{ event = "PAYMENT_CONFIRMED"; payment = @{ id = "test"; status = "paid" } } | ConvertTo-Json
$headers = @{ "x-asaas-webhook-token" = "your_token" }
Invoke-WebRequest -Uri "https://appsalvaplantao.com.br/api/webhooks/asaas" `
  -Method POST -Body $body -Headers $headers -UseBasicParsing
```
**Esperado:** 200 + `{"received":true}`

---

## 🔍 VERIFICAÇÃO DE CÓDIGO

### Localização das Funções de Registro

```typescript
// server/routes.ts, linhas 32-38
registerIndependentAuthRoutes(app);    // /api/auth/login, /api/auth/signup, /api/auth/logout, /api/auth/me
registerAuthRoutes(app);               // /api/auth/email/request, /api/auth/email/verify-code, etc
registerGoogleAuthRoutes(app);         // /api/auth/google/start, /api/auth/google/callback
registerBillingRoutes(app);            // /api/billing/*, /api/webhooks/asaas
```

### Ordem de Middleware Importante

```typescript
// server/index.ts
1. Health endpoints (/health, /api/health)
2. registerRoutes() → Todas as rotas /api/*
3. serveStatic() → Arquivos estáticos + fallback SPA
```

**Crítico:** `/api/*` vem ANTES de static serving para não ser capturado pelo fallback da SPA.

---

## 🛠️ TROUBLESHOOTING

### "GOOGLE_CLIENT_ID not configured"
→ Deploy executado? Aguardou 2-3 min? Verificou com `describe`?

### "Webhook token invalid"
→ Header `x-asaas-webhook-token` é case-sensitive e deve ser EXATAMENTE igual à env var

### "redirect_uri mismatch" (Google OAuth)
→ URL precisa ser EXATAMENTE: `https://appsalvaplantao.com.br/api/auth/google/callback` (sem trailing slash)

### "Cannot GET /auth/callback?token=..."
→ Verificou se rota `/auth/callback` existe no frontend (React Router)?

---

## 📋 CHECKLIST PONTA A PONTA

- [ ] Google Cloud Console OAuth 2.0 configurado
- [ ] Asaas webhook registrado
- [ ] `gcloud run deploy` executado com env vars
- [ ] Aguardou 2-3 minutos para deployment ficar ativo
- [ ] `/api/health` retorna 200
- [ ] Google OAuth redireciona corretamente
- [ ] Callback cria usuário no DB
- [ ] `/api/auth/me` retorna dados
- [ ] Webhook Asaas recebe eventos
- [ ] Gating bloqueia inadimplentes
- [ ] Cupons funcionam
- [ ] Logs sem erros críticos

✅ **Quando tudo ✓:** Sistema pronto para produção!

---

## 📑 DOCUMENTOS COMPLEMENTARES

- **VALIDACAO_FINAL_EXATA.md** → Valores exatos extraídos do código (7 seções)
- **PROXIMAS_ACOES_PASSO_A_PASSO.md** → Guia detalhado passo a passo (5 passos)
- **CHECKLIST_COMANDOS.md** → Checklists + comandos prontos
- **INVESTIGACAO_COMPLETA.md** → Análise completa (PASSO 1-6)

---

**Última atualização:** 1º de fevereiro de 2026  
**Verificação:** 100% do código real  
**Status:** Pronto para deploy
