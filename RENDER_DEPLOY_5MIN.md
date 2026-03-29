# 🚀 RENDER DEPLOY EM 5 MINUTOS - GUIA DIRETO

> Seu app SALVA PLANTÃO está 100% pronto para deploy! Este é o guia mais rápido.

---

## ✅ Status Pré-Deploy

```
✅ Build:          Production-ready (validado)
✅ TypeScript:     0 erros
✅ Git:            Clean (commitado)
✅ Artifacts:      Verificados
✅ Config:         Pronto

Próximo: Deploy em Render (5 min)
```

---

## 📋 5 Passos para Deploy

### 1️⃣ Abra Render.com (1 min)

```
1. Vá para: https://render.com
2. Clique em "Get Started" ou "Sign Up"
3. Login com GitHub (ou crie conta)
4. Autorize acesso ao seu repositório
```

### 2️⃣ Crie Web Service (1 min)

```
1. No dashboard, clique em "+ New"
2. Selecione "Web Service"
3. Procure por: "SALVA-PLANTAO-1"
4. Selecione e conecte
```

### 3️⃣ Configure Build & Start (1 min)

```
Name:            salva-plantao
Runtime:         Node
Build Command:   npm ci && npm run build
Start Command:   npm run start
Node Version:    18
```

### 4️⃣ Adicione Secrets (1 min)

Na aba "Environment", adicione:

```
NODE_ENV          = production
PORT              = 10000
JWT_SECRET        = <qualquer coisa aleatória aqui>
JWT_REFRESH_SECRET= <outra coisa aleatória aqui>
DATABASE_URL      = postgresql://user:pass@host:5432/db
```

**⚠️ DATABASE_URL**: Você precisa de um PostgreSQL!  
Veja abaixo como criar...

### 5️⃣ Crie Database PostgreSQL (1 min)

```
1. Na página do seu Web Service em Render
2. Vá para aba "Environment"
3. Abaixo de Environment Variables, clique em "+ Add PostgreSQL"
4. Render vai criar automaticamente
5. DATABASE_URL será injetado sozinho ✅
```

---

## 🎬 Execute Deploy

```
Clique no botão "Deploy"
Aguarde 2-3 minutos
Veja os logs carregarem
Quando ficar verde: ✅ PRONTO!
```

---

## ✨ Após Deploy Ficar Verde

### 1. Teste Health

```
Abra no navegador:
https://seu-app.render.com/health

Deve retornar 200 OK com JSON
```

### 2. Teste Frontend

```
Abra:
https://seu-app.render.com

Deve carregarHomepage com botões Login/SignUp
```

### 3. Teste Login

```
1. Clique em "Sign Up"
2. Preencha email e senha
3. Clique "Criar Conta"
4. Deve criar usuario sem erros
5. Clique "Login"
6. Deve entrar no dashboard
```

### 4. Teste Dados

```
1. Crie algo na app (ex: Prescrição)
2. Recarregue a página (F5)
3. Dados ainda aparecem?
   ✅ SIM = Database funcionando!
   ❌ NÃO = Database com problema
```

---

## 🐛 Erros Comuns & Soluções

### Erro: 502 Bad Gateway

```
Causa: DATABASE_URL inválido

Solução:
1. Verifique se PostgreSQL foi criado
2. Copie a DATABASE_URL automática (Render injeta)
3. Se estiver manual, check User/Pass/Host
4. Redeploy (clique "Redeploy latest commit")
```

### Erro: Build Failed

```
Causa: npm run build falha

Solução:
1. Localmente: npm run build (testa)
2. Se falhar local, fix primeiro
3. Git commit e push
4. Render vai pegar automaticamente
5. Redeploy
```

### Erro: Cannot GET /

```
Causa: Frontend não compilou

Solução:
1. Verifique logs (Render Dashboard → Logs)
2. Se vê "Donebuilding", mas erro 404
3. Check start command: npm run start (correto?)
4. Redeploy
```

### Erro: Login não funciona

```
Causa: JWT_SECRET não configurado

Solução:
1. Va para Environment Variables
2. Confirme JWT_SECRET existe e não está vazio
3. Redeploy (deploy > Redeploy latest commit)
```

---

## 📊 Seu App Está Em Produção!

Quando tudo passar:

```
✅ https://seu-app.render.com              Acesso público
✅ Login/Signup funciona
✅ Dados salvam
✅ Sem erros 500
✅ WebSocket pronto
✅ Database conectado

🎉 APP 100% EM PRODUÇÃO!
```

---

## 🔗 Seu URL

Depois de deploy:

```
Seu app está em:
https://seu-app-name.render.com

Você pode:
- Compartilhar este link
- Acessar de qualquer lugar
- Usar em produção
```

---

## 💾 Próximas Etapas (Opcionais)

### 1. Domínio Customizado
```
Render Dashboard → Settings → Custom Domain
Aponte seu domínio (ex: meu.app.com.br)
```

### 2. OAuth Google
```
1. Google Cloud Console
2. Create OAuth credentials
3. Authorized redirect URI:
   https://seu-app.render.com/api/auth/google/callback
4. Copie Client ID e Secret
5. Adicione em Environment Variables:
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
6. Redeploy
```

### 3. Email/Magic Links
```
1. Escolha: SendGrid, Resend, ou Gmail
2. Gere API key
3. Adicione em Environment Variables
4. Redeploy
```

---

## 📈 Monitoramento

Render Dashboard tem:

```
- Memory/CPU usage
- Request metrics
- Logs em real-time
- Error tracking
```

Monitore para garantir saúde da app.

---

## 🎓 Resumo Rápido

| Passo | O quê | Tempo |
|-------|-------|-------|
| 1 | Render.com + GitHub | 1 min |
| 2 | Create Web Service | 1 min |
| 3 | Configure Build/Start | 1 min |
| 4 | Add Environment Vars | 1 min |
| 5 | Create PostgreSQL | 1 min |
| — | **Aguarde Deploy** | **2-3 min** |
| 6 | Teste endpoints | 2 min |
| **Total** | | **~12 min** |

---

## ✅ Checklist Antes de Deploy

- [ ] Leu este guia
- [ ] Acesso Render.com pronto
- [ ] GitHub autenticado
- [ ] App commitado (git clean)
- [ ] Pronto para clicar Deploy

---

## 🚀 PRÓXIMO PASSO

→ Abra: **https://render.com**

→ Clique em "+ New" → "Web Service"

→ Selecione seu repositório **SALVA-PLANTAO-1**

→ Siga os 5 passos acima

→ 🎉 **APP EM PRODUÇÃO!**

---

**Estimado de tempo total: 12 minutos até app estar online**

Qualquer dúvida, verifique [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) para mais detalhes.

---

**Status**: 🟢 **PRONTO PARA DEPLOY**  
**Data**: 2026-03-29  
**Build**: ✅ Validado
