param([int]$Limit = 20)
$ErrorActionPreference = 'Stop'
$filter = 'resource.type="gae_app" resource.labels.module_id="default" httpRequest.status=500'
Write-Host "Reading last $Limit HTTP 500 request logs..." -ForegroundColor Cyan
& gcloud logging read $filter --limit=$Limit --format=json | Out-String
