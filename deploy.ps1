# Deploy Script - SALVA PLANTÃO
# Uso: .\deploy.ps1 -platform render

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("render", "gcp")]
    [string]$platform,
    
    [Parameter(Mandatory=$false)]
    [string]$serviceName = "salva-plantao"
)

Write-Host "🚀 SALVA PLANTÃO - Deploy Script" -ForegroundColor Cyan
Write-Host "Platform: $platform`n" -ForegroundColor Yellow

# Verificar Git status
Write-Host "📦 Verificando Git status..." -ForegroundColor Blue
$gitStatus = & git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Há mudanças não commitadas:" -ForegroundColor Yellow
    Write-Host $gitStatus
    $confirm = Read-Host "Continuar mesmo assim? (s/n)"
    if ($confirm -ne "s") {
        Write-Host "Deploy cancelado." -ForegroundColor Red
        exit 1
    }
}

# Build
Write-Host "`n🔨 Building..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build sucesso!" -ForegroundColor Green

if ($platform -eq "render") {
    Deploy-Render
} elseif ($platform -eq "gcp") {
    Deploy-GCP
}

function Deploy-Render {
    Write-Host "`n🌐 Deploying to Render.com..." -ForegroundColor Blue
    Write-Host @"
Próximos passos:
1. Acesse: https://render.com
2. Login com GitHub
3. Clique em "+ New" → "Web Service"
4. Selecione repositório: SALVA-PLANTAO-1
5. Configure:
   - Name: $serviceName
   - Build Command: npm ci && npm run build
   - Start Command: npm run start
6. Adicione Environment Variables:
   - NODE_ENV=production
   - DATABASE_URL=postgresql://...
   - JWT_SECRET=<generated>
   - JWT_REFRESH_SECRET=<generated>
7. Clique em "Deploy"

Documentação: https://render.com/docs
"@ -ForegroundColor Yellow
}

function Deploy-GCP {
    Write-Host "`n☁️  Deploying to Google Cloud Run..." -ForegroundColor Blue
    
    # Verificar gcloud CLI
    $gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
    if (-not $gcloud) {
        Write-Host "❌ Google Cloud SDK não instalado!" -ForegroundColor Red
        Write-Host "Instale em: https://cloud.google.com/sdk" -ForegroundColor Yellow
        exit 1
    }
    
    # Solicitar configurações
    $projectId = Read-Host "Digite seu Google Cloud Project ID"
    $region = Read-Host "Digite a região (default: southamerica-east1)" 
    if ([string]::IsNullOrEmpty($region)) { $region = "southamerica-east1" }
    
    Write-Host "`n🔑 Configurando Database URL..." -ForegroundColor Blue
    $dbUrl = Read-Host "Cole seu DATABASE_URL completo"
    
    Write-Host "`n🔐 Gerando JWT Secrets..." -ForegroundColor Blue
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    $refreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
    
    Write-Host "`n📤 Enviando para Google Cloud Run..." -ForegroundColor Blue
    
    gcloud run deploy $serviceName `
        --source=. `
        --platform=managed `
        --region=$region `
        --allow-unauthenticated `
        --memory=512Mi `
        --set-env-vars="NODE_ENV=production" `
        --project=$projectId `
        2>&1 | Tee-Object -Variable output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Deploy sucesso!" -ForegroundColor Green
        Write-Host "🎯 Sua app está em produção!" -ForegroundColor Cyan
        
        # Extrair URL
        $serviceUrl = $output | Select-String -Pattern "Service URL:" | ForEach-Object { $_.Line.Split(': ')[1] }
        if ($serviceUrl) {
            Write-Host "URL: $serviceUrl" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ Deploy falhou!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Deploy iniciado!" -ForegroundColor Green
