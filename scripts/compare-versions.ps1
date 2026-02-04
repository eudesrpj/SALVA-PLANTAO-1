# Compare Versions Script
# Salva Plantão - Deployment Validation

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Continue"

# URLs por ambiente
$urls = @{
    "local" = "http://localhost:5000/api/health"
    "production" = "https://appsalvaplantao.com.br/api/health"
}

$url = $urls[$Environment]
if (-not $url) {
    Write-Host "❌ Ambiente inválido: $Environment" -ForegroundColor Red
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄 VERSION COMPARISON - $($Environment.ToUpper())" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$versionFile = "last-health-check.json"
$lastVersion = $null

# Carregar versão anterior se existir
if (Test-Path $versionFile) {
    try {
        $lastVersion = Get-Content $versionFile -Raw | ConvertFrom-Json
        Write-Host "📋 Previous version loaded from: $versionFile" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Could not read previous version file" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No previous version file found" -ForegroundColor Gray
}

# Buscar versão atual
try {
    $currentVersion = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 10
    Write-Host "✅ Current version fetched successfully" -ForegroundColor Green
    Write-Host ""
    
    if ($lastVersion) {
        Write-Host "📊 COMPARISON RESULTS:" -ForegroundColor Cyan
        Write-Host ""
        
        # Comparar campos importantes
        $fields = @("gitCommit", "buildTime", "deployTime", "version")
        
        foreach ($field in $fields) {
            $lastValue = $lastVersion.$field
            $currentValue = $currentVersion.$field
            
            if ($lastValue -eq $currentValue) {
                Write-Host "   $($field): $currentValue" -ForegroundColor White
            } else {
                Write-Host "   $($field):" -ForegroundColor Yellow
                Write-Host "     Previous: $lastValue" -ForegroundColor Red
                Write-Host "     Current:  $currentValue" -ForegroundColor Green
            }
        }
        
        # Verificar se houve deploy novo
        if ($lastVersion.gitCommit -ne $currentVersion.gitCommit) {
            Write-Host ""
            Write-Host "🚀 NEW DEPLOYMENT DETECTED!" -ForegroundColor Green
            Write-Host "   Git commit changed from $($lastVersion.gitCommit) to $($currentVersion.gitCommit)" -ForegroundColor Green
        } elseif ($lastVersion.cloudRun.revision -ne $currentVersion.cloudRun.revision) {
            Write-Host ""
            Write-Host "🔄 NEW CLOUD RUN REVISION DETECTED!" -ForegroundColor Green
            Write-Host "   Revision changed from $($lastVersion.cloudRun.revision) to $($currentVersion.cloudRun.revision)" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "ℹ️  No changes detected since last check" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "📊 CURRENT VERSION INFO:" -ForegroundColor Cyan
        Write-Host "   Git Commit: $($currentVersion.gitCommit)" -ForegroundColor White
        Write-Host "   Build Time: $($currentVersion.buildTime)" -ForegroundColor White
        Write-Host "   Deploy Time: $($currentVersion.deployTime)" -ForegroundColor White
        Write-Host "   Cloud Run Revision: $($currentVersion.cloudRun.revision)" -ForegroundColor White
    }
    
    # Salvar versão atual
    $currentVersion | ConvertTo-Json -Depth 5 | Out-File -FilePath $versionFile -Encoding UTF8
    Write-Host ""
    Write-Host "💾 Current version saved for next comparison" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ VERSION COMPARISON COMPLETED" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}