# Setup script for Google Cloud secrets
# Run this ONCE before first deployment

param(
    [string]$ProjectId = "care-and-cure-dispatch"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Google Cloud Secrets Setup" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Verify project
$currentProject = gcloud config get-value project 2>$null | Select-Object -First 1
$currentProject = $currentProject.Trim()

if ($currentProject -ne $ProjectId) {
    Write-Host "❌ Wrong project: $currentProject (expected: $ProjectId)" -ForegroundColor Red
    Write-Host "Run: gcloud config set project $ProjectId" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project verified: $currentProject`n" -ForegroundColor Green

# DATABASE_URL
Write-Host "Setting up DATABASE_URL secret..." -ForegroundColor Cyan
Write-Host "Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -ForegroundColor Gray
Write-Host "Example: postgresql://postgres:password@localhost:5432/cure_care" -ForegroundColor Gray
$databaseUrl = Read-Host "Enter DATABASE_URL"

if ($databaseUrl) {
    echo $databaseUrl | gcloud secrets create DATABASE_URL --data-file=- --project=$ProjectId 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ DATABASE_URL secret created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  DATABASE_URL already exists, updating..." -ForegroundColor Yellow
        echo $databaseUrl | gcloud secrets versions add DATABASE_URL --data-file=- --project=$ProjectId
        Write-Host "✅ DATABASE_URL secret updated" -ForegroundColor Green
    }
}

# JWT_SECRET
Write-Host "`nSetting up JWT_SECRET..." -ForegroundColor Cyan
Write-Host "Should be a long random string (32+ characters)" -ForegroundColor Gray
$jwtSecret = Read-Host "Enter JWT_SECRET (or press Enter to generate random)"

if (-not $jwtSecret) {
    # Generate random 64 character secret
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated random JWT_SECRET: $jwtSecret" -ForegroundColor Yellow
}

echo $jwtSecret | gcloud secrets create JWT_SECRET --data-file=- --project=$ProjectId 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ JWT_SECRET secret created" -ForegroundColor Green
} else {
    Write-Host "⚠️  JWT_SECRET already exists, updating..." -ForegroundColor Yellow
    echo $jwtSecret | gcloud secrets versions add JWT_SECRET --data-file=- --project=$ProjectId
    Write-Host "✅ JWT_SECRET secret updated" -ForegroundColor Green
}

Write-Host "`n✅ Secrets setup complete!" -ForegroundColor Green
Write-Host "You can now run: .\scripts\deploy-gcloud.ps1`n" -ForegroundColor Cyan
