# Monitor and auto-complete Cloud SQL setup
Write-Host "Monitoring Cloud SQL instance creation..." -ForegroundColor Cyan
Write-Host "Will auto-complete setup when ready.`n" -ForegroundColor Gray

$attempt = 0
$maxAttempts = 30  # 15 minutes max

do {
    $attempt++
    $status = gcloud sql instances describe dispatch-db --format="value(state)" 2>$null
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Attempt $attempt/30 - Status: $status" -ForegroundColor Yellow
    
    if ($status -eq "RUNNABLE") {
        Write-Host "`nINSTANCE IS READY!" -ForegroundColor Green
        Write-Host "Running finish-db-setup.ps1...`n" -ForegroundColor Cyan
        .\finish-db-setup.ps1
        exit 0
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 30
    }
} while ($attempt -lt $maxAttempts)

Write-Host "`nTimeout reached. Please run manually: .\finish-db-setup.ps1" -ForegroundColor Yellow
