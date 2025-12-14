# Google Cloud Deployment Script for Cure-and-Care-Dispatch
# Includes strict project ID verification before and after deployment

param(
    [string]$ProjectId = "care-and-cure-dispatch",
    [string]$Region = "asia-south1",
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host "[WARN] $args" -ForegroundColor Yellow }

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "  Cure and Care Dispatch - GCloud Deploy" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# ====================================
# STEP 1: Verify correct project BEFORE any operations
# ====================================
Write-Info "Checking current Google Cloud project..."
$currentProject = gcloud config get-value project 2>$null
$currentProject = $currentProject.Trim()

if ($currentProject -ne $ProjectId) {
    Write-Error-Custom "WRONG PROJECT DETECTED!"
    Write-Host "  Expected: $ProjectId" -ForegroundColor Yellow
    Write-Host "  Current:  $currentProject" -ForegroundColor Red
    Write-Host "`nDeployment STOPPED to prevent deploying to wrong project." -ForegroundColor Red
    Write-Host "Run this command to switch projects:" -ForegroundColor Yellow
    Write-Host "  gcloud config set project $ProjectId`n" -ForegroundColor Cyan
    exit 1
}

Write-Success "Project verified: $currentProject"

# ====================================
# STEP 2: User confirmation
# ====================================
Write-Host "`n" -NoNewline
Write-Host "Project: " -NoNewline
Write-Host "$ProjectId" -ForegroundColor Yellow
Write-Host "Region:  " -NoNewline
Write-Host "$Region" -ForegroundColor Yellow
Write-Host "`nThis will:" -ForegroundColor Cyan
Write-Host "  1. Build Docker images using Cloud Build" -ForegroundColor White
Write-Host "  2. Deploy API to Cloud Run (cure-care-api)" -ForegroundColor White
Write-Host "  3. Deploy Web to Cloud Run (cure-care-web)" -ForegroundColor White
Write-Host "  4. Deploy Assistant to Cloud Run (cure-care-assistant)" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue with deployment? (yes/no)"
if ($confirmation -ne "yes" -and $confirmation -ne "y") {
    Write-Warning-Custom "Deployment cancelled by user."
    exit 0
}

# ====================================
# STEP 3: Check required secrets exist
# ====================================
Write-Info "Checking required secrets..."

$requiredSecrets = @("DATABASE_URL", "JWT_SECRET")
$missingSecrets = @()

foreach ($secret in $requiredSecrets) {
    $secretExists = gcloud secrets describe $secret --project=$ProjectId 2>$null
    if ($LASTEXITCODE -ne 0) {
        $missingSecrets += $secret
    }
}

if ($missingSecrets.Count -gt 0) {
    Write-Warning-Custom "Missing secrets: $($missingSecrets -join ', ')"
    Write-Host "Create them with:" -ForegroundColor Yellow
    foreach ($secret in $missingSecrets) {
        Write-Host "  echo -n 'YOUR_VALUE' | gcloud secrets create $secret --data-file=- --project=$ProjectId" -ForegroundColor Cyan
    }
    Write-Host ""
    $continueAnyway = Read-Host "Continue deployment without secrets? (yes/no)"
    if ($continueAnyway -ne "yes") {
        Write-Error-Custom "Deployment cancelled - secrets required."
        exit 1
    }
}

# ====================================
# STEP 4: Enable required APIs
# ====================================
Write-Info "Ensuring required APIs are enabled..."

$requiredApis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com"
)

foreach ($api in $requiredApis) {
    Write-Host "  Enabling $api..." -ForegroundColor Gray
    gcloud services enable $api --project=$ProjectId 2>$null
}

Write-Success "APIs enabled"

# ====================================
# STEP 5: Submit Cloud Build
# ====================================
Write-Info "Submitting Cloud Build job..."
Write-Host "  (This will take 5-10 minutes for first build)" -ForegroundColor Gray

$buildResult = gcloud builds submit --config=cloudbuild.yaml --project=$ProjectId --region=$Region .

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Cloud Build failed!"
    Write-Host "Check logs at: https://console.cloud.google.com/cloud-build/builds?project=$ProjectId" -ForegroundColor Yellow
    exit 1
}

Write-Success "Cloud Build completed successfully"

# ====================================
# STEP 6: Verify project ID AGAIN after deployment
# ====================================
Write-Info "Re-verifying project after deployment..."
$finalProject = gcloud config get-value project 2>$null
$finalProject = $finalProject.Trim()

if ($finalProject -ne $ProjectId) {
    Write-Error-Custom "PROJECT ID CHANGED DURING DEPLOYMENT!"
    Write-Host "  Expected: $ProjectId" -ForegroundColor Yellow
    Write-Host "  Current:  $finalProject" -ForegroundColor Red
    Write-Host "`nWARNING: Services may have been deployed to wrong project!" -ForegroundColor Red
    exit 1
}

Write-Success "Project verified after deployment: $finalProject"

# ====================================
# STEP 7: Get service URLs
# ====================================
Write-Info "Fetching deployed service URLs..."

$apiUrl = gcloud run services describe cure-care-api --region=$Region --project=$ProjectId --format="value(status.url)" 2>$null
$webUrl = gcloud run services describe cure-care-web --region=$Region --project=$ProjectId --format="value(status.url)" 2>$null
$assistantUrl = gcloud run services describe cure-care-assistant --region=$Region --project=$ProjectId --format="value(status.url)" 2>$null

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nService URLs:" -ForegroundColor Cyan
if ($apiUrl) {
    Write-Host "  API:       " -NoNewline -ForegroundColor White
    Write-Host $apiUrl -ForegroundColor Yellow
} else {
    Write-Host "  API:       (not deployed)" -ForegroundColor Gray
}

if ($webUrl) {
    Write-Host "  Web:       " -NoNewline -ForegroundColor White
    Write-Host $webUrl -ForegroundColor Yellow
} else {
    Write-Host "  Web:       (not deployed)" -ForegroundColor Gray
}

if ($assistantUrl) {
    Write-Host "  Assistant: " -NoNewline -ForegroundColor White
    Write-Host $assistantUrl -ForegroundColor Yellow
} else {
    Write-Host "  Assistant: (not deployed)" -ForegroundColor Gray
}

# ====================================
# STEP 8: Run smoke tests
# ====================================
if (-not $SkipTests -and $apiUrl) {
    Write-Host "`n" -NoNewline
    Write-Info "Running smoke tests..."
    
    try {
        $healthCheck = Invoke-WebRequest -Uri "$apiUrl/health" -Method GET -TimeoutSec 10
        if ($healthCheck.StatusCode -eq 200) {
            Write-Success "API health check passed"
        } else {
            Write-Warning-Custom "API health check returned status $($healthCheck.StatusCode)"
        }
    } catch {
        Write-Warning-Custom "API health check failed: $_"
    }

    if ($webUrl) {
        try {
            $webCheck = Invoke-WebRequest -Uri $webUrl -Method GET -TimeoutSec 10
            if ($webCheck.StatusCode -eq 200) {
                Write-Success "Web app health check passed"
            } else {
                Write-Warning-Custom "Web app returned status $($webCheck.StatusCode)"
            }
        } catch {
            Write-Warning-Custom "Web app health check failed: $_"
        }
    }
}

Write-Host "`nView logs: https://console.cloud.google.com/run?project=$ProjectId" -ForegroundColor Cyan
Write-Host "`nDeployment complete!`n" -ForegroundColor Green
