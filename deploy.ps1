# Auto-deploy script for Cure & Care Dispatch - App Engine

Write-Host ""
Write-Host "=== CURE & CARE AUTO-DEPLOY (App Engine) ===" -ForegroundColor Cyan
Write-Host ""

# Check current project
$currentProject = gcloud config get-value project 2>$null
Write-Host "Current Project: $currentProject" -ForegroundColor Yellow

if ($currentProject -ne "care-and-cure-dispatch") {
    Write-Host "Wrong project! Setting to care-and-cure-dispatch..." -ForegroundColor Red
    gcloud config set project care-and-cure-dispatch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to set project" -ForegroundColor Red
        exit 1
    }
    Write-Host "Project updated!" -ForegroundColor Green
} else {
    Write-Host "Project ID is correct!" -ForegroundColor Green
}

# Commit changes
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Deploy: Healthcare UI - $timestamp"

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

# Deploy to App Engine
Write-Host ""
Write-Host "Deploying to App Engine..." -ForegroundColor Cyan
Write-Host "This will take 3-5 minutes..." -ForegroundColor Yellow
gcloud app deploy app.yaml --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is live at:" -ForegroundColor Cyan
    gcloud app browse --no-launch-browser
} else {
    Write-Host ""
    Write-Host "DEPLOYMENT FAILED!" -ForegroundColor Red
    exit 1
}
