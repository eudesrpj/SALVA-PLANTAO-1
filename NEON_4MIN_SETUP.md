# ⚡ NEON.TECH EM 4 MINUTOS - Setup Agora

**Problema**: App precisa de PostgreSQL mas não está instalado  
**Solução**: Usar Neon.tech (banco PostgreSQL online - grátis!)  
**Tempo**: ~4 minutos

---

## ✅ 4 Passos (Cada um ~1 min)

### Passo 1: Ir para Neon (1 min)

```
1. Abra: https://neon.tech
2. Clique em "Sign Up"
3. Use GitHub ou email
```

### Passo 2: Criar Projeto (1 min)

```
1. Clique em "+ New Project"
2. Dê um nome: "salva-plantao"
3. Escolha região (padrão OK)
4. Clique "Create"
```

### Passo 3: Copiar Connection String (1 min)

```
1. No dashboard, vá para "Quickstart"
2. Selecione "psycopg2" ou "Node.js"
3. copie a URL (aquela que começa com postgresql://)
4. CTRL+C para copiar
```

### Passo 4: Colar no .env (1 min)

```
1. Abra: .env (na raiz do projeto)
2. Procure por: DATABASE_URL=file:./dev.db?mode=rwc
3. Substitua por: DATABASE_URL=<cole a URL aqui>
4. Salve o arquivo (CTRL+S)
5. Feche e reabra o VS Code ou terminal
```

---

## 🚀 Depois de Fazer Isso

Terminal:
```bash
npm run dev
```

Puis:
```
✅ Servidor conecta ao Neon
✅ Login funciona
✅ Dados salvam
```

---

## 📝 Exemplo de Como Fica

**Antes:**
```
DATABASE_URL=file:./dev.db?mode=rwc
```

**Depois:**
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require
```

---

## ❓ Precisa de Ajuda?

| Problema | Solução |
|----------|---------|
| Neon não abre | Tente incognito (F12 → Ctrl+Shift+P → Private) |
| Não consegue signup | Use GitHub para signup |
| URL muito longa | É normal! Copie tudo até o final |
| Still "500 error" | Reinicie: CTRL+C no terminal e npm run dev |

---

**Pronto! Vá para neon.tech agora! ⏱️ 4 minutos** ⭐
