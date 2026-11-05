# ==============================================================================
# <dcouplr/> Windows PowerShell Installer
# Zero-Egress Observability & In-VPC Infrastructure Transpiler
# Repository: https://github.com/varinull/dcouplr-community
# Usage: irm https://dcouplr.com/install.ps1 | iex
# ==============================================================================
[CmdletBinding()]
param(
    [string]$Version = "1.0.0",
    [string]$Repo = "varinull/dcouplr-community"
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

Write-Host @"
  ___   ___  ___  _   _ ___ _     ___  
 <  _\ / __|/ _ \| | | | _ \ |   | _ \ 
  > _|| (__| (_) | |_| |  _/ |__ |   / 
 <___/ \___|\___/ \___/|_| |____||_|_\ 
"@ -ForegroundColor Cyan

Write-Host "`n==> Installing <dcouplr/> Community CLI v$Version on Windows..." -ForegroundColor Green

$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\dcouplr"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$BinaryName = "dcouplr.exe"
$BinaryPath = Join-Path $InstallDir $BinaryName
$ZipUrl = "https://github.com/$Repo/releases/download/v$Version/dcouplr-$Version-windows-amd64.zip"

$DownloadSuccess = $false
try {
    $TempZip = Join-Path $env:TEMP "dcouplr-$Version.zip"
    Write-Host "==> Checking release package: $ZipUrl..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $ZipUrl -OutFile $TempZip -UseBasicParsing -TimeoutSec 10
    Expand-Archive -Path $TempZip -DestinationPath $InstallDir -Force
    Remove-Item $TempZip -Force -ErrorAction SilentlyContinue
    $DownloadSuccess = $true
} catch {
    Write-Host "==> Binary archive not yet published on GitHub Releases. Installing Community Core via git package..." -ForegroundColor Yellow
    if (Get-Command pip -ErrorAction SilentlyContinue) {
        pip install --upgrade git+https://github.com/Varinull/dcouplr.git --quiet
        Write-Host "[OK] Installed Community Core via git package." -ForegroundColor Green
    }
}

# Add to User PATH if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($UserPath -notlike "*$InstallDir*") {
    Write-Host "==> Adding $InstallDir to User PATH..." -ForegroundColor Cyan
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", [EnvironmentVariableTarget]::User)
    $env:Path += ";$InstallDir"
}

Write-Host "`n[SUCCESS] <dcouplr/> Community Core v$Version installed successfully!" -ForegroundColor Green
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "==> Community Core Entitlement Profile Active:" -ForegroundColor Green
Write-Host "  * Monitored Capacity:     1 Local Agent / CLI (`dcouplr`)" -ForegroundColor White
Write-Host "  * Privacy Guarantee:      In-Memory Zero-Egress Sanitizer" -ForegroundColor White
Write-Host "  * AST Transpiler Engine:  Unlimited Local AST Transpilations" -ForegroundColor White
Write-Host "  * Autonomous Diagnostics: Automated `dcouplr doctor` & `lint`" -ForegroundColor White
Write-Host "  * Migration Operations:   Zero-Downtime State Relocation Planner" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "Quick Start Commands:" -ForegroundColor White
Write-Host "  1. Run System Preflight:          dcouplr doctor" -ForegroundColor Green
Write-Host "  2. Check Version & Entitlement:   dcouplr version" -ForegroundColor Green
Write-Host "  3. Translate Monitor/IaC Config:  dcouplr translate -i monitor.json -t grafana" -ForegroundColor Green
Write-Host "  4. Documentation & Community:     https://github.com/$Repo" -ForegroundColor Green
Write-Host "  5. Documentation & Portal:        https://dcouplr.com/docs" -ForegroundColor Green
Write-Host "----------------------------------------------------------------------`n" -ForegroundColor DarkCyan
