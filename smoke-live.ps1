param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = "https://care-and-cure-dispatch.uc.r.appspot.com"
)

$ErrorActionPreference = "Stop"

function Get-Status {
  param([string]$Url)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -MaximumRedirection 5
    return [pscustomobject]@{ Url = $Url; Status = [int]$r.StatusCode; Content = $r.Content; Bytes = [int]$r.RawContentLength }
  } catch {
    $status = $null
    if ($_.Exception.Response) {
      try { $status = $_.Exception.Response.StatusCode.value__ } catch { $status = $null }
    }
    return [pscustomobject]@{ Url = $Url; Status = $status; Content = ""; Bytes = 0 }
  }
}

Write-Host "=== LIVE SMOKE TEST ===" -ForegroundColor Cyan
Write-Host "BaseUrl: $BaseUrl" -ForegroundColor Yellow

$homeResp = Get-Status "$BaseUrl/"
Write-Host "GET / => $($homeResp.Status)" -ForegroundColor Cyan
if ($homeResp.Status -ne 200) { throw "Homepage did not return 200 (got $($homeResp.Status))" }

$health = Get-Status "$BaseUrl/health"
Write-Host "GET /health => $($health.Status)" -ForegroundColor Cyan
if ($health.Status -ne 200) { throw "/health did not return 200 (got $($health.Status))" }

Write-Host "Health body: $($health.Content)" -ForegroundColor Gray

# Extract /assets/* from HTML
$assetUrls = @()
$assetUrls += ([regex]::Matches($homeResp.Content, 'href="(?<u>/assets/[^"]+)"') | ForEach-Object { $_.Groups['u'].Value })
$assetUrls += ([regex]::Matches($homeResp.Content, 'src="(?<u>/assets/[^"]+)"') | ForEach-Object { $_.Groups['u'].Value })
$assetUrls = $assetUrls | Sort-Object -Unique

Write-Host "Found $($assetUrls.Count) assets" -ForegroundColor Cyan
foreach ($u in $assetUrls) {
  Write-Host " - $u" -ForegroundColor Yellow
}

$assetResults = foreach ($u in $assetUrls) {
  $full = "$BaseUrl$u"
  $r = Get-Status $full
  [pscustomobject]@{ Asset = $u; Status = $r.Status; Bytes = $r.Bytes }
}

$assetResults | Format-Table -AutoSize

$badAssets = $assetResults | Where-Object { $_.Status -ne 200 }
if ($badAssets) {
  Write-Host "SMOKE RESULT: FAIL" -ForegroundColor Red
  $badAssets | Format-Table -AutoSize
  exit 1
}

Write-Host "SMOKE RESULT: PASS" -ForegroundColor Green

Write-Host "\n=== DEEP QC (BASIC, NO CREDS) ===" -ForegroundColor Cyan

# SPA fallback should serve HTML for client-side routes
$spa = Get-Status "$BaseUrl/admin"
Write-Host "GET /admin (SPA fallback) => $($spa.Status)" -ForegroundColor Cyan
if ($spa.Status -ne 200) { Write-Host "WARN: /admin did not return 200" -ForegroundColor Yellow }

# Socket.IO polling handshake should respond (status varies by config, but should not be 404)
$sock = Get-Status "$BaseUrl/socket.io/?EIO=4&transport=polling&t=1"
Write-Host "GET /socket.io polling => $($sock.Status)" -ForegroundColor Cyan
if ($sock.Status -eq 404) { Write-Host "WARN: Socket.IO endpoint returned 404" -ForegroundColor Yellow }

# Login endpoint exists?
try {
  $login = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -UseBasicParsing -Method Post -ContentType "application/json" -Body "{}" -MaximumRedirection 5
  Write-Host "POST /api/auth/login => $($login.StatusCode)" -ForegroundColor Cyan
} catch {
  $status = $null
  if ($_.Exception.Response) { $status = $_.Exception.Response.StatusCode.value__ }
  Write-Host "POST /api/auth/login => $status" -ForegroundColor Cyan
}

# Protected endpoint should be 401 without token
$del = Get-Status "$BaseUrl/api/deliveries"
Write-Host "GET /api/deliveries (no token) => $($del.Status)" -ForegroundColor Cyan

Write-Host "\nQC COMPLETE" -ForegroundColor Green
