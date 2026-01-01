param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = "https://care-and-cure-dispatch.uc.r.appspot.com",

  [Parameter(Mandatory = $false)]
  [string]$AdminEmail = $env:ADMIN_EMAIL,

  [Parameter(Mandatory = $false)]
  [string]$AdminPassword = $env:ADMIN_PASSWORD,

  [Parameter(Mandatory = $false)]
  [string]$DriverEmail = $env:DRIVER_EMAIL,

  [Parameter(Mandatory = $false)]
  [string]$DriverPassword = $env:DRIVER_PASSWORD
)

$ErrorActionPreference = "Stop"

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
    } catch {}
    $msg = "API call failed: $Method $Path"
    if ($status) { $msg += " (HTTP $status)" }
    if ($respBody) { $msg += "`nResponse: $respBody" }
    throw $msg
  }
}

function Register-User {
  param(
    [Parameter(Mandatory = $true)][string]$Email,
    [Parameter(Mandatory = $true)][string]$Password,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Role
  )

  try {
    $null = Invoke-Json -Method POST -Path '/api/auth/register' -Body @{ email = $Email; password = $Password; name = $Name; role = $Role }
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match 'HTTP 409') {
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
    return Invoke-Json -Method POST -Path '/api/auth/login' -Body @{ email = $Email; password = $Password }
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match 'HTTP 401') {
      Write-Host "Login unauthorized for $Email; attempting to register..." -ForegroundColor Yellow
      Register-User -Email $Email -Password $Password -Name $Name -Role $Role
      return Invoke-Json -Method POST -Path '/api/auth/login' -Body @{ email = $Email; password = $Password }
    }
    throw
  }
}

if (-not $AdminEmail) { $AdminEmail = 'admin@cure.com' }
if (-not $AdminPassword) { $AdminPassword = 'admin123' }
if (-not $DriverEmail) { $DriverEmail = 'driver@cure.com' }
if (-not $DriverPassword) { $DriverPassword = 'driver123' }

Write-Host "=== FEATURE SMOKE (LIVE) ===" -ForegroundColor Cyan
Write-Host "BaseUrl: $BaseUrl" -ForegroundColor Yellow

$adminLogin = Login-OrRegister -Email $AdminEmail -Password $AdminPassword -Name 'Admin User' -Role 'ADMIN'
$driverLogin = Login-OrRegister -Email $DriverEmail -Password $DriverPassword -Name 'Driver User' -Role 'DRIVER'

$adminHeaders = @{ Authorization = "Bearer $($adminLogin.token)" }
$driverHeaders = @{ Authorization = "Bearer $($driverLogin.token)" }

Write-Host "Auth OK. Admin role: $($adminLogin.user.role) Driver role: $($driverLogin.user.role)" -ForegroundColor Green

# Create delivery with fields expected by UI
$inv = "SMK-" + (Get-Date).ToString('yyyyMMddHHmmss')
$create = Invoke-Json -Method POST -Path '/api/deliveries' -Headers $adminHeaders -Body @{
  invoiceNumber = $inv
  customerName = 'Smoke Customer'
  customerPhone = '9999999999'
  address = 'Smoke Address'
  items = 'Test items'
  amount = 123.45
  priority = 'HIGH'
  driverId = $driverLogin.user.id
}

$deliveryId = $create.delivery.id
Write-Host "Created delivery: $deliveryId" -ForegroundColor Cyan

# Read back and assert fields exist
$get = Invoke-Json -Method GET -Path "/api/deliveries/$deliveryId" -Headers $adminHeaders
if (-not $get.delivery) { throw "Missing delivery in GET response" }
if ($get.delivery.amount -lt 0) { throw "Unexpected amount" }
if (-not $get.delivery.items) { throw "Missing items" }
if (-not $get.delivery.priority) { throw "Missing priority" }

# Update delivery (admin)
$upd = Invoke-Json -Method PUT -Path "/api/deliveries/$deliveryId" -Headers $adminHeaders -Body @{
  customerName = 'Smoke Customer Updated'
  items = 'Updated items'
  amount = 200
  priority = 'NORMAL'
}
if ($upd.delivery.customerName -ne 'Smoke Customer Updated') { throw "Update failed (customerName)" }

# Driver marks delivered using client-like payload
$del = Invoke-Json -Method PUT -Path "/api/deliveries/$deliveryId/status" -Headers $driverHeaders -Body @{
  status = 'DELIVERED'
  completedAt = (Get-Date).ToString('o')
  endLocation = @{ lat = 12.9716; lng = 77.5946; accuracy = 10; gpsTimestamp = [int64](Get-Date -UFormat %s) }
  proofUrl = 'https://example.com/proof.jpg'
  proofUrls = @('https://example.com/proof.jpg','https://example.com/proof2.jpg')
}
if ($del.delivery.status -ne 'DELIVERED') { throw "Status update failed" }

# Tracking exists
$trk = Invoke-Json -Method GET -Path "/api/tracking/delivery/$deliveryId" -Headers $adminHeaders
if (-not $trk.tracking) { throw "Missing tracking" }

# Upload endpoint should either work OR return 503 (configured check)
try {
  $u = Invoke-Json -Method POST -Path '/api/upload/images' -Headers $adminHeaders -Body @{ }
} catch {
  $m = $_.Exception.Message
  if ($m -match 'HTTP 503') {
    Write-Host "Upload skipped (Cloudinary not configured)" -ForegroundColor Yellow
  } else {
    Write-Host $m -ForegroundColor Red
    throw
  }
}

# Cleanup
$null = Invoke-Json -Method DELETE -Path "/api/deliveries/$deliveryId" -Headers $adminHeaders
Write-Host "Cleanup OK" -ForegroundColor Green

Write-Host "FEATURE SMOKE RESULT: PASS" -ForegroundColor Green
