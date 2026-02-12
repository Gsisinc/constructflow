param(
  [Parameter(Mandatory = $true)]
  [string]$ServerIp,

  [Parameter(Mandatory = $true)]
  [string]$DbPassword,

  [Parameter(Mandatory = $true)]
  [string]$MinioPassword,

  [string]$RemoteDir = "/root/apps/constructflow"
)

$ErrorActionPreference = "Stop"

$templatePath = Join-Path $PSScriptRoot "docker-compose.vps.yml"
if (-not (Test-Path $templatePath)) {
  Write-Error "Template not found at $templatePath"
}

$content = Get-Content $templatePath -Raw
$content = $content.Replace("CHANGE_THIS_DB_PASSWORD", $DbPassword)
$content = $content.Replace("CHANGE_THIS_MINIO_PASSWORD", $MinioPassword)

$tempFile = Join-Path $env:TEMP "docker-compose.vps.generated.yml"
Set-Content -Path $tempFile -Value $content -Encoding UTF8

Write-Host "Copying compose file to $ServerIp:$RemoteDir/docker-compose.yml ..."
scp $tempFile "root@$ServerIp`:$RemoteDir/docker-compose.yml"

Write-Host "Running docker compose validation + startup on VPS ..."
ssh "root@$ServerIp" "cd $RemoteDir && docker compose config && docker compose up -d && docker compose ps"

Remove-Item $tempFile -Force
Write-Host "Done. Containers should now be running on $ServerIp"
