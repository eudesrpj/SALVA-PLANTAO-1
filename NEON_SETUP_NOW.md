# 🚀 PostgreSQL Remoto - Neon.tech (4 minutos)

## Passo 1: Criar Banco (2 min)

1. Vá para: **https://neon.tech**
2. Clique em **"Sign Up"**
3. Use email/GitHub para criar conta
4. Crie um projeto

## Passo 2: Copiar Connection String (1 min)

1. No dashboard do Neon
2. Vá para **"Connection String"**
3. Copie a URL (deve parecer assim):
```
postgresql://user:password@host/dbname
```

## Passo 3: Atualizar .env (1 min)

No arquivo `.env` do seu projeto, substitua `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://user:password@host/dbname
```

## Passo 4: Aplicar Schema (Auto)

Quando o app iniciar, vai criar todas as tabelas automaticamente!

## Resultado

✅ App conectado ao Neon  
✅ Login vai funcionar  
✅ Dados vão salvar  
✅ Tudo em 4 minutos!

---

**Alternativa**: Se preferir Local, instale PostgreSQL em: https://www.postgresql.org/download/windows/
