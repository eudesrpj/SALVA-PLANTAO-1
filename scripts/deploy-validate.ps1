# Deploy Validation Script
# Salva Plantão - Complete deployment check

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "🚀 DEPLOY VALIDATION - FULL PIPELINE CHECK" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

# Step 1: Build local
Write-Host "1️⃣  Building project..." -ForegroundColor Yellow
try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed:" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Test local health
Write-Host "2️⃣  Testing local health..." -ForegroundColor Yellow
$localHealthy = $false
try {
    # Start local server in background
    Start-Process npm -ArgumentList "start" -NoNewWindow -PassThru | Out-Null
    Start-Sleep -Seconds 5
    
    $localHealth = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Local health check passed" -ForegroundColor Green
    Write-Host "   Local commit: $($localHealth.gitCommit)" -ForegroundColor Gray
    $localHealthy = $true
    
    # Stop local server
    Stop-Process -Name "node" -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️  Local health check failed (may be normal): $($_.Exception.Message)" -ForegroundColor Yellow
    Stop-Process -Name "node" -ErrorAction SilentlyContinue
}
Write-Host ""

# Step 3: Deploy to production
Write-Host "3️⃣  Deploying to Cloud Run..." -ForegroundColor Yellow
try {
    $deployOutput = gcloud run deploy salva-plantao-prod --region=southamerica-east1 --project=salva-plantao-prod1 --source=. 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy successful" -ForegroundColor Green
        
        # Extract revision from output
        $revisionMatch = $deployOutput | Select-String "revision \[(.*?)\]"
        if ($revisionMatch) {
            $newRevision = $revisionMatch.Matches[0].Groups[1].Value
            Write-Host "   New revision: $newRevision" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Deploy failed:" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Deploy error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Wait for deployment to be ready
Write-Host "4️⃣  Waiting for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "✅ Wait completed" -ForegroundColor Green
Write-Host ""

# Step 5: Test production health
Write-Host "5️⃣  Testing production health..." -ForegroundColor Yellow
try {
    $prodHealth = Invoke-RestMethod -Uri "https://appsalvaplantao.com.br/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Production health check passed" -ForegroundColor Green
    Write-Host "   Production commit: $($prodHealth.gitCommit)" -ForegroundColor Gray
    Write-Host "   Cloud Run revision: $($prodHealth.cloudRun.revision)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Production health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Compare versions
Write-Host "6️⃣  Comparing versions..." -ForegroundColor Yellow
if ($localHealthy) {
    if ($localHealth.gitCommit -eq $prodHealth.gitCommit) {
        Write-Host "✅ Version sync: Local and production are running the same commit" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Version mismatch:" -ForegroundColor Yellow
        Write-Host "   Local: $($localHealth.gitCommit)" -ForegroundColor Yellow
        Write-Host "   Production: $($prodHealth.gitCommit)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Local version not available, production is running: $($prodHealth.gitCommit)" -ForegroundColor White
}
Write-Host ""

# Step 7: Run API tests
Write-Host "7️⃣  Running API tests..." -ForegroundColor Yellow
Write-Host "   Testing /api/health..." -ForegroundColor Gray
$healthTest = $prodHealth.status -eq "healthy"

Write-Host "   Testing /api/subscription/plans..." -ForegroundColor Gray
$plansTest = $false
try {
    $plans = Invoke-RestMethod -Uri "https://appsalvaplantao.com.br/api/subscription/plans" -Method GET -TimeoutSec 5
    $plansTest = $plans.Count -gt 0
} catch { }

if ($healthTest -and $plansTest) {
    Write-Host "✅ API tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Some API tests failed:" -ForegroundColor Red
    Write-Host "   Health: $healthTest" -ForegroundColor $(if ($healthTest) { "Green" } else { "Red" })
    Write-Host "   Plans: $plansTest" -ForegroundColor $(if ($plansTest) { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 DEPLOY VALIDATION COMPLETED" -ForegroundColor Green
Write-Host "Production URL: https://appsalvaplantao.com.br" -ForegroundColor White
Write-Host "Current revision: $($prodHealth.cloudRun.revision)" -ForegroundColor White
Write-Host "Current commit: $($prodHealth.gitCommit)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green