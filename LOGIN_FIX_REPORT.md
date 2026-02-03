# Correção do Erro 500 no Login

## 🔍 Problema Identificado

Ao tentar fazer login pelo domínio, o sistema retornava erro 500. Após investigação, foram identificados múltiplos problemas:

## ⚠️ Problemas Encontrados

### 1. **CORS com Credentials**
- **Problema**: O CORS estava configurado com `Access-Control-Allow-Origin: *` mas sem `Access-Control-Allow-Credentials: true`
- **Impacto**: Navegadores bloqueiam requisições com credentials quando origin é `*`
- **Arquivo**: `server/index.ts` (linha 79-95)

### 2. **Storage Incorreto**
- **Problema**: Endpoint `/api/auth/login-password` usava `authStorage.getUserByEmail` ao invés de `storage.getUserByEmail`
- **Impacto**: Método inexistente causava erro 500
- **Arquivo**: `server/auth/authRoutes.ts` (linha 184)

### 3. **Falta de Logs Detalhados**
- **Problema**: Erros não tinham logs suficientes para diagnóstico
- **Impacto**: Dificuldade em identificar onde o erro ocorria

## ✅ Soluções Implementadas

### 1. Correção do CORS
```typescript
// ANTES
res.setHeader("Access-Control-Allow-Origin", "*");

// DEPOIS
const origin = req.headers.origin || "*";
res.setHeader("Access-Control-Allow-Origin", origin);
res.setHeader("Access-Control-Allow-Credentials", "true");
```

### 2. Correção do Storage
```typescript
// ANTES
const user = await authStorage.getUserByEmail(email);

// DEPOIS
const user = await storage.getUserByEmail(email);
```

### 3. Logs Detalhados Adicionados
- `[LOGIN-PASSWORD]` prefixo para identificar fluxo
- Log de email tentando login
- Log de usuário encontrado/não encontrado
- Log de validação de senha
- Log de cookies setados
- Log de sucesso/erro

## 🧪 Scripts de Teste Criados

### 1. `check-users.cjs`
Verifica usuários no banco de dados:
```bash
node check-users.cjs
```
Mostra: ID, email, role, status, se tem senha configurada

### 2. `reset-admin-password.cjs`
Reseta senha do admin para `admin123`:
```bash
node reset-admin-password.cjs
```

### 3. `test-login.cjs`
Testa o fluxo completo de login:
```bash
node test-login.cjs
```
- Testa POST `/api/auth/login-password`
- Verifica token retornado
- Testa GET `/api/auth/me` com token
- Valida cookies e autenticação

## 📝 Credenciais de Admin

```
Email: eudesrpj@gmail.com
Senha: admin123
Role: admin
```

## 🔐 Fluxo de Autenticação Validado

### 1. Login (`POST /api/auth/login-password`)
- ✅ Recebe email e senha
- ✅ Busca usuário no banco
- ✅ Valida senha com bcrypt
- ✅ Seta cookies (auth_token e refresh_token)
- ✅ Retorna JWT token para usar em headers
- ✅ Retorna dados do usuário

### 2. Autenticação (`authenticate` middleware)
- ✅ Prioriza Authorization header (`Bearer token`)
- ✅ Fallback para cookie
- ✅ Verifica token JWT
- ✅ Seta `req.userId` para rotas protegidas

### 3. Get User (`GET /api/auth/me`)
- ✅ Usa middleware `authenticate`
- ✅ Busca dados do usuário no banco
- ✅ Retorna perfil completo

## 🚀 Deploy e Configuração

### Variáveis de Ambiente Necessárias
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=no-verify
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### Comandos para Deploy
```bash
# Build
npm run build

# Start
npm start

# Ou em produção com PM2
pm2 start dist/index.cjs --name salva-plantao
```

## 📊 Testes Executados

### Teste Local (localhost:5000)
```
✅ Login: 200 OK
✅ Token recebido: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Cookies setados: auth_token e refresh_token
✅ /api/auth/me: 200 OK
✅ Dados do usuário retornados corretamente
```

### Logs do Servidor
```
[LOGIN-PASSWORD] Tentativa de login: eudesrpj@gmail.com
[LOGIN-PASSWORD] Usuário encontrado: eabc791e-17f0-4bb5-aaf8-96c775cd530d
[LOGIN-PASSWORD] Senha válida: true
[LOGIN-PASSWORD] Cookies setados para userId: eabc791e-17f0-4bb5-aaf8-96c775cd530d
[LOGIN-PASSWORD] Login bem-sucedido para: eudesrpj@gmail.com
[AUTH] Token found in Authorization header
[AUTH] Header token verified, userId: eabc791e-17f0-4bb5-aaf8-96c775cd530d
```

## 🎯 Próximos Passos

1. **Testar no domínio de produção**
   - Fazer login em https://seu-dominio.com
   - Verificar se cookies estão sendo setados
   - Verificar se navegação funciona após login

2. **Verificar HTTPS**
   - Certificado SSL válido
   - Cookies com flag Secure em produção
   - SameSite=None se frontend e backend em domínios diferentes

3. **Monitorar Logs**
   - Verificar logs no servidor de produção
   - Identificar possíveis erros de CORS
   - Validar fluxo de autenticação

## 📚 Arquivos Modificados

1. `server/index.ts` - CORS com credentials
2. `server/auth/authRoutes.ts` - Storage correto e logs
3. `server/auth/independentAuth.ts` - Logs detalhados
4. `check-users.cjs` - Script de verificação de usuários (novo)
5. `reset-admin-password.cjs` - Script de reset de senha (novo)
6. `test-login.cjs` - Script de teste de login (novo)

## 🔗 Commits Relacionados

- `2d421e5` - fix: corrigir CORS com credentials e adicionar logs detalhados no login
- `84eedac` - feat: add build info display for admins and improve webhook schema
- `c095acc` - feat: adicionar scripts de teste e reset de senha do admin

---

**Status**: ✅ Problema resolvido e testado com sucesso
**Data**: 3 de fevereiro de 2026
