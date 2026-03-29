# ⚡ GUIA RÁPIDO - COMECE AGORA

## 🎯 3 PASSOS PARA FUNCIONAR

### 1️⃣ CONFIGURAR BANCO (escolha uma opção)

**Opção A: Usar script automático**
```powershell
node setup.mjs
# Siga as instruções no terminal
```

**Opção B: Docker (mais fácil se instalado)**
```powershell
docker-compose up -d          # Inicia PostgreSQL
# Aguarde ~10 segundos
npm run db:push                # Cria tabelas
npm run dev                     # Inicia servidor
```

**Opção C: PostgreSQL Local**
```powershell
psql -U postgres -c "CREATE DATABASE salva_plantao;"
# Edite .env e ajuste DATABASE_URL com sua senha
npm run db:push
npm run dev
```

**Opção D: Neon.tech Cloud (✅ Recomendado)**
```powershell
# 1. Acesse https://console.neon.tech
# 2. Crie conta/projeto
# 3. Copie connection string
# 4. Cole em .env como DATABASE_URL
npm run db:push
npm run dev
```

---

### 2️⃣ EXECUTAR MIGRAÇÕES

```powershell
npm run db:push
# Isso cria todas as 57 tabelas no banco
```

---

### 3️⃣ ABRIR A APP

**Terminal 1 - Backend:**
```powershell
npm run dev
# Aguarde:
#   ✅ listening on 0.0.0.0:5000
```

**Terminal 2 - Frontend (automático):**
```powershell
# Vite já inicia em paralelo
# Abra: http://localhost:5173
```

---

## ✅ PRONTO!

A app está funcional quando você vê:

```
✅ Health check: http://localhost:5000/health → 200 OK
✅ Frontend: http://localhost:5173 → UI carrega
✅ Login: Consegue fazer login
✅ Dados: Prescrições salvam e carregam
```

---

## 🆘 PROBLEMAS COMUNS

| Problema | Solução |
|----------|---------|
| `ECONNREFUSED` | Banco não está rodando → Execute docker-compose up -d |
| `ENXIO` (porta 5432 ocupada) | Outro process usa porta → docker-compose down ou mude porta |
| `Vite error` | Rode npm install novamente |
| Autenticação falha | Verifique JWT_SECRET e JWT_REFRESH_SECRET em .env |
| WebSocket não conecta | Recargregue página, verifique console.log |

---

## 📱 PARA PRODUÇÃO

Use **Render.com** ou **Railway.app**:

```powershell
# Deploy automático
# 1. Push no GitHub
# 2. Conecte repositório em Render/Railway
# 3. Configure DATABASE_URL e JWT_SECRET em environment variables
# 4. Pronto! App no ar
```

Veja: [RENDER_SETUP.md](RENDER_SETUP.md)

---

## 📚 DOCUMENTAÇÃO COMPLETA

- [ARCHITECTURE_VERIFICATION_COMPLETE.md](ARCHITECTURE_VERIFICATION_COMPLETE.md) - Detalhes técnicos
- [QUICK_DATABASE_SETUP.md](QUICK_DATABASE_SETUP.md) - Banco de dados
- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Deploy
