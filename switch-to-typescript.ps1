# Switch server to TypeScript with Prisma

Write-Host "`n🔄 Switching to TypeScript server with database..." -ForegroundColor Cyan

# Backup current index.js
Copy-Item "server/src/index.js" "server/src/index.js.backup"
Write-Host "✅ Backed up index.js to index.js.backup" -ForegroundColor Green

# Replace with new TypeScript version
Copy-Item "server/src/index.new.ts" "server/src/index.ts" -Force
Remove-Item "server/src/index.js" -Force
Write-Host "✅ Switched to TypeScript server" -ForegroundColor Green

# Update package.json start script
Write-Host "`n📝 Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts.start = "cd server && npx tsx src/index.ts"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✅ Updated start script" -ForegroundColor Green

Write-Host "`n✅ Done! Server now uses:" -ForegroundColor Green
Write-Host "   • TypeScript (index.ts)" -ForegroundColor White
Write-Host "   • Prisma ORM" -ForegroundColor White
Write-Host "   • Real authentication" -ForegroundColor White
Write-Host "   • WebSocket support" -ForegroundColor White
Write-Host "`n⚠️  Run setup-cloudsql.ps1 first to configure database!" -ForegroundColor Yellow
