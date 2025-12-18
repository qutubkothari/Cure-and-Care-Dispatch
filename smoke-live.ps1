param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = "https://care-and-cure-dispatch.uc.r.appspot.com",

  [Parameter(Mandatory = $false)]
  [string]$AdminEmail,

  [Parameter(Mandatory = $false)]
  [string]$AdminPassword,

  [Parameter(Mandatory = $false)]
  [string]$DriverEmail,

  [Parameter(Mandatory = $false)]
  [string]$DriverPassword
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

function Invoke-Json {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $false)][hashtable]$Headers,
    [Parameter(Mandatory = $false)]$Body
  )

  $uri = if ($Path.StartsWith('http')) { $Path } else { "$BaseUrl$Path" }
  $params = @{
    Uri = $uri
    Method = $Method
    UseBasicParsing = $true
    MaximumRedirection = 5
  }
  if ($Headers) { $params.Headers = $Headers }
  if ($null -ne $Body) {
    $params.ContentType = 'application/json'
    $params.Body = ($Body | ConvertTo-Json -Depth 12)
  }
  try {
    return Invoke-RestMethod @params
  } catch {
    $status = $null
    $respBody = $null
    try {
      if ($_.Exception.Response) {
        $status = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $respBody = $reader.ReadToEnd()
        }
      }
    } catch {
      # ignore diagnostics failure
    }
    $msg = "API call failed: $Method $Path"
    if ($status) { $msg += " (HTTP $status)" }
    if ($respBody) { $msg += "`nResponse: $respBody" }
    throw $msg
  }
}

function Login-AndGetToken {
  param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password
  )
  $resp = Invoke-Json -Method 'POST' -Path '/api/auth/login' -Body @{ email = $Email; password = $Password }
  if (-not $resp.token) { throw "Login failed for $Email (no token in response)" }
  return $resp
}

function Register-User {
  param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Role
  )

  try {
    $null = Invoke-Json -Method 'POST' -Path '/api/auth/register' -Body @{ email = $Email; password = $Password; name = $Name; role = $Role }
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match 'HTTP 409') {
      # Email already exists; ignore
      return
    }
    throw
  }
}

function Login-OrRegister {
  param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Role
  )

  try {
    return Login-AndGetToken -Email $Email -Password $Password
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match 'HTTP 401') {
      Write-Host "Login unauthorized for $Email; attempting to register..." -ForegroundColor Yellow
      Register-User -Email $Email -Password $Password -Name $Name -Role $Role
      return Login-AndGetToken -Email $Email -Password $Password
    }
    throw
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

$haveCreds = $AdminEmail -and $AdminPassword -and $DriverEmail -and $DriverPassword
if (-not $haveCreds) {
  Write-Host "\n(Auth deep QC skipped) Provide -AdminEmail/-AdminPassword/-DriverEmail/-DriverPassword to run it." -ForegroundColor Yellow
  exit 0
}

Write-Host "\n=== DEEP QC (AUTHENTICATED) ===" -ForegroundColor Cyan
Write-Host "Logging in as Admin + Driver..." -ForegroundColor Gray

$adminLogin = $null
$driverLogin = $null
try {
  $adminLogin = Login-OrRegister -Email $AdminEmail -Password $AdminPassword -Name 'Admin User' -Role 'ADMIN'
  $driverLogin = Login-OrRegister -Email $DriverEmail -Password $DriverPassword -Name 'Driver User' -Role 'DRIVER'
} catch {
  Write-Host "AUTH QC RESULT: FAIL (login)" -ForegroundColor Red
  throw
}

$adminToken = $adminLogin.token
$driverToken = $driverLogin.token
$adminUser = $adminLogin.user
$driverUser = $driverLogin.user

Write-Host ("Admin role: {0}  Driver role: {1}" -f $adminUser.role, $driverUser.role) -ForegroundColor Cyan
if ($adminUser.role -ne 'ADMIN') { throw "Admin credentials did not return ADMIN role" }
if ($driverUser.role -ne 'DRIVER') { throw "Driver credentials did not return DRIVER role" }

$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$driverHeaders = @{ Authorization = "Bearer $driverToken" }

Write-Host "Auth sanity: /api/auth/me" -ForegroundColor Cyan
$meAdmin = Invoke-Json -Method 'GET' -Path '/api/auth/me' -Headers $adminHeaders
$meDriver = Invoke-Json -Method 'GET' -Path '/api/auth/me' -Headers $driverHeaders
if (-not $meAdmin.user.id) { throw "Admin /me missing user" }
if (-not $meDriver.user.id) { throw "Driver /me missing user" }

Write-Host "Admin checks: users, deliveries, petty cash stats, audit logs" -ForegroundColor Cyan
$users = Invoke-Json -Method 'GET' -Path '/api/users' -Headers $adminHeaders
Write-Host ("Users count: {0}" -f ($users | Measure-Object).Count) -ForegroundColor Gray

$delResp = Invoke-Json -Method 'GET' -Path '/api/deliveries' -Headers $adminHeaders
$delCount = ($delResp.deliveries | Measure-Object).Count
Write-Host ("Deliveries count (admin): {0}" -f $delCount) -ForegroundColor Gray

$pcStats = Invoke-Json -Method 'GET' -Path '/api/petty-cash/stats' -Headers $adminHeaders
Write-Host ("Petty cash total amount: {0}" -f $pcStats.stats.total) -ForegroundColor Gray

$audit = Invoke-Json -Method 'GET' -Path '/api/audit?limit=5&offset=0' -Headers $adminHeaders
Write-Host ("Audit logs fetched: {0} / total: {1}" -f (($audit.logs | Measure-Object).Count), $audit.total) -ForegroundColor Gray

Write-Host "Admin checks: reports (delivery-summary last 7 days)" -ForegroundColor Cyan
$dateTo = (Get-Date).ToString('yyyy-MM-dd')
$dateFrom = (Get-Date).AddDays(-7).ToString('yyyy-MM-dd')
$report = Invoke-Json -Method 'GET' -Path "/api/reports/data?type=delivery-summary&dateFrom=$dateFrom&dateTo=$dateTo" -Headers $adminHeaders
if (-not $report.summary) { throw "Report response missing summary" }
Write-Host ("Report total deliveries: {0}" -f $report.summary.total) -ForegroundColor Gray

Write-Host "Driver checks: deliveries + petty cash visibility" -ForegroundColor Cyan
$driverDeliveries = Invoke-Json -Method 'GET' -Path '/api/deliveries' -Headers $driverHeaders
Write-Host ("Deliveries visible to driver: {0}" -f (($driverDeliveries.deliveries | Measure-Object).Count)) -ForegroundColor Gray

$driverPetty = Invoke-Json -Method 'GET' -Path '/api/petty-cash' -Headers $driverHeaders
Write-Host ("Petty cash entries visible to driver: {0}" -f (($driverPetty.entries | Measure-Object).Count)) -ForegroundColor Gray

Write-Host "CRUD flow: create test delivery -> driver marks DELIVERED -> verify tracking -> delete" -ForegroundColor Cyan
$qcInvoice = "QC-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$created = Invoke-Json -Method 'POST' -Path '/api/deliveries' -Headers $adminHeaders -Body @{
  invoiceNumber = $qcInvoice
  customerName = 'QC Test Customer'
  customerPhone = ''
  address = 'QC Test Address'
  driverId = $driverUser.id
}

$deliveryId = $created.delivery.id
if (-not $deliveryId) { throw "Create delivery did not return delivery.id" }
Write-Host ("Created delivery id: {0}" -f $deliveryId) -ForegroundColor Gray

# Driver should see it
$driverAfterCreate = Invoke-Json -Method 'GET' -Path '/api/deliveries' -Headers $driverHeaders
$found = $false
foreach ($d in ($driverAfterCreate.deliveries | ForEach-Object { $_ })) {
  if ($d.id -eq $deliveryId) { $found = $true; break }
}
if (-not $found) { throw "Driver cannot see newly assigned delivery" }

# Driver marks delivered
$updated = Invoke-Json -Method 'PUT' -Path "/api/deliveries/$deliveryId/status" -Headers $driverHeaders -Body @{
  status = 'DELIVERED'
  latitude = 0
  longitude = 0
  accuracy = 10
  notes = 'QC delivered'
}
if ($updated.delivery.status -ne 'DELIVERED') { throw "Delivery status update failed" }

# Admin verifies tracking history
$tracking = Invoke-Json -Method 'GET' -Path "/api/tracking/delivery/$deliveryId" -Headers $adminHeaders
$trackCount = ($tracking.tracking | Measure-Object).Count
Write-Host ("Tracking records for delivery: {0}" -f $trackCount) -ForegroundColor Gray
if ($trackCount -lt 1) { throw "Expected at least 1 tracking record" }

# Cleanup
Invoke-Json -Method 'DELETE' -Path "/api/deliveries/$deliveryId" -Headers $adminHeaders | Out-Null
Write-Host "Cleanup: test delivery deleted" -ForegroundColor Gray

Write-Host "\nAUTH QC RESULT: PASS" -ForegroundColor Green
