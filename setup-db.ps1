# Setup Google Cloud SQL PostgreSQL
$ErrorActionPreference = "Stop"

Write-Host "`nSetting up Cloud SQL PostgreSQL..." -ForegroundColor Cyan

$PROJECT_ID = "care-and-cure-dispatch"
$INSTANCE_NAME = "dispatch-db"
$REGION = "us-central1"
$DB_NAME = "dispatch"
$DB_USER = "dispatch_user"

# Generate secure password
$DB_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 20 | ForEach-Object {[char]$_})

Write-Host "`n1. Creating Cloud SQL instance (this takes 5-10 minutes)..." -ForegroundColor Yellow
gcloud sql instances create $INSTANCE_NAME `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=$REGION `
    --database-flags=max_connections=100

Write-Host "`n2. Creating database..." -ForegroundColor Yellow
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME

Write-Host "`n3. Creating database user..." -ForegroundColor Yellow
gcloud sql users create $DB_USER `
    --instance=$INSTANCE_NAME `
    --password=$DB_PASSWORD

Write-Host "`n4. Getting connection name..." -ForegroundColor Yellow
$CONNECTION_NAME = gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)"

Write-Host "`nSUCCESS!" -ForegroundColor Green
Write-Host "`nDatabase Details:" -ForegroundColor Yellow
Write-Host "  Instance: $INSTANCE_NAME" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  User: $DB_USER" -ForegroundColor White
Write-Host "  Password: $DB_PASSWORD" -ForegroundColor White
Write-Host "  Connection: $CONNECTION_NAME" -ForegroundColor White

# Save to file for reference
$details = @"
Cloud SQL Database Details
==========================
Instance: $INSTANCE_NAME
Database: $DB_NAME
User: $DB_USER
Password: $DB_PASSWORD
Connection: $CONNECTION_NAME

Database URL (App Engine):
postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}

Database URL (Local with Cloud SQL Proxy):
postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
"@

Set-Content -Path "database-credentials.txt" -Value $details
Write-Host "`nCredentials saved to: database-credentials.txt" -ForegroundColor Green
Write-Host "`nNext: Run .\configure-app.ps1 to update app.yaml and server/.env" -ForegroundColor Yellow
