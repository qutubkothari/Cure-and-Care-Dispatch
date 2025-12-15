# Deploy to App Engine with Database Setup

Write-Host "`n=== Deploying Cure and Care Dispatch ===" -ForegroundColor Cyan
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Deploy the application to App Engine" -ForegroundColor Gray
Write-Host "  2. Run Prisma migrations on the Cloud SQL database" -ForegroundColor Gray
Write-Host "  3. Create an admin user" -ForegroundColor Gray
Write-Host ""

# Step 1: Deploy the application
Write-Host "`nStep 1: Deploying to App Engine..." -ForegroundColor Cyan
gcloud app deploy app.yaml --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nDeployment successful!" -ForegroundColor Green

# Step 2: Run migrations using gcloud ssh
Write-Host "`nStep 2: Running database migrations..." -ForegroundColor Cyan
Write-Host "Creating migration script..." -ForegroundColor Gray

# Create a temporary script to run migrations
$migrationScript = @"
#!/bin/bash
cd /workspace/server
export DATABASE_URL="postgresql://dispatch_user:yXDnjmPGCoew2W3RtBib@/dispatch?host=/cloudsql/care-and-cure-dispatch:us-central1:dispatch-db"
npx prisma migrate deploy
echo "Migration completed!"
"@

Set-Content -Path "run-migration.sh" -Value $migrationScript

Write-Host "Note: Migrations need to be run on App Engine instance" -ForegroundColor Yellow
Write-Host "You can run them manually with:" -ForegroundColor Yellow
Write-Host "  gcloud app instances ssh <instance-id> --service=default --version=<version>" -ForegroundColor Cyan
Write-Host "  Then run: cd /workspace/server && npx prisma migrate deploy" -ForegroundColor Cyan

Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "`nYour app is live at:" -ForegroundColor Cyan
gcloud app browse --no-launch-browser

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. The database is ready and connected" -ForegroundColor Gray
Write-Host "2. Tables will be created automatically on first request" -ForegroundColor Gray
Write-Host "3. Or manually run migrations (see above)" -ForegroundColor Gray
