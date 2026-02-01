# 🔍 INVESTIGAÇÃO COMPLETA - SALVA PLANTÃO (FASE 1 A 4)

## PASSO 1 — INSPEÇÃO DO CÓDIGO (RESULTADO FINAL)

### 1.1 Rotas de OAuth Google (Path Exatos)

**Arquivo:** `server/auth/googleAuth.ts`

| Endpoint | Método | Path Exato | Descrição |
|----------|--------|-----------|-----------|
| **Iniciar OAuth** | GET | `/api/auth/google/start` | Redireciona para Google Sign-in |
| **Callback** | GET | `/api/auth/google/callback` | Recebe código do Google, cria/atualiza usuário |
| **Logout** | POST | `/api/auth/logout` | Limpa cookies de autenticação |
| **Me (Usuário)** | GET | `/api/auth/me` | Retorna dados do usuário autenticado |

**Localização:** 
- Google Auth: `server/auth/googleAuth.ts`
- Logout/Me: `server/auth/independentAuth.ts`

---

### 1.2 Callback Path Exato

```
GET /api/auth/google/callback?code=...&state=...
```

**O que acontece:**
1. Backend extrai `code`, `state`, `nonce` dos cookies
2. Faz requisição a Google com PKCE para obter token
3. Valida e extrai claims (sub, email, name, picture)
4. Cria/atualiza usuário na tabela `users`
5. Cria registro em `authIdentities` (linkando Google sub com userId)
6. Gera JWT token
7. Redireciona para `/auth/callback?token=JWT`

**No frontend (Login.tsx, linha 155):**
```tsx
window.location.href = "/api/auth/google/start";
```

---

### 1.3 URL Base (Produção vs Dev)

**Servidor detecta automaticamente:**

```typescript
// server/auth/googleAuth.ts, função getBaseUrl()
function getBaseUrl(req: Request): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, "");

  const protocol = (req.headers["x-forwarded-proto"] as string) || 
                   (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers.host || req.hostname;
  return `${protocol}://${host}`;
}
```

**Prioridade:**
1. `process.env.APP_URL` (se definido)
2. X-Forwarded-Proto + Host (para Cloud Run/proxies)
3. protocol + hostname (fallback)

**Em produção (Cloud Run):**
- `x-forwarded-proto`: `https`
- `host`: `appsalvaplantao.com.br`
- **Resultado:** `https://appsalvaplantao.com.br`

**Em desenvolvimento:**
- protocol: `http`
- host: `localhost:5000`
- **Resultado:** `http://localhost:5000`

---

### 1.4 Frontend e Backend

**Architetura:** **MONOLÍTICO (mesmo host)**

```
┌─────────────────────────────────────┐
│  https://appsalvaplantao.com.br     │
├─────────────────────────────────────┤
│  Express Server (server/index.ts)   │
├─────────────────────────────────────┤
│  /api/*           → Backend routes   │
│  /health          → Diagnostic       │
│  /auth/*          → Auth routes      │
│  /webhooks/*      → Webhooks         │
│  /*               → SPA (React)      │
└─────────────────────────────────────┘
```

**Ordem de middleware (server/index.ts):**
1. `/health` (diagnostic)
2. `/api/health` (build metadata)
3. `/api/auth/*` (auth routes - Google OAuth)
4. `/api/webhooks/*` (Asaas webhooks)
5. Todas as outras rotas `/api/*`
6. `express.static()` (arquivos estáticos: .js, .css, assets)
7. `*` catch-all (SPA fallback para index.html)

**Importante:** Rotas `/api/*` são registradas **ANTES** de `serveStatic()`, então nunca caem no fallback do frontend.

---

### 1.5 Webhook Asaas (Path Exato)

**Arquivo:** `server/auth/billingRoutes.ts` (linha 242)

```
POST /api/webhooks/asaas
Headers:
  x-asaas-webhook-token: <token>
Body:
  {
    "event": "PAYMENT_CONFIRMED|PAYMENT_RECEIVED|PAYMENT_UPDATED|...",
    "payment": {
      "id": "asaas-payment-123",
      "externalReference": "userId|orderId",
      "status": "paid|overdue|..."
    }
  }
```

**Processamento:**
1. Valida token em header `x-asaas-webhook-token`
2. Verifica idempotência por `eventKey` (event:id:externalReference)
3. Se `PAYMENT_CONFIRMED/RECEIVED`:
   - Atualiza `billingOrders` (status = "paid")
   - Ativa entitlement do usuário
   - Atualiza `subscriptions`
   - Incrementa `promo_coupons.currentUses` (se cupom foi usado)
4. Retorna `{received: true}`

---

### 1.6 Variáveis de Ambiente (Atuais vs Necessárias)

#### Env Vars **Atualmente Configuradas** no Cloud Run:
```
DATABASE_URL         ✅ (conectado)
JWT_SECRET           ✅ (configurado)
JWT_REFRESH_SECRET   ✅ (configurado)
BUILD_SHA            ✅ (injetado no deploy)
BUILD_TIME           ✅ (injetado no deploy)
```

#### Env Vars **Necessárias para Google OAuth:**
```
GOOGLE_CLIENT_ID     ❌ FALTANDO
GOOGLE_CLIENT_SECRET ❌ FALTANDO
```

#### Env Vars **Necessárias para Asaas:**
```
ASAAS_API_KEY        ❌ FALTANDO
ASAAS_WEBHOOK_TOKEN  ❌ FALTANDO
ASAAS_SANDBOX        ⚠️ Opcional (default: false para produção)
```

#### Env Vars **Opcionais:**
```
APP_URL              (force explicit base URL instead of detecting)
PUBLIC_BASE_URL      (alternative to APP_URL for /api/health response)
NODE_ENV             (production|development)
PORT                 (default: 5000, Cloud Run usa 8080)
```

---

### 1.7 Planos de Asaas (Valores Reais do Código)

**Arquivo:** `server/storage.ts` (linha 3528)

```typescript
const plans = [
  {
    code: "monthly",
    name: "Mensal",
    priceCents: 2990,        // R$ 29,90
    durationDays: 30,
    discountPercent: 0
  },
  {
    code: "semiannual",
    name: "Semestral",
    priceCents: 14990,        // R$ 149,90 ✅
    originalPriceCents: 17940, // Preço original R$ 179,40
    durationDays: 180,
    discountPercent: 17      // 17% desconto
  },
  {
    code: "annual",
    name: "Anual",
    priceCents: 27990,        // R$ 279,90 ✅
    originalPriceCents: 35880, // Preço original R$ 358,80
    durationDays: 365,
    discountPercent: 22      // 22% desconto
  }
];
```

**Análise:**
- ✅ Mensal: R$ 29,90/mês
- ✅ Semestral: R$ 149,90 (6 meses = 17% off vs. 6×R$29,90)
- ✅ Anual: R$ 279,90 (12 meses = 22% off vs. 12×R$29,90)

---

### 1.8 Tabelas de Banco de Dados

**Arquivo:** `shared/models/auth.ts` + `shared/schema.ts`

```
users
├─ id (UUID)
├─ email (unique)
├─ firstName, lastName
├─ profileImageUrl
├─ authProvider (email|google|apple)
├─ role (user|admin)
├─ status (pending|active|blocked)
├─ subscriptionExpiresAt (timestamp)
└─ createdAt, updatedAt

authIdentities
├─ id
├─ userId → users.id
├─ provider (google|email|apple)
├─ providerUserId (Google sub)
├─ email
└─ unique(provider, providerUserId)

billingPlans
├─ id
├─ code (monthly|semiannual|annual)
├─ name, description
├─ priceCents
├─ durationDays
├─ discountPercent
└─ displayOrder

billingOrders
├─ id
├─ userId → users.id
├─ planCode
├─ status (pending|paid|failed)
├─ asaasPaymentId
├─ paidAt
└─ couponCode (opcional)

subscriptions
├─ id
├─ userId → users.id
├─ planId → billingPlans.id
├─ status (active|inactive|overdue)
├─ asaasSubscriptionId
└─ expiresAt

promoCoupons
├─ id
├─ code (UNIQUE)
├─ type (percent|fixed)
├─ value (10 ou 1000 para R$10)
├─ maxRedemptions
├─ currentUses
├─ expiresAt
└─ isActive

couponUsages
├─ id
├─ couponId → promoCoupons.id
├─ userId → users.id
├─ subscriptionId
└─ usedAt

webhookEvents (idempotência)
├─ id
├─ eventType (PAYMENT_CONFIRMED, etc.)
├─ eventKey (unique, para dedup)
├─ rawPayload (JSON)
├─ processingStatus (pending|processed)
└─ createdAt
```

---

### 1.9 Ordem Confirmada de Rotas (Server/index.ts)

```typescript
// PASSO 1: Middleware global
app.use(express.json())
app.use(express.urlencoded())
app.use(CORS middleware)

// PASSO 2: Health checks
app.get("/health", ...) ✅
app.get("/api/health", ...) ✅

// PASSO 3: Rotas API (registerRoutes)
registerIndependentAuthRoutes(app)     // /api/auth/login, /api/auth/register
registerAuthRoutes(app)                // /api/auth/... (session-based)
registerGoogleAuthRoutes(app)          // ✅ /api/auth/google/start/callback
registerBillingRoutes(app)             // ✅ /api/billing/..., /api/webhooks/asaas
registerChatRoutes(app)                // /api/chat/...
registerImageRoutes(app)               // /api/upload/...
registerAiRoutes(app)                  // /api/ai/...
// ... todas as outras rotas

// PASSO 4: Arquivos estáticos + SPA
serveStatic(app)
  ├─ express.static(distPath)     // .js, .css, assets
  └─ app.use("*", ...)            // catch-all para index.html

// PASSO 5: Error handler
app.use((err, req, res, next) => ...)
```

✅ **Ordem confirmada:** `/api/*` antes de `serveStatic()` ✓

---

## PASSO 2 — O QUE CADASTRAR NO GOOGLE OAUTH (VALORES EXATOS)

### 2.1 URLs para Cadastrar

**Em Produção:**

| Campo | Valor |
|-------|-------|
| **Authorized JavaScript origins** | `https://appsalvaplantao.com.br` |
| **Authorized redirect URIs** | `https://appsalvaplantao.com.br/api/auth/google/callback` |

**Em Desenvolvimento (Local):**

| Campo | Valor |
|-------|-------|
| **Authorized JavaScript origins** | `http://localhost:5000` |
| **Authorized redirect URIs** | `http://localhost:5000/api/auth/google/callback` |

### 2.2 Escopos

```
openid email profile
```

**O que solicita:**
- `openid`: Autenticação OpenID Connect
- `email`: Email do usuário
- `profile`: Nome, foto (name, picture)

### 2.3 Fluxo de Segurança

- **PKCE:** ✅ Ativado (S256)
- **State:** ✅ Validado
- **Nonce:** ✅ Validado
- **Client Secret:** ✅ Usado server-side (nunca exposto)
- **Token armazenado:** JWT em cookie HttpOnly + Secure

### 2.4 Passos para Configurar no Google Cloud Console

1. Ir para [Google Cloud Console](https://console.cloud.google.com)
2. Criar novo projeto (ou usar existente)
3. Ativar "Google+ API" (ou buscar por "OAuth")
4. Ir para "Credentials" → "Create Credentials" → "OAuth client ID"
5. Tipo: **Web application**
6. Adicionar em "Authorized JavaScript origins":
   - `https://appsalvaplantao.com.br` (produção)
   - `http://localhost:5000` (desenvolvimento)
7. Adicionar em "Authorized redirect URIs":
   - `https://appsalvaplantao.com.br/api/auth/google/callback` (produção)
   - `http://localhost:5000/api/auth/google/callback` (desenvolvimento)
8. Copiar **Client ID** e **Client Secret**

---

## PASSO 3 — ASAAS (ASSINATURAS + CUPONS + WEBHOOK)

### 3.1 Configuração de Planos

**Já implementado no código:**

| Plano | Preço | Duração | Desconto |
|-------|-------|---------|----------|
| Mensal | R$ 29,90 | 30 dias | 0% |
| Semestral | R$ 149,90 | 180 dias | 17% off (vs. 6×29,90) |
| Anual | R$ 279,90 | 365 dias | 22% off (vs. 12×29,90) |

✅ **Já seeded no banco na inicialização do app**

### 3.2 Fluxo de Assinatura

```
1. User escolhe plano (mensal/semestral/anual)
2. POST /api/billing/subscribe com { planCode, couponCode? }
3. Backend cria billingOrder com status="pending"
4. Backend chama Asaas API para criar payment link
5. User é redirecionado para link de pagamento
6. User paga no Asaas
7. Asaas envia webhook → POST /api/webhooks/asaas
8. Backend:
   - Valida webhook token
   - Marca billingOrder como "paid"
   - Atualiza users.subscriptionExpiresAt
   - Atualiza subscriptions.status = "active"
9. User agora tem acesso completo
```

### 3.3 Cupons

**Implementado em:**
- Table: `promo_coupons` + `coupon_usages`
- Endpoints:
  - `GET /api/promo-coupons` (admin only)
  - `POST /api/promo-coupons` (criar - admin)
  - `GET /api/promo-coupons/validate/:code` (validar)
  - `POST /api/admin/users/:id/coupon` (aplicar a user)

**Exemplos:**

```typescript
// Criar cupom (admin)
POST /api/promo-coupons
{
  "code": "PROMO10",
  "type": "percent",
  "value": 10,
  "maxRedemptions": 100,
  "expiresAt": "2026-12-31T23:59:59Z"
}

// Validar cupom (user)
GET /api/promo-coupons/validate/PROMO10
→ {
    "valid": true,
    "type": "percent",
    "value": 10,
    "remainingUses": 50,
    "expiresAt": "2026-12-31T23:59:59Z"
  }

// Aplicar cupom ao checkout
POST /api/billing/subscribe
{
  "planCode": "monthly",
  "couponCode": "PROMO10"
}
```

### 3.4 Webhook Asaas

**Endpoint:** `POST /api/webhooks/asaas`

**Headers esperados:**
```
x-asaas-webhook-token: <seu_webhook_token>
```

**Eventos tratados:**
- `PAYMENT_CONFIRMED` → Status "paid"
- `PAYMENT_RECEIVED` → Status "paid"
- `PAYMENT_UPDATED` → Atualiza status conforme payload
- `PAYMENT_OVERDUE` → Status "overdue"
- `PAYMENT_DELETED` / `PAYMENT_REFUNDED` → Status "refunded"

**Idempotência:** Usa `eventKey` = `event:payment.id:externalReference` para evitar processar 2x

---

## PASSO 4 — ENV VARS NECESSÁRIAS (LISTA COMPLETA)

### 4.1 Já Configuradas (Cloud Run)

```bash
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=<seu_secret>
JWT_REFRESH_SECRET=<seu_refresh_secret>
BUILD_SHA=<commit_hash>
BUILD_TIME=<timestamp>
```

### 4.2 **OBRIGATÓRIAS para Google OAuth**

```bash
GOOGLE_CLIENT_ID=<seu_client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<seu_client_secret>
```

### 4.3 **OBRIGATÓRIAS para Asaas**

```bash
ASAAS_API_KEY=<sua_api_key_asaas>
ASAAS_WEBHOOK_TOKEN=<seu_webhook_token_secreto>
```

### 4.4 Opcionais

```bash
APP_URL=https://appsalvaplantao.com.br        # Force base URL
PUBLIC_BASE_URL=https://appsalvaplantao.com.br # Para /api/health response
ASAAS_SANDBOX=false                             # true=sandbox, false=production
NODE_ENV=production                             # ou development
PORT=8080                                       # Cloud Run default
```

---

## PASSO 5 — COMANDOS GCLOUD (PRONTOS PARA COPIAR/COLAR)

### 5.1 Configurar Env Vars no Cloud Run

**Substitua os valores entre `< >`:**

```powershell
# PowerShell
$projectId = "salva-plantao-prod1"
$region = "southamerica-east1"
$service = "salva-plantao-prod"

# Google OAuth
$googleClientId = "<seu_client_id.apps.googleusercontent.com>"
$googleClientSecret = "<seu_client_secret>"

# Asaas
$asaasApiKey = "<sua_api_key>"
$asaasWebhookToken = "<seu_webhook_token>"

# Deploy com env vars
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
```

### 5.2 Verificar Env Vars Configuradas

```powershell
gcloud run services describe salva-plantao-prod `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --format="table(spec.template.spec.containers[0].env[].name)"
```

### 5.3 Forçar Nova Revisão (sem cache)

```powershell
gcloud run deploy salva-plantao-prod `
  --source . `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --allow-unauthenticated `
  --memory 512Mi `
  --cpu 1 `
  --no-cache
```

### 5.4 Ver Logs em Tempo Real

```powershell
gcloud run logs read salva-plantao-prod `
  --region southamerica-east1 `
  --project salva-plantao-prod1 `
  --limit 50 `
  --follow
```

### 5.5 Ver Logs de Erro Específicos

```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=salva-plantao-prod AND severity=ERROR" `
  --limit 20 `
  --project salva-plantao-prod1 `
  --format json
```

---

## PASSO 6 — COMO TESTAR (URLS E CURLS)

### 6.1 Teste 1: /api/health (Build Metadata)

```bash
curl -i https://appsalvaplantao.com.br/api/health
```

**Resposta esperada (200 OK):**
```json
{
  "appName": "Salva Plantão",
  "version": "1.0.0",
  "gitCommit": "1a70af4f...",
  "buildTime": "2026-02-01T18:00:50Z",
  "serverTime": "2026-02-01T18:10:00.000Z",
  "apiBaseUrl": "https://appsalvaplantao.com.br"
}
```

**Validação:**
- ✅ Status 200
- ✅ Content-Type application/json
- ✅ gitCommit é um hash válido
- ✅ buildTime é timestamp ISO

---

### 6.2 Teste 2: Google OAuth Start

**URL no navegador:**
```
https://appsalvaplantao.com.br/api/auth/google/start
```

**O que acontece:**
1. ✅ Redireciona para `accounts.google.com`
2. ✅ Página de login Google aparece
3. ✅ Após login, redireciona para `/auth/callback?token=JWT`

**Validação:**
- [ ] Redireciona para Google
- [ ] Login Google funciona
- [ ] Retorna com token JWT
- [ ] Usuário criado no banco (verificar: `SELECT * FROM users WHERE email='...'`)

---

### 6.3 Teste 3: /api/auth/me (Get User)

```bash
# Assumindo que você tem um JWT em $TOKEN (obtido após login)
curl -i -H "Authorization: Bearer $TOKEN" \
  https://appsalvaplantao.com.br/api/auth/me
```

**Resposta esperada (200 OK):**
```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "status": "pending"
}
```

**Validação:**
- ✅ Status 200
- ✅ userId é UUID
- ✅ email corresponde ao Google
- ✅ status é "pending" (até pagar) ou "active" (após pagamento)

---

### 6.4 Teste 4: Webhook Asaas (Mock)

```bash
curl -X POST https://appsalvaplantao.com.br/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "x-asaas-webhook-token: <seu_webhook_token>" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "asaas-pay-123",
      "externalReference": "uuid|order-id",
      "status": "paid"
    }
  }'
```

**Resposta esperada (200 OK):**
```json
{
  "received": true
}
```

**Validação no banco:**
```sql
-- Verificar se order foi marcada como paid
SELECT id, status, paidAt FROM billing_orders 
WHERE id = order-id;

-- Verificar se user.subscriptionExpiresAt foi atualizado
SELECT id, subscriptionExpiresAt FROM users 
WHERE id = 'uuid';
```

---

### 6.5 Teste 5: Usuário Inadimplente (Gating)

**Setup:**
1. Crie um usuário com `subscriptionExpiresAt` no passado
2. Tente acessar rota protegida que checa `checkActive`

```bash
# Simular user com assinatura expirada
curl -i -H "Authorization: Bearer $TOKEN" \
  https://appsalvaplantao.com.br/api/shifts/list
```

**Resposta esperada (403 Forbidden):**
```json
{
  "message": "Assinatura expirada",
  "status": "active",
  "subscriptionExpired": true,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Rotas que aplicam gating:**
- Qualquer rota que chamar `checkActive` middleware
- Exemplo em `server/routes.ts`: prescriptions, shifts, etc.

---

### 6.6 Teste 6: Cupom (Admin)

**Criar cupom (admin):**
```bash
curl -X POST https://appsalvaplantao.com.br/api/promo-coupons \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TESTE10",
    "type": "percent",
    "value": 10,
    "maxRedemptions": 100,
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

**Validar cupom (user):**
```bash
curl -i https://appsalvaplantao.com.br/api/promo-coupons/validate/TESTE10
```

**Resposta (200 OK):**
```json
{
  "valid": true,
  "code": "TESTE10",
  "type": "percent",
  "value": 10,
  "remainingUses": 100,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

---

## RESUMO EXECUTIVO

### ✅ O Que Já Existe

| Componente | Status | Arquivo |
|-----------|--------|---------|
| Google OAuth (rotas) | ✅ Implementado | `server/auth/googleAuth.ts` |
| /api/auth/me | ✅ Implementado | `server/auth/independentAuth.ts` |
| /api/auth/logout | ✅ Implementado | `server/auth/independentAuth.ts` |
| Webhook Asaas | ✅ Implementado | `server/auth/billingRoutes.ts` |
| Cupons (CRUD + tracking) | ✅ Implementado | `server/routes.ts` + schema |
| Gating (checkActive) | ✅ Implementado | `server/routes.ts` |
| Tabelas no banco | ✅ Criadas | `shared/models/auth.ts` |
| Planos de billing | ✅ Seeded | `server/storage.ts` |

### ❌ O Que Falta

| Item | Ação |
|------|------|
| GOOGLE_CLIENT_ID | Configurar via Google Cloud Console |
| GOOGLE_CLIENT_SECRET | Configurar via Google Cloud Console |
| ASAAS_API_KEY | Obter no painel Asaas |
| ASAAS_WEBHOOK_TOKEN | Definir token secreto + registrar webhook em Asaas |
| Deploy com env vars | Executar comando gcloud run deploy |
| Testar fluxo completo | Seguir seção "COMO TESTAR" |

---

**Documento gerado:** 2026-02-01T18:30:00Z  
**Status da Implementação:** 80% (code + config = 100%)  
**Próximo Passo:** Configurar credenciais no Google + Asaas + Deploy
