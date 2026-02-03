# Configuração para Teste em Produção - appsalvaplantao.com.br

## ✅ Domínio Configurado
**URL Principal:** https://appsalvaplantao.com.br

## 📝 Configurações Atualizadas

### 1. Arquivo .env
```env
NODE_ENV=production
APP_URL=https://appsalvaplantao.com.br
PUBLIC_BASE_URL=https://appsalvaplantao.com.br
```

### 2. Variáveis de Ambiente Necessárias

#### ✅ Já Configuradas:
- `DATABASE_URL` - PostgreSQL (34.39.158.20)
- `JWT_SECRET` - Precisa ser atualizado em produção
- `JWT_REFRESH_SECRET` - Precisa ser atualizado em produção

#### ⚠️ A Configurar no Servidor:
```env
# Secrets de Produção (NÃO usar "change_me")
JWT_SECRET=<secret_forte_aleatorio>
JWT_REFRESH_SECRET=<secret_forte_aleatorio_diferente>

# Email (se usar envio de email)
EMAIL_SERVER=smtps://seu_email@gmail.com:app_password@smtp.gmail.com:465
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASS=<app_password>
EMAIL_FROM="Salva Plantão <seu_email@gmail.com>"

# Google OAuth (se usar)
GOOGLE_CLIENT_ID=<seu_client_id>
GOOGLE_CLIENT_SECRET=<seu_client_secret>

# Asaas (Pagamentos)
ASAAS_API_KEY=<sua_api_key_producao>
ASAAS_ENV=production
ASAAS_WEBHOOK_SECRET=<seu_webhook_secret>
```

## 🧪 Checklist de Teste

### 1. Verificar DNS
```bash
# Verificar se o domínio aponta para o servidor
nslookup appsalvaplantao.com.br
```

### 2. Verificar SSL
```bash
# Deve retornar certificado válido
curl -I https://appsalvaplantao.com.br
```

### 3. Testar Endpoints

#### Health Check
```bash
curl https://appsalvaplantao.com.br/health
curl https://appsalvaplantao.com.br/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-02-03...",
  "auth": "independent",
  "node": "v24.12.0"
}
```

#### Login
```bash
curl -X POST https://appsalvaplantao.com.br/api/auth/login-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eudesrpj@gmail.com",
    "password": "Eudes.2020"
  }'
```

Resposta esperada:
```json
{
  "ok": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "email": "eudesrpj@gmail.com",
    "role": "admin",
    "status": "active"
  }
}
```

#### Verificar Autenticação
```bash
# Use o token do login anterior
TOKEN="eyJhbGci..."

curl https://appsalvaplantao.com.br/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Testar Frontend
1. Acesse: https://appsalvaplantao.com.br
2. Faça login com: eudesrpj@gmail.com / Eudes.2020
3. Verifique navegação
4. Teste funcionalidades principais

## 🔧 Configuração do Servidor

### Nginx (Recomendado)
```nginx
server {
    listen 80;
    server_name appsalvaplantao.com.br www.appsalvaplantao.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name appsalvaplantao.com.br www.appsalvaplantao.com.br;

    ssl_certificate /etc/letsencrypt/live/appsalvaplantao.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appsalvaplantao.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start dist/index.cjs --name salva-plantao

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Monitorar
pm2 monit

# Logs
pm2 logs salva-plantao
```

### Certbot (SSL Gratuito)
```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d appsalvaplantao.com.br -d www.appsalvaplantao.com.br

# Renovação automática
sudo certbot renew --dry-run
```

## 🔐 Segurança em Produção

### 1. JWT Secrets
⚠️ **IMPORTANTE**: Gerar secrets fortes
```bash
# Gerar secrets aleatórios
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Cookies Seguros
O sistema já está configurado para usar cookies seguros em produção:
- `Secure` flag quando HTTPS
- `HttpOnly` para prevenir XSS
- `SameSite=Lax` para CSRF protection

### 3. CORS
O sistema detecta automaticamente o origin e configura CORS corretamente.

## 📊 Monitoramento

### Logs Importantes
```bash
# Ver logs do PM2
pm2 logs salva-plantao

# Logs de erro
pm2 logs salva-plantao --err

# Logs específicos
grep -i "error" ~/.pm2/logs/salva-plantao-error.log
grep -i "login" ~/.pm2/logs/salva-plantao-out.log
```

### Métricas
```bash
# Status do PM2
pm2 status

# Uso de recursos
pm2 monit

# Restart se necessário
pm2 restart salva-plantao
```

## 🚀 Deploy Workflow

### 1. Build Local
```bash
npm run build
```

### 2. Upload para Servidor
```bash
# Via rsync
rsync -avz --exclude 'node_modules' ./ user@servidor:/path/to/app/

# Ou via git
git push origin main
# No servidor:
git pull origin main
npm ci --omit=dev
npm run build
```

### 3. Restart Aplicação
```bash
pm2 restart salva-plantao
```

### 4. Verificar
```bash
curl https://appsalvaplantao.com.br/health
pm2 logs salva-plantao --lines 50
```

## 🐛 Troubleshooting

### Erro 502 Bad Gateway
- Verificar se a aplicação está rodando: `pm2 status`
- Verificar logs: `pm2 logs salva-plantao`
- Reiniciar: `pm2 restart salva-plantao`

### Erro 500 Internal Server Error
- Verificar logs da aplicação
- Verificar variáveis de ambiente
- Verificar conexão com banco de dados

### Problemas com Login
- Verificar JWT_SECRET está configurado
- Verificar cookies estão sendo setados
- Verificar CORS configurado corretamente
- Ver logs: `[LOGIN-PASSWORD]` e `[AUTH]`

### Problemas com HTTPS
- Verificar certificado SSL: `sudo certbot certificates`
- Renovar se necessário: `sudo certbot renew`
- Verificar Nginx: `sudo nginx -t`

## 📞 Informações de Acesso

### Admin
- Email: eudesrpj@gmail.com
- Senha: Eudes.2020

### Banco de Dados
- Host: 34.39.158.20
- Port: 5432
- Database: postgres
- User: postgres

### Domínio
- Principal: https://appsalvaplantao.com.br
- WWW: https://www.appsalvaplantao.com.br (redireciona)

---

**Status:** ✅ Configurado e pronto para teste
**Data:** 3 de fevereiro de 2026
