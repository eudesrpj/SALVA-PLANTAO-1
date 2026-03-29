#!/usr/bin/env node
# Google Cloud Setup Script - SALVA PLANTÃO
# Uso: ./setup-google-cloud.ps1

param(
    [switch]$SkipDeploy = $false,
    [string]$ProjectId = "salva-plantao"
)

$colors = @{
    Green = "`e[32m"
    Yellow = "`e[33m"
    Red = "`e[31m"
    Blue = "`e[36m"
    Reset = "`e[0m"
}

function Write-Log {
    param([string]$Message, [string]$Type = "info")
    
    $color = switch($Type) {
        "success" { $colors.Green }
        "error" { $colors.Red }
        "warning" { $colors.Yellow }
        "info" { $colors.Blue }
        default { $colors.Reset }
    }
    
    Write-Host "$color$Message$($colors.Reset)"
}

Write-Log "🌍 Google Cloud Setup - SALVA PLANTÃO" "info"
Write-Log "======================================`n" "info"

# Check if gcloud is installed
Write-Log "[1/5] Verificando Google Cloud SDK..."
try {
    $gcloud = & gcloud --version 2>&1
    Write-Log "✅ Google Cloud SDK encontrado" "success"
} catch {
    Write-Log "❌ Google Cloud SDK não está instalado" "error"
    Write-Log "Instale em: https://cloud.google.com/sdk/docs/install" "warning"
    exit 1
}

# Authenticate with Google Cloud
Write-Log "`n[2/5] Autenticando com Google Cloud..."
try {
    & gcloud auth login --quiet
    Write-Log "✅ Autenticado com sucesso" "success"
} catch {
    Write-Log "❌ Erro na autenticação" "error"
    exit 1
}

# Set project
Write-Log "`n[3/5] Configurando projeto..."
try {
    & gcloud config set project $ProjectId
    Write-Log "✅ Projeto configurado: $ProjectId" "success"
} catch {
    Write-Log "❌ Erro ao configurar projeto" "error"
    exit 1
}

# Check/Create Cloud SQL instance
Write-Log "`n[4/5] Verificando Cloud SQL..."
$instanceName = "$ProjectId-db"
$instances = & gcloud sql instances list --filter="name:$instanceName" --quiet
if ($instances) {
    Write-Log "✅ Cloud SQL já existe: $instanceName" "success"
} else {
    Write-Log "⏳ Criando Cloud SQL (isso pode levar 2-3 min)..." "warning"
    & gcloud sql instances create $instanceName `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=southamerica-east1 `
        --quiet
    Write-Log "✅ Cloud SQL criado" "success"
}

# Get connection info
Write-Log "`n[5/5] Coletando informações de conexão..."
$instanceInfo = & gcloud sql instances describe $instanceName --format="value(ipAddresses[0].ipAddress)"
Write-Log "✅ IP da instância: $instanceInfo" "success"

# Update .env
Write-Log "`n📝 Atualizando .env..."
$envContent = Get-Content ".env" -Raw
$newDbUrl = "postgresql://postgres:YOUR_PASSWORD@$instanceInfo`:5432/postgres?sslmode=require"
$envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=$newDbUrl"
Set-Content ".env" $envContent
Write-Log "✅ .env atualizado" "success"

# Display next steps
Write-Log "`n$($colors.Green)═══════════════════════════════════════$($colors.Reset)"
Write-Log "✅ Setup Completo!" "success"
Write-Log "$($colors.Green)═══════════════════════════════════════$($colors.Reset)`n"

Write-Log "Próximos Passos:" "info"
Write-Log "1. Abra .env e atualize o PASSWORD da database" "info"
Write-Log "2. Execute: npm run dev" "info"
Write-Log "3. Para fazer deploy em Cloud Run:" "info"
Write-Log "   gcloud run deploy salva-plantao --source=. --platform=managed --region=southamerica-east1" "info"

Write-Log "`nDocumentação: GOOGLE_CLOUD_SETUP.md" "info"
