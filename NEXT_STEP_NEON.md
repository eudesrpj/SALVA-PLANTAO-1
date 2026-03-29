# 🚀 SOLUÇÃO RÁPIDA - Neon.tech em 4 Minutos

App fixado! ✅ Agora precisa de database para funcionar 100%.

**Melhor solução**: Use Neon.tech (banco PostgreSQL grátis)

---

##  5 Passos (1 minuto cada)

### 1️⃣ Abra Neon
https://neon.tech

### 2️⃣ Sign Up com GitHub
Clique em "Sign Up" → Escolha GitHub → Autorize

### 3️⃣ Create Project
Nome: `salva-plantao`  
Região: padrão (OK)

### 4️⃣ Copie Connection String
Na página, procure por:
```
postgresql://user:password@host/dbname
```
Copie toda essa URL!

### 5️⃣ Atualizar .env
Arquivo: `.env`  
Procure: `DATABASE_URL=file:./dev.db?mode=rwc`  
Substitua por: `DATABASE_URL=postgresql://user:password@host/dbname` (cole aqui a URL)

**Salve! (CTRL+S)**

---

## ✅ Depois

Terminal:
```bash
npm run dev
```

Tudo funciona! Login funciona!

---

**Tempo total: 4 minutos até app 100% funcional!**

⏱️ Vá para: https://neon.tech agora!
