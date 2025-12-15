# Quick Start Script for Cure & Care Dispatch
# This sets up the database and starts the backend

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setting Up Database & Backend" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "Step 1: Checking PostgreSQL..." -ForegroundColor Yellow

$pgRunning = Get-Process postgres -ErrorAction SilentlyContinue
if ($pgRunning) {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL not detected" -ForegroundColor Red
    Write-Host "`nOptions:" -ForegroundColor Yellow
    Write-Host "  1. Install PostgreSQL: https://www.postgresql.org/download/" -ForegroundColor White
    Write-Host "  2. Use Docker: docker run --name dispatch-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres" -ForegroundColor White
    Write-Host "  3. Use cloud Postgres (Neon, Supabase, etc.)`n" -ForegroundColor White
    
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        exit
    }
}

# Generate Prisma Client
Write-Host "`nStep 2: Generating Prisma Client..." -ForegroundColor Yellow
cd server
npm run db:generate

# Push Database Schema
Write-Host "`nStep 3: Creating database tables..." -ForegroundColor Yellow
npm run db:push

# Start Backend
Write-Host "`nStep 4: Starting backend server..." -ForegroundColor Yellow
Write-Host "`n✓ Backend will start at http://localhost:4000" -ForegroundColor Green
Write-Host "✓ Frontend is running at http://localhost:5173`n" -ForegroundColor Green

npm run dev
