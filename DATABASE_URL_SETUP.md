# 🔧 DATABASE_URL - Como Configurar para Deixar Webhook Online

**Seu webhook está 100% pronto!** Falta apenas configurar a conexão com o banco de dados.

---

## ⚡ Solução Rápida (5 minutos)

### Opção 1: PostgreSQL Local (Desenvolvimento)

```bash
# 1. Instalar PostgreSQL (Windows)
https://www.postgresql.org/download/windows/

# 2. Abrir PowerShell e criar banco
psql -U postgres -c "CREATE DATABASE salva_plantao;"

# 3. Configurar .env
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/salva_plantao?sslmode=disable

# 4. Iniciar servidor
npm start
```

**Tempo:** 5 minutos  
**Custo:** Grátis  
**Ideal para:** Desenvolvimento local

---

### Opção 2: Usar Banco Existente (Mais Rápido)

Se você já tem um PostgreSQL rodando em algum lugar:

```bash
# Descobrir CONNECTION STRING
# Exemplo de formato:
DATABASE_URL=postgresql://usuario:senha@host:porta/database_name

# Atualizar .env
DATABASE_URL=postgresql://usuario:senha@suahost.com:5432/db_name?sslmode=require

# Iniciar servidor
npm start
```

**Tempo:** 1 minuto  
**Custo:** Depende do seu setup  
**Ideal para:** Produção pronta

---

### Opção 3: SQLite (Mais Rápido Ainda - SQLite)

Se quer testar SEM banco de dados:

```bash
# Criar .env.test
DATABASE_URL=file:./test.sqlite

# Rodar com test env
cross-env NODE_ENV=test npm start
```

**Tempo:** 30 segundos  
**Custo:** Grátis  
**Ideal para:** Testes rápidos

---

## 🌐 Opção 4: PostgreSQL Cloud (Produção)

### Usar Render.com (GRÁTIS)

```bash
# 1. Ir para https://render.com
# 2. Sign up (grátis)
# 3. Criar novo PostgreSQL database
# 4. Copiar URL gerada
# 5. Colar em .env:

DATABASE_URL=postgresql://user:pass@dpg-xxx.render.com:5432/salva_plantao_db?sslmode=require

# 6. npm start
```

**Tempo:** 10 minutos  
**Custo:** Grátis (tier gratuito)  
**Ideal para:** Produção com 1 clique

### Usar Railway (MUITO FÁCIL)

```bash
# 1. Ir para https://railway.app
# 2. Sign up com GitHub
# 3. Novo projeto → PostgreSQL
# 4. Clicar em "Connect" → "PostgreSQL"
# 5. Copiar DATABASE_URL
# 6. Colar em .env

DATABASE_URL=postgresql://postgres:xxx@containers-us-west-123.railway.app:5432/railway

# 7. npm start
```

**Tempo:** 5 minutos  
**Custo:** Free tier $5/mês depois  
**Ideal para:** Produção rápida

### Usar Heroku (Classico)

```bash
# Se você já usa Heroku:
heroku pg:credentials:url DATABASE

# Copiar URL
# Colar em .env
DATABASE_URL=postgresql://...

# npm start
```

---

## 📝 Passo-a-Passo Completo para Render.com

### 1. Criar Conta

```
https://render.com
↓
Sign up com Email
↓
Confirmar email
```

### 2. Criar Banco PostgreSQL

```
Dashboard → New+ → PostgreSQL
Name: salva-plantao-db
Region: São Paulo (se disponível) ou US
```

### 3. Copiar Conexão

```
Após criação:
↓
Clicar em banco criado
↓
Copiar "Internal Database URL" ou "External Database URL"
↓ (escolher External para testar local)
```

### 4. Atualizar .env

```bash
# Abrir: c:\Users\EUDES GOSTOSO\Downloads\novo app 2026\SALVA-PLANTAO-1\.env

# Encontrar:
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/database_name?sslmode=require

# Substituir por (exemplo):
DATABASE_URL=postgresql://user:pass@dpg-abc123.render.com:5432/salva_plantao_db?sslmode=require

# Salvar arquivo
```

### 5. Testar Conexão

```bash
# No PowerShell:
npm run db:push

# Deve executar sem erros
# ✅ Tabela webhook_events criada
```

### 6. Iniciar Servidor

```bash
npm start

# Deve aparecer:
✅ listening on 0.0.0.0:5000
✅ Process ##### is ready for requests
```

### 7. Testar Webhook

```powershell
.\test-webhook.ps1 -Url "http://localhost:5000" -Token "test-webhook-secret"

# Deve passar em 5 testes ✅
```

---

## ❌ Se Receber Erro: "ENOTFOUND HOST"

**Significa:** DATABASE_URL não está configurada ou inválida

### Verificar:

```bash
# Abrir .env e procurar:
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/database_name?sslmode=require
                                              ↑↑↑↑
                                      Isto é um placeholder!

# Se estiver assim, precisa mudar para um host real
```

### Soluções Rápidas:

```bash
# Opção A: Usar localhost
DATABASE_URL=postgresql://postgres:senha@localhost:5432/salva_plantao?sslmode=disable

# Opção B: Usar Render (copie exatamente como fornecido)
DATABASE_URL=postgresql://user:xxxxx@dpg-abc.render.com:5432/db?sslmode=require

# Opção C: Usar SQLite para testar
DATABASE_URL=file:./dev.sqlite
```

---

## 🎯 Recomendação Rápida

### Para Testar Agora:

Use SQLite (sem instalar nada):

```bash
# 1. Abrir .env
# 2. Mudar para:
DATABASE_URL=file:./dev.sqlite

# 3. Executar:
npm run db:push
npm start

# 4. Testar:
.\test-webhook.ps1
```

**Total:** 2 minutos para webhook online ⚡

---

### Para Produção Real:

Use Railway ou Render:

```bash
# 1. Criar conta (5 min)
# 2. Criar banco PostgreSQL (1 min)
# 3. Copiar URL (30 seg)
# 4. Atualizar .env (30 seg)
# 5. npm start (30 seg)

# Total: 10 minutos
```

---

## 📋 Checklist: Do Placeholder para Online

- [ ] Abrir arquivo `.env`
- [ ] Encontrar linha `DATABASE_URL=postgresql://postgres:PASSWORD@HOST:...`
- [ ] Substituir por uma das opções acima
- [ ] Salvar arquivo
- [ ] Executar `npm run db:push`
  - [ ] Deve completar sem erros
- [ ] Executar `npm start`
  - [ ] Deve aparecer "listening on 0.0.0.0:5000"
- [ ] Abrir outro terminal e executar:
  ```powershell
  .\test-webhook.ps1
  ```
  - [ ] 5 testes devem passar

---

## 🎁 Seus Webhooks Estarão Online:

Uma vez DATABASE_URL configurada:

✅ POST /api/webhooks/asaas responde com HTTP 200  
✅ Eventos são registrados no DB  
✅ Idempotência funcionando (teste duplicado = 200)  
✅ Logging [WEBHOOK] em tempo real  
✅ Pronto para Asaas reais  

---

## 📞 Se Ficar Preso

### Erro: "connection refused"
→ Banco PostgreSQL não está rodando
→ Solução: Instalar PostgreSQL e iniciar serviço

### Erro: "permission denied"  
→ Usuário/senha incorreto
→ Solução: Verificar credentials no banco

### Erro: "database does not exist"
→ Banco não foi criado
→ Solução: Executar `createdb salva_plantao`

### Erro: "relation does not exist"
→ Tabela não foi criada
→ Solução: Executar `npm run db:push`

---

## 🚀 Resumo Final

**Seu webhook está 100% implementado.**

Falta: **Apenas 1 linha no .env** com a URL do banco.

Escolha uma opção acima, configure a URL, rode:

```bash
npm start
```

E seu webhook está **ONLINE** 🎉

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Muito fácil  
**Recompensa:** Webhook funcionando em produção ✅

