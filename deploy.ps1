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

# Check for uncommitted changes
Write-Host ""
Write-Host "Checking for changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Found uncommitted changes. Committing..." -ForegroundColor Yellow
    
    # Stage all changes
    git add .
    
    # Create commit with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-deploy: $timestamp - All 12 SRS features complete"
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "Failed to push to GitHub!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No changes to commit." -ForegroundColor Green
    
    # Still push to ensure remote is up to date
    Write-Host "Ensuring GitHub is up to date..." -ForegroundColor Yellow
    git push origin main
}

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
