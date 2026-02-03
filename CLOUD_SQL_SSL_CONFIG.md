# Cloud SQL SSL Configuration

## Visão Geral

Este documento descreve como o projeto está configurado para segurança SSL/TLS com Google Cloud SQL (PostgreSQL).

## Configuração do Drizzle ORM

O Drizzle ORM + pg driver é configurado em [server/db.ts](server/db.ts) com as seguintes opções SSL:

```typescript
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: sslmode === 'require' || sslmode === 'verify-ca' 
    ? {
        rejectUnauthorized: sslmode === 'verify-ca',
        ca: caPath ? readFileSync(caPath, 'utf-8') : undefined
      }
    : false
});
```

## Modos de SSL

### 1. **Desenvolvimento Local** (sslmode=no-verify)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?sslmode=no-verify
```

**Características:**
- SSL ativado mas sem validação de certificado
- Adequado para ambientes locais
- `rejectUnauthorized: false`

### 2. **Produção** (sslmode=require)

```bash
DATABASE_URL=postgresql://user:pass@cloud.sql.host:5432/dbname?sslmode=require
```

**Características:**
- SSL obrigatório
- Validação de certificado habilitada
- `rejectUnauthorized: true`

### 3. **Produção com CA Customizado** (sslmode=verify-ca)

```bash
DATABASE_URL=postgresql://user:pass@cloud.sql.host:5432/dbname?sslmode=verify-ca
DB_CA_CERT_PATH=/path/to/ca.pem
```

**Características:**
- SSL com CA explícito do sistema ou arquivo
- Máxima segurança
- `rejectUnauthorized: true` + CA customizado

## Variáveis de Ambiente

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Connection string com sslmode |
| `DB_CA_CERT_PATH` | `/path/to/ca.pem` | Caminho para CA cert (opcional, apenas verify-ca) |

## Implementação no Código

### server/db.ts

```typescript
const DATABASE_URL = process.env.DATABASE_URL;
const sslmode = new URL(DATABASE_URL).searchParams.get('sslmode') || 'no-verify';
const caPath = process.env.DB_CA_CERT_PATH;

const ssl = sslmode === 'require' || sslmode === 'verify-ca' 
  ? {
      rejectUnauthorized: sslmode === 'verify-ca',
      ca: caPath ? readFileSync(caPath, 'utf-8') : undefined
    }
  : false;

const client = new Client({ connectionString: DATABASE_URL, ssl });
```

## Boas Práticas

✅ **Sempre use HTTPS/SSL em produção**
- Google Cloud SQL recomenda `sslmode=require` no mínimo

✅ **Nunca hardcode credenciais ou paths no código**
- Use variáveis de ambiente

✅ **Validar certificados em produção**
- `rejectUnauthorized: true` para `sslmode=verify-ca`

✅ **Testar localmente antes de deployar**
- Use sslmode=no-verify em dev, require em prod

## Troubleshooting

### Error: "certificate verify failed"

**Causa:** Certificado inválido ou expirado

**Solução:**
1. Confirme o host/porta correto
2. Atualize o certificado via Cloud SQL Console
3. Use sslmode=no-verify temporariamente (dev only)

### Error: "self signed certificate"

**Causa:** Certificado auto-assinado não reconhecido

**Solução:**
1. Obtenha o CA certificate do Cloud SQL
2. Configure `DB_CA_CERT_PATH` com o arquivo CA
3. Use `sslmode=verify-ca`

### Connection refused (local dev)

**Causa:** PostgreSQL local sem SSL

**Solução:**
1. Confirme que está usando `sslmode=no-verify` localmente
2. Ou desabilite SSL: `sslmode=disable` (não recomendado em prod)

## Google Cloud SQL Setup

Para usar Google Cloud SQL:

1. **Criar instância** na Google Cloud Console
2. **Obter Public IP** da instância
3. **Adicionar credenciais** ao DATABASE_URL
4. **Baixar Client Certificate** (se usar verify-ca):
   ```bash
   gcloud sql ssl-certs describe client-cert --instance=INSTANCE_NAME --format="value(cert)"
   ```
5. **Salvar como arquivo** e configurar `DB_CA_CERT_PATH`

## Deployment

### Replit / Render / Heroku

Configure as variáveis de ambiente:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

O sistema se auto-configurará para usar SSL com validação de certificado.

## Testes

Para testar a conexão SSL:

```bash
npm run db:push  # Executará migrations com SSL configurado
npm start        # Inicia servidor e valida conectividade
```

Se sem erros, SSL está funcionando! ✅
