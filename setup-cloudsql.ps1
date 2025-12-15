# Setup Google Cloud SQL PostgreSQL for App Engine

Write-Host "`n🗄️  Setting up Cloud SQL PostgreSQL..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$PROJECT_ID = "care-and-cure-dispatch"
$INSTANCE_NAME = "dispatch-db"
$REGION = "us-central1"
$DB_NAME = "dispatch"
$DB_USER = "dispatch_user"

# Step 1: Create Cloud SQL PostgreSQL instance
Write-Host "`n1️⃣  Creating Cloud SQL PostgreSQL instance..." -ForegroundColor Yellow
Write-Host "   Instance: $INSTANCE_NAME" -ForegroundColor Gray
Write-Host "   Region: $REGION" -ForegroundColor Gray
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray

gcloud sql instances create $INSTANCE_NAME `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=$REGION `
    --root-password="$(New-Guid)" `
    --database-flags=max_connections=100

# Step 2: Create database
Write-Host "`n2️⃣  Creating database..." -ForegroundColor Yellow
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME

# Step 3: Create database user
Write-Host "`n3️⃣  Creating database user..." -ForegroundColor Yellow
$DB_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | ForEach-Object {[char]$_})
Write-Host "   Generated password: $DB_PASSWORD" -ForegroundColor Green
Write-Host "   ⚠️  SAVE THIS PASSWORD!" -ForegroundColor Red

gcloud sql users create $DB_USER `
    --instance=$INSTANCE_NAME `
    --password=$DB_PASSWORD

# Step 4: Get connection name
Write-Host "`n4️⃣  Getting connection details..." -ForegroundColor Yellow
$CONNECTION_NAME = gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)"
Write-Host "   Connection name: $CONNECTION_NAME" -ForegroundColor Green

# Step 5: Update app.yaml
Write-Host "`n5️⃣  Updating app.yaml..." -ForegroundColor Yellow

$envVars = @"

  # Database connection
  DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}
  
  # JWT
  JWT_SECRET: "$(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_}))"
  JWT_EXPIRES_IN: "7d"
  
  # Add your Twilio credentials
  # TWILIO_ACCOUNT_SID: "your-account-sid"
  # TWILIO_AUTH_TOKEN: "your-auth-token"
  # TWILIO_WHATSAPP_NUMBER: "whatsapp:+14155238886"
  
  # Add your Cloudinary credentials
  # CLOUDINARY_CLOUD_NAME: "your-cloud-name"
  # CLOUDINARY_API_KEY: "your-api-key"
  # CLOUDINARY_API_SECRET: "your-api-secret"
"@

Add-Content -Path "app.yaml" -Value $envVars

# Step 6: Create server .env for local development
Write-Host "`n6️⃣  Creating local .env file..." -ForegroundColor Yellow

$localEnv = @"
PORT=3000
NODE_ENV=development

# Cloud SQL Connection (for local development)
# Option 1: Use Cloud SQL Proxy
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# Option 2: Public IP (after enabling)
# DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@<PUBLIC_IP>:5432/${DB_NAME}"

# JWT
JWT_SECRET="$(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_}))"
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

Set-Content -Path "server\.env" -Value $localEnv

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "`n✅ Cloud SQL Setup Complete!" -ForegroundColor Green

Write-Host "`n📋 Connection Details:" -ForegroundColor Yellow
Write-Host "   Instance: $INSTANCE_NAME" -ForegroundColor White
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host "   User: $DB_USER" -ForegroundColor White
Write-Host "   Password: $DB_PASSWORD" -ForegroundColor White
Write-Host "   Connection: $CONNECTION_NAME" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Install Cloud SQL Proxy for local development:" -ForegroundColor White
Write-Host "      Download from: https://cloud.google.com/sql/docs/postgres/sql-proxy" -ForegroundColor Gray
Write-Host "      Run: cloud-sql-proxy $CONNECTION_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Run Prisma migrations:" -ForegroundColor White
Write-Host "      cd server" -ForegroundColor Cyan
Write-Host "      npx prisma migrate deploy" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. Create admin user:" -ForegroundColor White
Write-Host "      npx tsx scripts/createAdmin.ts" -ForegroundColor Cyan
Write-Host ""
Write-Host "   4. Deploy to App Engine:" -ForegroundColor White
Write-Host "      gcloud app deploy app.yaml --quiet" -ForegroundColor Cyan

Write-Host "`n⚠️  Important: Update Twilio & Cloudinary credentials in:" -ForegroundColor Red
Write-Host "   - server/.env (local)" -ForegroundColor White
Write-Host "   - app.yaml (production)" -ForegroundColor White
Write-Host "`n"
