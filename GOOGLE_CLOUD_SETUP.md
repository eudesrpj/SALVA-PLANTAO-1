# 🌍 Google Cloud Setup - SQL + Deploy em 10 Minutos

Você vai usar:
- **Google Cloud SQL** → PostgreSQL gerenciado
- **Google Cloud Run** → Deploy da app

---

## ⚡ 5 Passos Rápidos

### Passo 1: Google Cloud Console (1 min)

```
1. Abra: https://console.cloud.google.com
2. Login com Google
3. Crie um projeto novo (button "+ Create Project")
4. Nome: salva-plantao
5. Aguarde criar
```

### Passo 2: Habilitar Cloud SQL (1 min)

```
1. Abra: https://console.cloud.google.com/sql
2. Clique em "+ Create Instance"
3. Escolha "PostgreSQL"
4. Instância ID: salva-plantao-db
5. Password: <gere uma segura>
6. Região: southamerica-east1 (Brasil!)
7. Clique "Create"
8. Aguarde 2-3 min
```

### Passo 3: Pegar Connection String (2 min)

Na página da instância SQL:
```
1. Clique em "Connections"
2. Vá para "Public IP"
3. Copie o IP (ex: 35.x.x.x)
4. Copie o "Connection name" (salva-plantao:southamerica-east1:salva-plantao-db)
5. Banco: postgres (default)
6. User: postgres
7. Password: <a que você criou>
```

Conexão LocalStandard (sem Cloud SQL Proxy):
```
DATABASE_URL=postgresql://postgres:PASSWORD@IP:5432/postgres?sslmode=require
```

### Passo 4: Atualizar .env (1 min)

Arquivo `.env`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_IP:5432/postgres?sslmode=require
```

### Passo 5: Testar Localmente (1 min)

```bash
npm run dev
```

Se funcionou, agora pode fazer deploy em Cloud Run!

---

## 🚀 Deploy em Cloud Run (Bônus - 5 min)

```bash
# 1. Instalar Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# 2. Fazer login
gcloud auth login

# 3. Setup projeto
gcloud config set project salva-plantao

# 4. Deploy
gcloud run deploy salva-plantao \
  --source=. \
  --platform=managed \
  --region=southamerica-east1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --set-env-vars="DATABASE_URL=postgresql://postgres:PASSWORD@IP:5432/postgres?sslmode=require" \
  --set-env-vars="NODE_ENV=production"
```

Pronto! App em produção!

---

## 📊 Resultado

```
✅ Database: Google Cloud SQL
✅ Deploy: Google Cloud Run  
✅ Região: Brasil (southamerica-east1)
✅ URL: https://salva-plantao-xxxxx.run.app
```

---

## 🔐 Segurança

⚠️ Não deixe password no `.env` em git!

Use Secret Manager:
```bash
gcloud secrets create db-url --data="postgresql://..."
gcloud run deploy ... --set-secrets=DATABASE_URL=db-url:latest
```

---

**Comece**: https://console.cloud.google.com → "+ Create Project"
