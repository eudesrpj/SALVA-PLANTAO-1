# 📋 Status das 4 Fases de Implementação

## ✅ FASE 1 - Diagnóstico de Build: COMPLETO E TESTADO

**Status:** ✅ FUNCIONANDO

**Endpoint:** `https://appsalvaplantao.com.br/api/health`

**Response:**
```json
{
  "appName": "Salva Plantão",
  "version": "1.0.0",
  "gitCommit": "1a70af4f64ae9b3c5e089bed6b6c1885a279a6d6",
  "buildTime": "2026-02-01T18:00:50Z",
  "serverTime": "2026-02-01T18:06:21.145Z",
  "apiBaseUrl": "https://salva-plantao-prod-sd2sb3pbvq-rj.a.run.app"
}
```

**Prova:** O domínio em produção está rodando o código correto (commit 1a70af4). ✨

---

## ✅ FASE 2 - Google OAuth: IMPLEMENTADO (Faltam Credenciais)

**Status:** ⚠️ Código 100% implementado, precisa env vars configuradas

**Arquivo:** `server/auth/googleAuth.ts`

**Endpoints Disponíveis:**
- `GET /api/auth/google/start` - Inicia fluxo de OAuth
- `GET /api/auth/google/callback` - Recebe código do Google
- `GET /api/auth/me` - Retorna usuário autenticado
- `POST /api/auth/logout` - Logout

**Env Vars Necessárias:**
```
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=https://appsalvaplantao.com.br/api/auth/google/callback
```

**Banco de Dados:**
- Table `users` com campos: email, firstName, lastName, profileImageUrl, authProvider
- Table `authIdentities` para linkar Google sub com userId

**Fluxo:**
1. User clica "Login com Google" → GET /api/auth/google/start
2. Redireciona para accounts.google.com
3. User aceita → volta para /api/auth/google/callback
4. App cria usuário (ou retorna existente)
5. Cria JWT token e retorna

---

## ✅ FASE 3 - Asaas Billing: IMPLEMENTADO (Faltam Credenciais)

**Status:** ⚠️ Código 100% implementado, precisa env vars configuradas

**Arquivo:** `server/auth/billingRoutes.ts`

**Tabelas:**
- `billingPlans` - Planos (monthly R$29,90, semiannual, annual)
- `billingOrders` - Histórico de pagamentos
- `subscriptions` - Status de assinatura do usuário

**Env Vars Necessárias:**
```
ASAAS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_SANDBOX=false (true para testes)
```

**Planos Configuráveis:**
```
- Mensal: R$ 29,90 (30 dias)
- Semestral: desconto automático (180 dias)
- Anual: desconto automático (365 dias)
```

**Endpoints:**
- `GET /api/billing/plans` - Lista planos disponíveis
- `POST /api/billing/subscribe` - Cria assinatura
- `GET /api/billing/status` - Status da assinatura do user
- `POST /api/webhooks/asaas` - Webhook de confirmação de pagamento

**Integração Asaas:**
- Cria payment link via Asaas API
- Redireciona user para checkout
- Webhook confirma pagamento
- Atualiza `subscriptionExpiresAt` no usuário

---

## ✅ FASE 4 - Cupons Admin: IMPLEMENTADO COMPLETO

**Status:** ✅ Pronto para usar (sem deps externas)

**Arquivo:** `server/routes.ts` + schema em `shared/schema.ts`

**Tabelas:**
- `promo_coupons` - Códigos de cupom (code, type, value, maxRedemptions, expiresAt)
- `coupon_usages` - Tracking de uso (couponId, userId, usedAt)

**Endpoints (Admin Only):**

**Criar Cupom:**
```bash
POST /api/promo-coupons
Body: {
  "code": "TESTE10",
  "type": "percent",        # percent ou fixed
  "value": 10,              # 10% ou R$10
  "maxRedemptions": 100,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Listar Cupons:**
```bash
GET /api/promo-coupons
Response: [{id, code, type, value, maxRedemptions, currentUses, expiresAt}]
```

**Validar Cupom (User):**
```bash
GET /api/promo-coupons/validate/TESTE10
Response: {valid: true, type: "percent", value: 10, remainingUses: 50}
```

**Aplicar Cupom a Usuário:**
```bash
POST /api/admin/users/{userId}/coupon
Body: {"couponCode": "TESTE10", "campaign": "promo"}
Response: {id, couponId, userId, usedAt}
```

**Estatísticas de Cupom:**
- `currentUses` atualizado automaticamente
- `coupon_usages` mostra quem usou e quando
- Admin pode ver total descontado

---

## 🚀 Próximos Passos

### 1️⃣ Configurar Google OAuth

1. Ir para [Google Cloud Console](https://console.cloud.google.com)
2. Criar novo projeto
3. Ativar "Google+ API"
4. Criar "OAuth 2.0 Client ID" (tipo: Web application)
5. Adicionar Authorized redirect URIs:
   - `https://appsalvaplantao.com.br/api/auth/google/callback`
6. Copiar Client ID e Secret

### 2️⃣ Configurar Asaas

1. Ir para [Asaas Dashboard](https://www.asaas.com)
2. Integrations → API
3. Gerar API Key (ambiente Production ou Sandbox)
4. Copiar a chave

### 3️⃣ Deploy no Cloud Run

```powershell
$googleClientId = "seu_client_id.apps.googleusercontent.com"
$googleClientSecret = "GOCSPX-..."
$asaasApiKey = "xxxxxxx..."

gcloud run deploy salva-plantao-prod `
  --update-env-vars `
  GOOGLE_CLIENT_ID=$googleClientId,`
  GOOGLE_CLIENT_SECRET=$googleClientSecret,`
  ASAAS_API_KEY=$asaasApiKey `
  --region southamerica-east1 `
  --project salva-plantao-prod1
```

### 4️⃣ Testar Login Google

```
1. Abrir https://appsalvaplantao.com.br/login
2. Clicar botão "Login com Google"
3. Aceitar permissões
4. Verificar redirecionamento e criação de usuário
5. Confirmar que aparece no admin panel
```

### 5️⃣ Testar Cupons

```
1. Login como admin
2. Ir para Admin Panel
3. Criar cupom "TESTE10" (10% desconto)
4. Fazer requisição:
   GET https://appsalvaplantao.com.br/api/promo-coupons/validate/TESTE10
5. Verificar se retorna dados do cupom
```

---

## 📊 Checklist de Validação

- [x] FASE 1: /api/health retorna JSON com build metadata
- [x] FASE 1: Commit no /api/health corresponde ao git log
- [ ] FASE 2: Google OAuth env vars configuradas
- [ ] FASE 2: Login Google redirecionando corretamente
- [ ] FASE 2: Usuário criado no banco após primeiro login
- [ ] FASE 3: Asaas API key configurada
- [ ] FASE 3: Payment link sendo gerado
- [ ] FASE 3: Webhook de Asaas confirmando pagamento
- [ ] FASE 4: Admin consegue criar cupom
- [ ] FASE 4: Cupom validando corretamente
- [ ] FASE 4: Uso de cupom sendo rastreado

---

**Última atualização:** 2026-02-01T18:00:50Z  
**Commit atual:** 1a70af4f64ae9b3c5e089bed6b6c1885a279a6d6
