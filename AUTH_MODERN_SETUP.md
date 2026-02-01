# Auth Moderno - Guia de Configuração

Este documento descreve como configurar **OAuth Google** e **Magic Link via Email (SMTP)** no Salva Plantão.

## Status Atual

✅ **Implementado:**
- Infraestrutura OAuth Google (`server/auth/googleAuth.ts`)
- Magic Link SMTP (`server/auth/emailService.ts`)
- Tabelas de banco de dados (`auth_identities`, `email_auth_tokens`)
- Página de login com botão Google
- Callback de autenticação

❌ **Pendente de Configuração:**
- Credenciais Google Cloud Console (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Configurações SMTP/Email (Gmail App Password ou outro provider)

---

## 1. Google OAuth Setup

### 1.1 Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client ID**
5. Escolha **Web application**
6. Adicione URIs autorizados:
   - Redirect URI: `https://appsalvaplantao.com.br/api/auth/google/callback` (produção)
   - Para dev local: `http://localhost:3000/api/auth/google/callback`

### 1.2 Configurar no Backend

```env
GOOGLE_CLIENT_ID=<seu_client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<seu_client_secret>
APP_URL=https://appsalvaplantao.com.br  # Deve ser a URL pública
```

### 1.3 Fluxo de Autenticação Google

```
1. Usuário clica em "Continuar com Google" em /login
   → Redireciona para /api/auth/google/start
   
2. Backend inicia fluxo PKCE:
   - Gera codeVerifier, codeChallenge
   - Salva em cookies (expiram em 5 min)
   - Redireciona para Google
   
3. Usuário autoriza no Google
   
4. Google redireciona para /api/auth/google/callback
   - Verifica estado (CSRF protection via state)
   - Troca code por token
   - Cria/atualiza user e auth_identity
   - Retorna token JWT
   
5. Frontend redirecionaizado para /auth/callback?token=...
   - Salva token no localStorage
   - Redireciona para /
```

---

## 2. Magic Link Email Setup

### 2.1 Usando Gmail (Recomendado)

#### Opção A: App Password (Mais Seguro)

1. Ative 2FA em sua conta Google: https://myaccount.google.com/security
2. Vá para **App passwords**: https://myaccount.google.com/apppasswords
3. Gere uma senha para "Mail" / "Windows Computer" (ou outro nome)
4. Configure no `.env`:

```env
EMAIL_FROM="Salva Plantão <seu_email@gmail.com>"
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASS=<app_password_gerada>  # 16 caracteres sem espaços
```

#### Opção B: URL SMTP Completa

```env
EMAIL_FROM="Salva Plantão <seu_email@gmail.com>"
EMAIL_SERVER=smtps://seu_email%40gmail.com:<app_password>@smtp.gmail.com:465
```

### 2.2 Usando Google Workspace (Domínio Próprio)

```env
EMAIL_FROM="Salva Plantão <seu_email@dominio.com>"
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=seu_email@dominio.com
EMAIL_SERVER_PASS=sua_senha_workspace
```

### 2.3 Fluxo de Magic Link

```
1. Usuário digita email em /login e clica "Entrar com Email"
   
2. Sistema gera:
   - Código de 6 dígitos
   - Token magic link (32 bytes hex)
   - Hash bcrypt de ambos
   - Expira em 10 minutos
   
3. Email enviado com:
   - Código: exibido no corpo
   - Link mágico: `https://app.com/auth/magic?token=...`
   
4. Opção A: Usuário clica no link
   - Verifica token
   - Cria/loga usuário
   - Redireciona para dashboard
   
5. Opção B: Usuário digita código na tela de /login
   - Sistema verifica código
   - Retorna JWT token
   - Frontend salva e redireciona
```

### 2.4 Fallback em Desenvolvimento

Se SMTP não estiver configurado (dev), o sistema faz fallback:
- Log no console com código e link
- Não envia email real
- Mensagem: "SMTP não configurado" com instrução de setup

---

## 3. Endpoints de Autenticação

### OAuth Google
- `GET /api/auth/google/start` - Inicia fluxo OAuth
- `GET /api/auth/google/callback` - Callback do Google

### Magic Link Email
- `POST /api/auth/email/request` - Solicita código/link (email)
- `POST /api/auth/email/verify-code` - Verifica código de 6 dígitos
- `GET /api/auth/email/verify-magic` - Verifica link mágico

### Utilitários
- `GET /api/auth/me` - Informações do usuário logado (requer JWT)
- `POST /api/auth/logout` - Faz logout
- `POST /api/auth/refresh` - Renova token (requer refresh token)

---

## 4. Frontend Integration

### Login Page (`client/src/pages/Login.tsx`)

✅ Já implementado:
- Botão "Continuar com Google"
- Fluxo de código por email
- Fluxo de senha (fallback)
- Tratamento de erros

### Auth Callback (`client/src/pages/AuthCallback.tsx`)

✅ Já implementado:
- Recebe token via query param
- Salva em localStorage
- Redireciona para dashboard

### Hook useAuth (`client/src/hooks/use-auth.ts`)

✅ Já implementado:
- `fetchUser()` - GET /api/auth/me
- `logout()` - POST /api/auth/logout
- Token enviado via Bearer header

---

## 5. Tabelas de Banco de Dados

### `auth_identities`
Mapeia provedores (Google, Email) para usuários

```sql
- id (PK)
- userId (FK users.id)
- provider: "google" | "email"
- providerUserId: sub do Google ou email normalizado
- email: email do usuário (opcional)
- createdAt
```

**Constraint único:** `(provider, providerUserId)` - Um Google ID ou email por identidade

### `email_auth_tokens`
Armazena códigos e tokens mágicos (10 min de validade)

```sql
- id (PK)
- email: email solicitante
- codeHash: bcrypt hash do código 6-dígitos
- tokenHash: bcrypt hash do token mágico
- expiresAt: 10 min no futuro
- usedAt: marca como consumido após verificação
- createdAt
```

---

## 6. Fluxo de Usuário Vinculado

Se um usuário Google entra com email `joao@gmail.com`, depois tenta Magic Link com o mesmo email:

1. Magic Link cria nova identidade com `provider="email"` e `providerUserId="joao@gmail.com"`
2. Sistema detecta existência de usuário com esse email
3. **Vincula automaticamente** ambas as identidades ao mesmo usuário
4. Usuário pode fazer login com qualquer um dos métodos

---

## 7. Troubleshooting

### "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados"
- [ ] Verificar se estão no `.env`
- [ ] Reiniciar o servidor
- [ ] Verificar se o Google Cloud Console gerou as credenciais

### "Código expirado ou não encontrado"
- [ ] Email pode não ter sido enviado (SMTP não configurado)
- [ ] Código pode ter expirado (10 minutos)
- [ ] Solicitar novo código

### "SMTP não configurado" (em produção)
- [ ] Configurar pelo menos um de:
  - `EMAIL_SERVER` (URL completa)
  - `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASS`
- [ ] `EMAIL_FROM` é obrigatório
- [ ] Reiniciar servidor

### "Falha ao enviar email"
- [ ] Verificar credenciais de App Password do Gmail
- [ ] Verificar se 2FA está ativado (Gmail requer)
- [ ] Logs do servidor mostram erro detalhado
- [ ] Tentar usar URL `EMAIL_SERVER` em vez de host/port separados

---

## 8. Ambiente de Produção (Google Cloud Run)

### Configurar Secrets no Secret Manager

```bash
# Google OAuth
gcloud secrets create GOOGLE_CLIENT_ID --data-file=- <<< "..."
gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=- <<< "..."

# Email
gcloud secrets create EMAIL_FROM --data-file=- <<< "..."
gcloud secrets create EMAIL_SERVER --data-file=- <<< "..."
```

### Referir em Cloud Run

No `cloudbuild.yaml` ou deploy manual:

```yaml
--set-secrets=GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest
--set-secrets=GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest
--set-secrets=EMAIL_FROM=EMAIL_FROM:latest
--set-secrets=EMAIL_SERVER=EMAIL_SERVER:latest
```

---

## 9. Checklist de Deployment

- [ ] Google Cloud Console OAuth credentials criados
- [ ] `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configurados
- [ ] Gmail App Password gerado (ou credenciais SMTP)
- [ ] `EMAIL_FROM` configurado
- [ ] `EMAIL_SERVER` ou `EMAIL_SERVER_*` configurado
- [ ] `APP_URL` aponta para domínio público correto
- [ ] JWT_SECRET e JWT_REFRESH_SECRET configurados
- [ ] DATABASE_URL configurado
- [ ] `npm run build` e `npm run check` passam sem erros
- [ ] Magic Link email recebido com sucesso (dev)
- [ ] Google OAuth redireciona corretamente (dev)
- [ ] Usuário criado automaticamente no primeiro login
- [ ] Token JWT funciona em requests subsequentes

---

## 10. Próximos Passos (Optional)

- [ ] **OAuth Apple**: Similar ao Google, usar `server/auth/appleAuth.ts` (esboço)
- [ ] **2FA**: Adicionar verificação adicional após Magic Link
- [ ] **Session Management**: Expirar tokens no frontend após período de inatividade
- [ ] **Account Linking**: UI para "Vincular Google" em /account
- [ ] **Password Reset**: Reset via Magic Link para usuários legados

---

## Referências

- [OpenID Connect Discovery](https://openid-client.js.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Nodemailer SMTP](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

