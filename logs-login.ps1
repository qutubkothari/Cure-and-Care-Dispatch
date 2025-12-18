param(
  [Parameter(Mandatory = $false)]
  [int]$Limit = 50
)

$ErrorActionPreference = 'Stop'

$filter = @'
resource.type="gae_app"
resource.labels.module_id="default"
httpRequest.requestUrl:"/api/auth/login"
'@ -replace "\r\n", " " -replace "\n", " "

Write-Host "Reading last $Limit login-related log entries..." -ForegroundColor Cyan
Write-Host "Filter: $filter" -ForegroundColor Gray

# Use JSON output to preserve stack traces if present in textPayload/jsonPayload.
& gcloud logging read $filter --limit=$Limit --format=json | Out-String
