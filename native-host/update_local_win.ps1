param(
  [string]$ExtensionId,
  [string]$InstallDir = "$env:APPDATA\VideoTextHost",
  [string]$SourceDir
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..")).Path
}

function Assert-ExtensionId([string]$Id) {
  if ($Id -notmatch "^[a-p]{32}$") {
    throw "Invalid Chrome extension ID: $Id"
  }
}

$repoRoot = Resolve-RepoRoot
if (-not $ExtensionId) {
  $idFile = Join-Path $repoRoot ".github\EXTENSION_ID"
  if (Test-Path $idFile) {
    $ExtensionId = (Get-Content -Raw $idFile).Trim()
  }
}
if (-not $ExtensionId) {
  $installedIdFile = Join-Path $InstallDir "extension-id.txt"
  if (Test-Path $installedIdFile) {
    $ExtensionId = (Get-Content -Raw $installedIdFile).Trim()
  }
}

Assert-ExtensionId $ExtensionId

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

if ($SourceDir) {
  $resolvedSource = (Resolve-Path $SourceDir).Path
  Get-Process video-text-transcriber,native-host -ErrorAction SilentlyContinue |
    Stop-Process -Force
  Start-Sleep -Milliseconds 500

  foreach ($name in @("video-text-transcriber.exe", "native-host.exe", "_internal")) {
    $sourcePath = Join-Path $resolvedSource $name
    if (-not (Test-Path $sourcePath)) {
      throw "Missing backend artifact: $sourcePath"
    }
    $targetPath = Join-Path $InstallDir $name
    Remove-Item -LiteralPath $targetPath -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path $sourcePath -Destination $InstallDir -Recurse -Force
  }

  foreach ($optional in @("ffmpeg.exe", "node")) {
    $sourcePath = Join-Path $resolvedSource $optional
    if (Test-Path $sourcePath) {
      $targetPath = Join-Path $InstallDir $optional
      Remove-Item -LiteralPath $targetPath -Recurse -Force -ErrorAction SilentlyContinue
      Copy-Item -Path $sourcePath -Destination $InstallDir -Recurse -Force
    }
  }
}

$hostBat = Join-Path $InstallDir "host-win.bat"
Set-Content -LiteralPath $hostBat -Encoding ASCII -Value @(
  "@echo off",
  '"%~dp0native-host.exe" %*'
)

Set-Content -LiteralPath (Join-Path $InstallDir "extension-id.txt") `
  -Encoding ASCII -NoNewline -Value $ExtensionId

$manifest = [ordered]@{
  name = "com.video_text.transcriber"
  description = "VideoText Transcriber Native Host"
  path = $hostBat
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
}
$manifestPath = Join-Path $InstallDir "manifest.json"
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.video_text.transcriber" /ve /t REG_SZ /d $manifestPath /f | Out-Null
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.video_text.transcriber" /ve /t REG_SZ /d $manifestPath /f | Out-Null

Write-Host "Registered Native Host for extension ID: $ExtensionId"
Write-Host "Manifest: $manifestPath"
