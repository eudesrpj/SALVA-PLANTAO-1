# ✅ CHECKLIST PÓS-DEPLOY - SALVA PLANTÃO

Depois que seu app está online, execute esta checklist de verificação.

---

## 🟢 ANTES DE RODAR: Verificações Rápidas

### 1️⃣ Verificar Build
```powershell
# Terminal local
npm run build

# Deve terminar com:
# ✓ client built in 3.45s
# ✓ server built in 2.12s
```
- [ ] Build bem-sucedido

### 2️⃣ Verificar Deploy
```
Render: https://render.com/dashboard
GCP: gcloud run services list
```
- [ ] Deploy iniciado
- [ ] Status: "Running" ou "Active"

### 3️⃣ Verificar Environment
```
Render: Aba "Environment"
GCP: gcloud run services describe salva-plantao
```
- [ ] DATABASE_URL presente
- [ ] JWT_SECRET configurado
- [ ] JWT_REFRESH_SECRET configurado
- [ ] NODE_ENV = production

---

## 🔍 TESTES APÓS DEPLOY

### Teste 1: Health Check
```powershell
$url = "https://seu-app.render.com"  # Substitua pela sua URL

$response = Invoke-WebRequest "$url/health" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Health check OK"
} else {
    Write-Host "❌ Health check falhou"
}
```

**Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

- [ ] Health check respondendo

### Teste 2: API Health
```powershell
$response = Invoke-WebRequest "https://seu-app.render.com/api/health" -ErrorAction SilentlyContinue
$json = $response.Content | ConvertFrom-Json
$json
```

**Esperado:**
```
Name                           Value
----                           -----
database                       ok
websocket                      ready
server                         running
```

- [ ] Database conectado
- [ ] WebSocket pronto

### Teste 3: Frontend Carregando
```
1. Abra: https://seu-app.render.com
2. Aguarde carregar
3. Deve ver homepage com botões "Login" e "Sign Up"
```

- [ ] Frontend carregando
- [ ] Sem erros no console (F12)
- [ ] CSS carregado (site com cores)

### Teste 4: Autenticação
```
1. Clique em "Sign Up"
2. Preencha formulário:
   - Email: teste@example.com
   - Senha: SenhaForte123!
3. Clique em "Criar Conta"
4. Verifique: Deve criar usuário sem erros
```

- [ ] Sign up funciona
- [ ] Usuário criado no banco
- [ ] Sem erros 500

### Teste 5: Login
```
1. Clique em "Login"
2. Use email/senha do step anterior
3. Clique em "Entrar"
4. Verifique: Deve fazer login e ir para dashboard
```

- [ ] Login funciona
- [ ] JWT token em cookies
- [ ] Dashboard carrega
- [ ] Dados do usuário aparecem

### Teste 6: Funcionalidade Básica
```
1. Log in com sucesso
2. Navegue para uma página (ex: Prescriptions)
3. Tente criar/salvar dados
4. Recarregue página (F5)
5. Dados ainda aparecem? ✅ Banco funcionando!
```

- [ ] Criar dados funciona
- [ ] Dados persistem
- [ ] Nenhum erro 500

---

## 🔧 VERIFICAÇÃO DE LOGS

### Render Logs
```
1. https://render.com/dashboard
2. Clique no seu Web Service
3. Aba "Logs"
4. Procure por:
   - ✅ "Server running on port 10000"
   - ✅ "Database connected"
   - ❌ Nenhum erro 500
```

### GCP Logs
```powershell
gcloud run logs read salva-plantao --region=southamerica-east1
```

**O que procurar:**
```
✅ Bom:
- "listening on port 10000"
- "PostgreSQL connected"

❌ Ruim:
- "ECONNREFUSED"
- "Cannot find module"
- "Unexpected token"
```

- [ ] Logs sem erros críticos
- [ ] "listening on port"
- [ ] "connected" mencionado

---

## ⚠️ PROBLEMAS COMUNS

### ❌ Erro: 502 Bad Gateway
```
Causa: Build ou database com problema

Solução:
1. Verifique DATABASE_URL está correto
2. Verifique npm run build localmente funciona
3. Verifique logs para erro específico
4. Reconstrua: trigger novo deploy no dashboard
```

- [ ] Problema resolvido

### ❌ Erro: "Cannot GET /"
```
Causa: Frontend build não carregado

Solução:
1. Verifique build command: npm ci && npm run build
2. Verifique start command: npm run start
3. Reconstrua em local: npm run build
4. Commita e faça push para trigger automático
```

- [ ] Problema resolvido

### ❌ Erro: "Database connection failed"
```
Causa: DATABASE_URL inválido ou banco down

Solução:
1. Copie DATABASE_URL correto do dashboard Render/GCP
2. Paste em Environment Variables
3. Restart/redeploy
4. Se usar Neon, verifique IP whitelist
```

- [ ] Problema resolvido

### ❌ Erro: Login não funciona
```
Causa: JWT secrets não configurados

Solução:
1. Verifique JWT_SECRET existe
2. Verifique JWT_REFRESH_SECRET existe
3. Devem ser strings aleatórias, não deixe em branco
4. Restart/redeploy
```

- [ ] Problema resolvido

---

## 🎯 PRÓXIMAS AÇÕES

Depois que tudo passar na checklist:

### 1. Configurar Domínio Customizado
```
Render:
1. Dashboard → seu-app
2. Aba "Settings"
3. Custom Domain
4. Adicione seu-dominio.com
5. Configure DNS (CNAME)
```

- [ ] Domínio configurado

### 2. Configurar OAuth (Google)
```
1. Google Cloud Console
2. Create OAuth Credentials
3. Configurable para: https://seu-app.render.com/api/auth/google/callback
4. Copie Client ID e Secret
5. Adicione em Environment:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
6. Redeploy
```

- [ ] OAuth configurado

### 3. Configurar Email (Magic Links)
```
1. Escolher provedor (SendGrid, Resend, etc)
2. Gerar API key
3. Adicionar em Environment:
   - SMTP_USER
   - SMTP_PASSWORD
   - SMTP_HOST
4. Testar envio de email
5. Redeploy
```

- [ ] Email configurado

### 4. Monitoramento
```
Render:
- Aba "Metrics" no dashboard
- Monitore CPU, Memory, Requests

GCP:
gcloud run services describe salva-plantao --region=southamerica-east1
```

- [ ] Monitoramento ativo

---

## 📊 PERFORMANCE CHECK

Após deploy estar estável:

```powershell
# Teste de carga leve
$url = "https://seu-app.render.com"

1..10 | ForEach-Object {
    $start = Get-Date
    $response = Invoke-WebRequest $url -TimeoutSec 10 -ErrorAction SilentlyContinue
    $time = ((Get-Date) - $start).TotalMilliseconds
    Write-Host "Requisição $_ : ${time}ms - Status: $($response.StatusCode)"
}
```

**O que esperar:**
- [ ] Tempo de resposta < 2000ms
- [ ] Status 200 em todas
- [ ] Nenhum timeout

---

## 🎉 DEPLOY COMPLETO!

Se você passasse em:
- ✅ Todos os 6 testes
- ✅ Health checks respondendo
- ✅ Login funciona
- ✅ Dados persistem
- ✅ Logs sem erros críticos

**Então seu app está 100% em produção! 🚀**

---

## 📞 CHECKLIST FINAL

- [ ] Health check OK
- [ ] API health OK
- [ ] Frontend carrega
- [ ] Sign up funciona
- [ ] Login funciona
- [ ] Dados salvam
- [ ] Sem erros 500
- [ ] WebSocket pronto
- [ ] Domínio configurado (opcional)
- [ ] OAuth configurado (opcional)

---

**Próxima etapa:** Share com usuários finais! 🎊
