# 🚀 ATIVAÇÃO RÁPIDA DO BANCO (1 MINUTO)

## ✅ Opção 1: Neon.tech (RECOMENDADO - Gratuito)

### 📋 Passos (90 segundos):

```powershell
# 1. Acesse https://console.neon.tech (abrir em navegador)
# 2. Clique "Sign up" → Crie conta com email
# 3. Crie novo projeto → Copie ConnectionString

# 4. VOLTA AQUI NO TERMINAL e cole:
$dbUrl = "postgresql://seu_user:sua_senha@ep-xyz.neon.tech/salva_plantao"

# 5. Atualize .env:
(Get-Content .env) -replace 'DATABASE_URL=.*', "DATABASE_URL=$dbUrl" | Set-Content .env

# 6. Execute migrations:
npm run db:push

# 7. Inicie servidor:
npm run dev

# 8. Teste em novo terminal:
curl http://localhost:5000/health
```

**Resultado**: ✅ App rodando em `http://localhost:5000`

---

## ✅ Opção 2: Render.com (Backup)

Se Neon.tech não funcionar:

```powershell
# 1. Acesse https://render.com
# 2. New → PostgreSQL → Crie banco
# 3. Copie "External Database URL"
# 4. Cole em .env
# 5. npm run db:push
# 6. npm run dev
```

---

## ⚠️ Teste Sem Banco (Offline)

Se quiser testar AGORA sem banco:

```powershell
# Gere uma DATABASE_URL fake para dev:
$fakeDb = "postgresql://dev:dev@fake.test/dev?sslmode=disable"
(Get-Content .env) -replace 'DATABASE_URL=.*', "DATABASE_URL=$fakeDb" | Set-Content .env

npm run dev
# App vai iniciar, mas sem persistência
```

---

## 🔍 Status Atual

```
✅ TypeScript: OK (npm run check = 0 errors)
✅ Build: OK (npm run build sucessful)
✅ Dependências: OK (npm install ok = 566 packages)
❌ Database: AGUARDANDO CONFIGURAÇÃO
❌ Server: Parado (esperando DATABASE_URL válida)
```

---

## 📝 PRÓXIMOS PASSOS

1. **Escolha uma opção acima** (Neon ou Render)
2. **Configure DATABASE_URL em .env**
3. **Execute `npm run db:push`** (cria tabelas)
4. **Execute `npm run dev`** (inicia servidor)
5. **Abra `http://localhost:5000`** em browser

**Tempo total**: ~2-3 minutos ⏱️

---

## 🆘 Problemas?

- **Banco não conecta**: Verifique DATABASE_URL em .env
- **Migration falhou**: Execute novamente `npm run db:push`
- **Porta 5000 ocupada**: Mude em .env ou feche outro processo
- **WebSocket error**: Normal em primeira execução, recarregue página

---

## 📞 Support

Veja documentação completa em:
- [DATABASE_URL_SETUP.md](../DATABASE_URL_SETUP.md)
- [RENDER_SETUP.md](../RENDER_SETUP.md)
- [PRODUCTION_SETUP.md](../PRODUCTION_SETUP.md)
