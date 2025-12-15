# Configure app.yaml and server/.env with database credentials
param(
    [string]$ConnectionName,
    [string]$DbUser,
    [string]$DbPassword,
    [string]$DbName
)

if (-not $ConnectionName) {
    Write-Host "Reading credentials from database-credentials.txt..." -ForegroundColor Yellow
    $content = Get-Content "database-credentials.txt" -Raw
    $ConnectionName = ($content | Select-String -Pattern "Connection: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
    $DbUser = ($content | Select-String -Pattern "User: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
    $DbPassword = ($content | Select-String -Pattern "Password: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
    $DbName = ($content | Select-String -Pattern "Database: (.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
}

# Generate JWT secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "`nConfiguring application..." -ForegroundColor Cyan

# Update app.yaml
Write-Host "`n1. Updating app.yaml..." -ForegroundColor Yellow
$appYaml = Get-Content "app.yaml" -Raw
$dbUrl = "postgresql://${DbUser}:${DbPassword}@/${DbName}?host=/cloudsql/${ConnectionName}"

$newEnvVars = @"
  DATABASE_URL: "$dbUrl"
  JWT_SECRET: "$JWT_SECRET"
  JWT_EXPIRES_IN: "7d"
"@

# Add after NODE_ENV line
$appYaml = $appYaml -replace '(NODE_ENV: "production")', "`$1`n$newEnvVars"
Set-Content -Path "app.yaml" -Value $appYaml
Write-Host "   Updated app.yaml" -ForegroundColor Green

# Create server/.env
Write-Host "`n2. Creating server/.env..." -ForegroundColor Yellow
$serverEnv = @"
PORT=3000
NODE_ENV=development

# Cloud SQL Connection (use with Cloud SQL Proxy)
DATABASE_URL="postgresql://${DbUser}:${DbPassword}@localhost:5432/${DbName}"

# JWT
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"

# Twilio WhatsApp (get from https://www.twilio.com)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Cloudinary (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# CORS
CORS_ORIGIN="*"
"@

Set-Content -Path "server\.env" -Value $serverEnv
Write-Host "   Created server/.env" -ForegroundColor Green

Write-Host "`nSUCCESS! Configuration complete." -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\switch-to-typescript.ps1" -ForegroundColor Cyan
Write-Host "  2. Deploy: gcloud app deploy app.yaml --quiet" -ForegroundColor Cyan
