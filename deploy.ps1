# Auto-deploy script for Cure & Care Dispatch

Write-Host ""
Write-Host "=== CURE & CARE AUTO-DEPLOY ===" -ForegroundColor Cyan
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

# Verify project
$verifyProject = gcloud config get-value project 2>$null
Write-Host ""
Write-Host "Verified Project: $verifyProject" -ForegroundColor Cyan

# Enable required APIs
Write-Host ""
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Commit changes
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-deploy: Professional healthcare UI - $timestamp"

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

# Submit build
Write-Host ""
Write-Host "Submitting build to Cloud Build..." -ForegroundColor Cyan
gcloud builds submit --config=cloudbuild.yaml .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Getting service URL..." -ForegroundColor Cyan
    gcloud run services describe cure-care-dispatch --region=us-central1 --format='value(status.url)'
} else {
    Write-Host ""
    Write-Host "DEPLOYMENT FAILED!" -ForegroundColor Red
    exit 1
}
