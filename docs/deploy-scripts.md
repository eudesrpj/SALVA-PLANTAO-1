# Scripts de Validação de Deploy

## Visão Geral

Scripts PowerShell para validar deployments e versões do Salva Plantão em produção.

## Scripts Disponíveis

### 1. `test-health.ps1` - Health Check
Testa o endpoint de health e exibe informações detalhadas da versão atual.

**Uso:**
```powershell
# Testar produção (padrão)
.\scripts\test-health.ps1

# Testar ambiente local
.\scripts\test-health.ps1 -Environment local
```

**Saída:**
- Status da aplicação
- Informações de versão (commit, build time, deploy time)
- Dados do Cloud Run (revision, service)
- Tempo de resposta
- Uptime do servidor

### 2. `compare-versions.ps1` - Comparação de Versões
Compara a versão atual com a versão anteriormente salva para detectar mudanças.

**Uso:**
```powershell
# Comparar versões em produção
.\scripts\compare-versions.ps1

# Comparar versões localmente
.\scripts\compare-versions.ps1 -Environment local
```

**Funcionalidades:**
- Detecta novos deployments (mudança de commit)
- Detecta novas revisões do Cloud Run
- Salva estado para próximas comparações
- Arquivo de cache: `last-health-check.json`

### 3. `deploy-validate.ps1` - Validação Completa de Deploy
Script completo que executa todo o pipeline: build → deploy → validate.

**Uso:**
```powershell
# Deploy completo com validação
.\scripts\deploy-validate.ps1
```

**Etapas:**
1. Build local do projeto
2. Teste de health local (opcional)
3. Deploy para Cloud Run
4. Aguarda deployment
5. Teste de health em produção
6. Comparação de versões
7. Testes básicos de API

## Arquivos Gerados

- `last-health-check.json` - Cache da última verificação de health
- Logs de build e deploy no console

## Variáveis de Ambiente Detectadas

Os scripts verificam as seguintes variáveis no endpoint `/api/health`:

### Build Info
- `BUILD_SHA` / `GIT_SHA` / `COMMIT_SHA` - Hash do commit Git
- `BUILD_TIME` - Timestamp do build
- `DEPLOY_TIME` - Timestamp do deploy
- `APP_VERSION` - Versão do package.json

### Cloud Run Info
- `K_REVISION` - Revisão atual do Cloud Run
- `K_SERVICE` - Nome do serviço Cloud Run
- `NODE_ENV` - Ambiente (production/development)

## Troubleshooting

### Erro: "Ambiente inválido"
Ambientes suportados: `local`, `production`

### Erro: "Could not read previous version file"
Normal na primeira execução. O arquivo `last-health-check.json` será criado automaticamente.

### Erro: "Deploy failed"
Verifique:
- Autenticação do gcloud (`gcloud auth list`)
- Permissões no projeto (`salva-plantao-prod1`)
- Conexão com a internet
- Build local passou

### Erro: "Health check failed"
Possíveis causas:
- Serviço não está respondendo
- Timeout de rede
- Endpoint `/api/health` não existe
- Aplicação crashou durante startup

## Integração com CI/CD

Para usar em pipelines automatizados:

```powershell
# Validar deploy após push
.\scripts\deploy-validate.ps1

# Verificar se deploy foi bem-sucedido
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy validated successfully"
} else {
    Write-Host "❌ Deploy validation failed"
    exit 1
}
```

## Exemplos de Saída

### Health Check Bem-sucedido
```
✅ STATUS: HEALTHY
⏱️ Response Time: 245ms

📊 VERSION INFO:
   App Name: Salva Plantão
   Version: 1.0.0
   Git Commit: abc1234
   Build Time: 2026-02-03T10:30:00.000Z
   Deploy Time: 2026-02-03T10:31:15.000Z
   Environment: production
   Uptime: 3600 seconds

☁️ CLOUD RUN INFO:
   Service: salva-plantao-prod
   Revision: salva-plantao-prod-00087-xyz
```

### Novo Deploy Detectado
```
🚀 NEW DEPLOYMENT DETECTED!
   Git commit changed from abc1234 to def5678
```