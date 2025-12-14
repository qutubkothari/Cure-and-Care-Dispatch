param(
  [string]$ConfigPath = "./deploy.ec2.json"
)

$ErrorActionPreference = 'Stop'

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

Require-Command ssh

if (-not (Test-Path $ConfigPath)) {
  throw "Config file not found: $ConfigPath"
}

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

$ec2Host = $config.host
$user = $config.user
$keyPath = $config.sshKeyPath
$appDir = $config.appDir
$branch = $config.gitBranch
$repoUrl = $config.gitRepoUrl
$jwtSecret = $config.jwtSecret
$webOrigin = $config.webOrigin
$swapGb = $config.swapSizeGb
$clearCaches = if ($config.clearCaches) { 'true' } else { 'false' }

if (-not $ec2Host) { throw "deploy.ec2.json: host is required" }
if (-not $user) { throw "deploy.ec2.json: user is required" }
if (-not $keyPath) { throw "deploy.ec2.json: sshKeyPath is required" }
if (-not (Test-Path $keyPath)) { throw "SSH key file not found: $keyPath" }
if (-not $appDir) { throw "deploy.ec2.json: appDir is required" }
if (-not $branch) { $branch = 'main' }
if (-not $swapGb) { $swapGb = 4 }

if (-not $repoUrl -or $repoUrl -eq 'PUT_YOUR_GIT_REPO_URL_HERE') {
  throw "deploy.ec2.json: gitRepoUrl must be set to your GitHub repo URL"
}

if (-not $jwtSecret -or $jwtSecret -eq 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET' -or $jwtSecret.Length -lt 24) {
  throw "deploy.ec2.json: jwtSecret must be set (min ~24 chars)"
}

if (-not $webOrigin) {
  $webOrigin = "http://$ec2Host:3000"
}

Write-Host "Deploying to $user@$ec2Host ($appDir)" -ForegroundColor Cyan

$remoteEnv = @(
  "APP_DIR='$appDir'",
  "BRANCH='$branch'",
  "REPO_URL='$repoUrl'",
  "JWT_SECRET='$jwtSecret'",
  "WEB_ORIGIN='$webOrigin'",
  "SWAP_GB='$swapGb'",
  "CLEAR_CACHES='$clearCaches'"
) -join ' '

# Upload script content via stdin and run it remotely
$scriptPath = Join-Path $PSScriptRoot "ec2/remote-deploy.sh"
if (-not (Test-Path $scriptPath)) { throw "Missing script: $scriptPath" }

$sshArgs = @(
  '-o', 'StrictHostKeyChecking=accept-new',
  '-i', $keyPath,
  "$user@$ec2Host",
  "$remoteEnv bash -s"
)

Get-Content $scriptPath -Raw | ssh @sshArgs

Write-Host "Deploy finished." -ForegroundColor Green
