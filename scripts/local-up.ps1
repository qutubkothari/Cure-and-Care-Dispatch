$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name. Install it and re-run."
  }
}

Require-Command docker
Require-Command npm

Write-Host "Starting Postgres (docker compose)..."
docker compose up -d

if (-not (Test-Path "apps/api/.env")) {
  Copy-Item "apps/api/.env.example" "apps/api/.env"
  Write-Host "Created apps/api/.env from example"
}
if (-not (Test-Path "apps/assistant/.env")) {
  Copy-Item "apps/assistant/.env.example" "apps/assistant/.env"
  Write-Host "Created apps/assistant/.env from example"
}

Write-Host "Installing dependencies..."
npm install

Write-Host "Generating Prisma client + applying migrations..."
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api

Write-Host "Starting dev servers (web/api/assistant)..."
npm run dev
