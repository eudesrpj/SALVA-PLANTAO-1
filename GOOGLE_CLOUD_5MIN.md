# ⚡ GOOGLE CLOUD EM 5 MIN - Passo a Passo

**Seu app vai usar Google de ponta a ponta!**

---

## 5 Passos (1 min cada)

### 1️⃣ Criar Projeto Google Cloud

```
1. Abra: https://console.cloud.google.com
2. Login com sua conta Google
3. Clique em "Select a project" (topo)
4. Clique em "+ NEW PROJECT"
5. Nome: salva-plantao
6. Clique "Create"
7. Aguarde 1 minuto
```

### 2️⃣ Criar Database PostgreSQL

```
1. Abra: https://console.cloud.google.com/sql
2. Clique em "+ CREATE INSTANCE"
3. Escolha "PostgreSQL"
4. Instance ID: salva-plantao-db
5. Em "Configuration options":
   - Versão: PostgreSQL 15
   - Tier: db-f1-micro (barato!)
   - Region: southamerica-east1 (Brasil 🇧🇷)
6. Root password: <crie uma senha segura>
7. Clique "Create"
8. Aguarde 2-3 minutos ficar "green"
```

### 3️⃣ Copiar Connection String

Na página da instância SQL:
```
1. Vá para ABA "Connections"
2. Copie o "Public IP" (algo como: 35.xxx.xxx.xxx)
3. Copie o "Connection name" (vai parecer:
   salva-plantao:southamerica-east1:salva-plantao-db)
```

### 4️⃣ Atualizar .env

Arquivo: `.env` (na raiz do projeto)

Acha essa linha:
```
DATABASE_URL=file:./dev.db?mode=rwc
```

Substitui por:
```
DATABASE_URL=postgresql://postgres:PASSWORD@IP:5432/postgres?sslmode=require
```

Onde:
- `PASSWORD` = senha que criou no passo 2️⃣
- `IP` = Public IP que copiou no passo 3️⃣

**Exemplo:**
```
DATABASE_URL=postgresql://postgres:MinhaSenh@123456@35.192.15.100:5432/postgres?sslmode=require
```

Salva! (CTRL+S)

### 5️⃣ Testar

Terminal:
```bash
npm run dev
```

Se não der erro, pronto! Login funciona! 🎉

---

## ✅ Resultado

```
✅ Database: Google Cloud SQL (PostgreSQL)
✅ Região: Brasil (southamerica-east1)
✅ Backup: Automático do Google
✅ Login: FUNCIONA!
```

---

## 🚀 Bonus: Deploy em Cloud Run (5 min)

```bash
# 1. Instale gcloud SDK:
# https://cloud.google.com/sdk/docs/install

# 2. Login:
gcloud auth login

# 3. Setup projeto:
gcloud config set project salva-plantao

# 4. Deploy:
gcloud run deploy salva-plantao \
  --source=. \
  --platform=managed \
  --region=southamerica-east1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --set-env-vars="NODE_ENV=production"

# 5. App estará em:
# https://salva-plantao-xxxxx.run.app
```

---

**Tempo total**: ~10 minutos até app 100% funcional!

**Comece agora**: https://console.cloud.google.com
