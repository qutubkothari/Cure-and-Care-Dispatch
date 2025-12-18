param([int]$Limit = 10)
$ErrorActionPreference = 'Stop'
$filter = 'resource.type="gae_app" resource.labels.module_id="default"'
Write-Host "Reading last $Limit default service log entries..." -ForegroundColor Cyan
& gcloud logging read $filter --limit=$Limit --format=json | Out-String
