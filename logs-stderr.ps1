param([int]$Limit = 50)
$ErrorActionPreference = 'Stop'
$filter = 'resource.type="gae_app" resource.labels.module_id="default" logName="projects/care-and-cure-dispatch/logs/stderr"'
Write-Host "Reading last $Limit stderr entries..." -ForegroundColor Cyan
& gcloud logging read $filter --limit=$Limit --format='value(textPayload)' | Out-String
