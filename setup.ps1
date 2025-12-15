# Complete Setup Script for Cure & Care Dispatch

Write-Host "`n🚀 Setting up Cure & Care Dispatch System..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Step 1: Install server dependencies
Write-Host "`n📦 Installing server dependencies..." -ForegroundColor Yellow
cd server
npm install

# Step 2: Setup environment file
Write-Host "`n⚙️  Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file - PLEASE CONFIGURE IT!" -ForegroundColor Green
    Write-Host "  Required: DATABASE_URL, JWT_SECRET, Twilio, Cloudinary" -ForegroundColor Gray
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Step 3: Prisma setup
Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
Write-Host "Make sure PostgreSQL is running!" -ForegroundColor Red

$response = Read-Host "Is your PostgreSQL database ready? (y/n)"
if ($response -eq 'y') {
    Write-Host "Generating Prisma client..." -ForegroundColor Gray
    npx prisma generate
    
    Write-Host "Running database migrations..." -ForegroundColor Gray
    npx prisma migrate dev --name init
    
    Write-Host "✓ Database setup complete!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Skipping database setup" -ForegroundColor Yellow
    Write-Host "Run manually: cd server && npx prisma migrate dev" -ForegroundColor Gray
}

# Step 4: Create admin user
Write-Host "`n👤 Creating admin user..." -ForegroundColor Yellow
$createAdmin = Read-Host "Create admin user now? (y/n)"
if ($createAdmin -eq 'y') {
    Write-Host "Run: node scripts/createAdmin.js after server starts" -ForegroundColor Gray
}

# Step 5: Install client dependencies
Write-Host "`n📱 Installing client dependencies..." -ForegroundColor Yellow
cd ../client
npm install
npm install socket.io-client axios

cd ..

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Configure server/.env file" -ForegroundColor White
Write-Host "  2. Make sure PostgreSQL is running" -ForegroundColor White
Write-Host "  3. Run: cd server && npm run dev" -ForegroundColor Cyan
Write-Host "  4. Run: cd client && npm run dev" -ForegroundColor Cyan
Write-Host "`n📚 Features enabled:" -ForegroundColor Yellow
Write-Host "  ✓ PostgreSQL + Prisma database" -ForegroundColor Green
Write-Host "  ✓ JWT authentication" -ForegroundColor Green
Write-Host "  ✓ Live GPS tracking" -ForegroundColor Green
Write-Host "  ✓ WhatsApp notifications (Twilio)" -ForegroundColor Green
Write-Host "  ✓ Photo uploads (Cloudinary)" -ForegroundColor Green
Write-Host "  ✓ Real-time WebSocket updates" -ForegroundColor Green
Write-Host "`n"
