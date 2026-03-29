# 🚀 GUIA DE DEPLOY - SALVA PLANTÃO
## Deploy em 10 Minutos no Render.com

---

## 📊 STATUS

```
✅ Código: Commitado e pushed para GitHub
✅ Build: Production-ready
✅ Testes: 100% passando
✅ Pronto para: DEPLOY AGORA
```

---

## 🎯 OPÇÃO 1: Render.com (RECOMENDADO - 10 min)

### Passo 1: Acessar Render
```
1. Abra: https://render.com
2. Login com GitHub
3. Autorize acesso ao repositório
```

### Passo 2: Criar Web Service
```
1. Clique em "+ New"
2. Selecione "Web Service"
3. Escolha repositório: SALVA-PLANTAO-1
4. Branch: main
5. Name: salva-plantao
```

### Passo 3: Configurar Build
```
Build Command:    npm ci && npm run build
Start Command:    npm run start
Node Version:     18 (ou 20)
```

### Passo 4: Variáveis de Ambiente
Na aba "Environment", adicione:

```
NODE_ENV = production
DATABASE_URL = postgresql://user:pass@host:port/db
JWT_SECRET = <gere um valor aleatório seguro>
JWT_REFRESH_SECRET = <gere outro valor aleatório>
APP_URL = https://seu-app-url.render.com
PUBLIC_BASE_URL = https://seu-app-url.render.com
PORT = 10000
```

**Como Gerar Secrets Fortes:**
```powershell
# PowerShell
$bytes = [System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString())
[System.Convert]::ToBase64String($bytes)
```

### Passo 5: Criar Database PostgreSQL
```
1. Na página do Web Service
2. Clique em "Create a New PostgreSQL Database"
3. Database Name: salva-plantao-db
4. Render injetará DATABASE_URL automaticamente
```

### Passo 6: Deploy
```
1. Clique em "Deploy"
2. Acompanhe os logs
3. Aguarde: ~2-3 minutos
4. Quando ver "Live", está pronto!
```

✅ **Resultado:** App em produção em `https://seu-app.render.com`

---

## 🎯 OPÇÃO 2: Google Cloud Run (Alternativa)

### Pré-requisitos
```
1. Instalar Google Cloud SDK: https://cloud.google.com/sdk
2. Criar projeto no Google Cloud Console
3. Ativar Cloud Run API
```

### Deploy
```powershell
# Executar no PowerShell
gcloud run deploy salva-plantao `
  --source=. `
  --platform=managed `
  --region=southamerica-east1 `
  --allow-unauthenticated `
  --memory=512Mi `
  --set-env-vars="NODE_ENV=production" `
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest" `
  --project=seu-projeto-id
```

---

## ✅ APÓS O DEPLOY - TESTES

Depois que o deploy terminar:

### 1️⃣ Verificar Health
```
https://seu-app.render.com/health
Deve retornar: 200 OK + JSON
```

### 2️⃣ Testar Login
```
1. Abra: https://seu-app.render.com
2. Clique em "Login" ou "Sign Up"
3. Tente criar conta
4. Tente fazer login
5. Pronto! 🎉
```

### 3️⃣ Verificar Banco
```
Se conseguir:
- Criar conta ✅
- Fazer login ✅
- Salvar dados ✅
→ Banco está funcionando!
```

---

## 🔧 VARIÁVEIS DE AMBIENTE (Reference)

| Variável | Obrigatória? | Exemplo |
|----------|-------------|---------|
| `NODE_ENV` | ✅ | `production` |
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | `base64-encoded-secret` |
| `JWT_REFRESH_SECRET` | ✅ | `base64-encoded-secret` |
| `APP_URL` | ⚠️ | `https://seu-app.render.com` |
| `PUBLIC_BASE_URL` | ⚠️ | `https://seu-app.render.com` |
| `GOOGLE_CLIENT_ID` | ❌ | Para OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Para OAuth |

---

## 🚨 TROUBLESHOOTING

| Problema | Solução |
|----------|---------|
| **Build Failed** | Verifique `npm run build` localmente primeiro |
| **Database Connection Error** | DATABASE_URL está correto? Teste localmente |
| **JWT Error** | JWT_SECRET e JWT_REFRESH_SECRET configurados? |
| **App starts but 502 error** | Verifique logs no Render dashboard |
| **Login não funciona** | Verifique DATABASE_URL (misspelled?) |

---

## 📝 Checklist Deploy

- [ ] Commit & Push realizados ✅ (já feito!)
- [ ] Render account criada
- [ ] Web Service configurado
- [ ] Environment variables adicionadas
- [ ] Database PostgreSQL criado
- [ ] Build command correto: `npm ci && npm run build`
- [ ] Start command correto: `npm run start`
- [ ] Deploy iniciado
- [ ] App respondendo em health check
- [ ] Login testado com sucesso

---

## 🎉 RESULTADO FINAL

Quando tudo estiver pronto:

```
✅ https://seu-app.render.com → Frontend carregando
✅ Login/Signup funciona
✅ Dados salvando
✅ App 100% operacional em produção
```

---

## 📞 LINKS ÚTEIS

| Link | Descrição |
|------|-----------|
| https://render.com | Plataforma de deploy |
| https://github.com/eudesrpj/SALVA-PLANTAO-1 | Seu repositório |
| https://render.com/docs | Documentação Render |

---

## 🌐 URLs
```
Seu app em produção:
https://seu-app.render.com

Health check:
https://seu-app.render.com/health

API Health:
https://seu-app.render.com/api/health
```

---

**Tempo estimado:** 10-15 minutos  
**Custo:** Grátis (Render free tier)  
**Status:** 🟢 PRONTO PARA DEPLOY

Comece pelo **Passo 1** acima!
