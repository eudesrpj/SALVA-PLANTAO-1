# 🚀 DEPLOY - SALVA PLANTÃO

## Seu App Está Pronto para Produção! ✅

### Próximas Ações:

#### 1. Escolha uma plataforma:

**OPÇÃO A: RENDER.COM (Recomendado)**
- Acesse: https://render.com
- Login com GitHub
- Clique em "+ New" → "Web Service"
- Selecione repositório: SALVA-PLANTAO-1
- Configure:
  - Build: npm ci && npm run build
  - Start: npm run start
  - Node: 18
- Adicione Environment Variables:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://user:pass@host/db
  - JWT_SECRET=<seu-secret-aleatorio>
  - JWT_REFRESH_SECRET=<outro-secret-aleatorio>
- Crie PostgreSQL database (Render → "+ Create PostgreSQL")
- Clique em "Deploy"
- Aguarde 2-3 minutos
- ✅ App em produção!

**OPÇÃO B: GOOGLE CLOUD RUN**
```bash
gcloud run deploy salva-plantao \
  --source=. \
  --platform=managed \
  --region=southamerica-east1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --set-env-vars NODE_ENV=production \
  --project=SEU_PROJECT_ID
```

**OPÇÃO C: DOCKER LOCAL**
```bash
docker build -t salva-plantao .
docker run -p 5000:10000 \
  -e DATABASE_URL=postgresql://... \
  -e NODE_ENV=production \
  salva-plantao
```

#### 2. Prepare seu Database:

Escolha uma opção:

**Neon.tech (Recomendado - 4 min)**
1. Acesse: https://neon.tech
2. Sign up / Login
3. Create project
4. Copie a connection string
5. Use como DATABASE_URL

**PostgreSQL Local**
- Docker: `docker-compose up -d`
- Depois: `npm run db:push`

### Variáveis Obrigatórias:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<valor aleatório de 32+ caracteres>
JWT_REFRESH_SECRET=<valor aleatório de 32+ caracteres>
PORT=10000
```

### Variáveis Opcionais:

```
GOOGLE_CLIENT_ID=<seu-client-id>
GOOGLE_CLIENT_SECRET=<seu-secret>
EMAIL_SERVER=smtps://user@domain.com:pass@smtp.gmail.com:465
```

### Teste Pós Deploy:

```bash
# Health check
curl https://seu-app.render.com/health

# Should return:
# { "status": "ok", ... }
```

### Troubleshooting:

| Erro | Solução |
|------|---------|
| 502 Bad Gateway | DATABASE_URL incorreta |
| Build failed | npm run build local funciona? |
| App não inicia | Verifique logs no dashboard |
| Login não funciona | JWT_SECRET configurado? |

### Build Info:

- Git SHA: 114cda7
- Build Time: 2026-03-29T17:19:07.438Z
- Frontend: ~466KB gzipped
- Backend: ~1.7MB
- TypeScript Errors: 0
- Tests: 5/5 ✅

---

**Próximo**: Escolha uma plataforma acima e comece!
