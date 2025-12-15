# Complete Cloud SQL setup after instance is ready
Write-Host "`nChecking Cloud SQL instance status..." -ForegroundColor Cyan

$status = gcloud sql instances describe dispatch-db --format="value(state)" 2>$null

if ($status -ne "RUNNABLE") {
    Write-Host "Instance not ready yet. Status: $status" -ForegroundColor Yellow
    Write-Host "Run this script again in a few minutes." -ForegroundColor Gray
    exit 1
}

Write-Host "Instance is READY! Completing setup..." -ForegroundColor Green

$INSTANCE_NAME = "dispatch-db"
$DB_NAME = "dispatch"
$DB_USER = "dispatch_user"
$DB_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 20 | ForEach-Object {[char]$_})

Write-Host "`n1. Creating database..." -ForegroundColor Yellow
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME 2>$null
if ($?) { Write-Host "   Database created" -ForegroundColor Green }

Write-Host "`n2. Creating user..." -ForegroundColor Yellow
gcloud sql users create $DB_USER --instance=$INSTANCE_NAME --password=$DB_PASSWORD
Write-Host "   User created" -ForegroundColor Green

Write-Host "`n3. Getting connection details..." -ForegroundColor Yellow
$CONNECTION_NAME = gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)"
Write-Host "   Connection: $CONNECTION_NAME" -ForegroundColor Green

Write-Host "`n4. Updating configuration files..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$dbUrl = "postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# Update app.yaml
$appYaml = Get-Content "app.yaml" -Raw
if ($appYaml -notmatch "DATABASE_URL") {
    $newEnvVars = "`n  DATABASE_URL: `"$dbUrl`"`n  JWT_SECRET: `"$JWT_SECRET`"`n  JWT_EXPIRES_IN: `"7d`""
    $appYaml = $appYaml -replace '(NODE_ENV: "production")', "`$1$newEnvVars"
    Set-Content -Path "app.yaml" -Value $appYaml -NoNewline
    Write-Host "   Updated app.yaml" -ForegroundColor Green
}

# Create server/.env
$serverEnv = @"
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="7d"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CORS_ORIGIN="*"
"@
Set-Content -Path "server\.env" -Value $serverEnv
Write-Host "   Created server/.env" -ForegroundColor Green

# Save credentials
$creds = @"
DATABASE CREDENTIALS
====================
Instance: $INSTANCE_NAME
Database: $DB_NAME  
User: $DB_USER
Password: $DB_PASSWORD
Connection: $CONNECTION_NAME

App Engine URL: postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}
Local URL: postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
"@
Set-Content -Path "database-credentials.txt" -Value $creds
Write-Host "   Saved credentials to database-credentials.txt" -ForegroundColor Green

Write-Host "`nSETUP COMPLETE!" -ForegroundColor Green
Write-Host "`nDatabase Password: $DB_PASSWORD" -ForegroundColor Yellow
Write-Host "(Also saved in database-credentials.txt)" -ForegroundColor Gray

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Install dependencies: cd server && npm install" -ForegroundColor White
Write-Host "  2. Generate Prisma: npx prisma generate" -ForegroundColor White
Write-Host "  3. Deploy: cd .. && gcloud app deploy app.yaml --quiet" -ForegroundColor White
