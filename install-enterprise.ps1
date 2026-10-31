# ==============================================================================
# <dcouplr/> Paid Commercial & Enterprise Tier Installer (Windows PowerShell)
# Zero-Egress Observability & In-VPC Infrastructure Transpiler
# Features:
#   1. Offline Ed25519 Entitlement Token Validation ($0 Egress)
#   2. Enterprise Node Quota & Multi-VPC Mesh Activation
#   3. Air-Gapped Distribution Setup (Containers, Helm, CRDs, SBOM)
#
# Usage:
#   irm https://dcouplr.com/install-enterprise.ps1 | iex
#   $env:DCOUPLR_LICENSE_KEY="DCL-PRO-ACME-8821B47C9"; irm https://dcouplr.com/install-enterprise.ps1 | iex
# ==============================================================================
[CmdletBinding()]
param(
    [string]$LicenseKey = $env:DCOUPLR_LICENSE_KEY,
    [string]$Version = "1.0.0",
    [string]$Org = $env:DCOUPLR_ORG
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

Write-Host @"
  ___   ___  ___  _   _ ___ _     ___  
 <  _\ / __|/ _ \| | | | _ \ |   | _ \ 
  > _|| (__| (_) | |_| |  _/ |__ |   / 
 <___/ \___|\___/ \___/|_| |____||_|_\ 
"@ -ForegroundColor Cyan

Write-Host "======================================================================" -ForegroundColor Magenta
Write-Host "   <dcouplr/> Commercial & Enterprise Tier Installer v$Version" -ForegroundColor Magenta
Write-Host "======================================================================" -ForegroundColor Magenta

# 1. Prompt for License Key if not passed
if (-not $LicenseKey) {
    Write-Host "`n==> Step 2 of 4: Enter your Commercial Entitlement Key:" -ForegroundColor Yellow
    Write-Host "    Format: DCL-PRO-<ORG>-<SIG> or DCL-CLUS-<TIER>-<ORG>-<SIG>" -ForegroundColor Gray
    $LicenseKey = Read-Host "    License Key"
    if (-not $LicenseKey) {
        Write-Host "`n[ERROR] A valid Commercial License Key is required for Enterprise activation." -ForegroundColor Red
        Write-Host "    To obtain a key, subscribe at: https://dcouplr.com/#pricing" -ForegroundColor Cyan
        exit 1
    }
}

# 2. Base Installation
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\dcouplr"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

Write-Host "`n==> Step 1 of 4: Installing <dcouplr/> Engine..." -ForegroundColor Green
if (Get-Command pip -ErrorAction SilentlyContinue) {
    pip install --upgrade git+https://github.com/Varinull/dcouplr.git --quiet
    Write-Host "[OK] Installed <dcouplr/> engine successfully." -ForegroundColor Green
}

# Add to User PATH if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($UserPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", [EnvironmentVariableTarget]::User)
    $env:Path += ";$InstallDir"
}

# 3. Offline Ed25519 License Key Activation
Write-Host "`n==> Step 3 of 4: Activating Commercial License Key Offline ($0 Egress)..." -ForegroundColor Green
if ($Org) {
    dcouplr auth login --license-key "$LicenseKey" --org "$Org"
} else {
    dcouplr auth login --license-key "$LicenseKey"
}

# 4. Display Active Commercial Entitlements
Write-Host "`n==> Step 4 of 4: Inspecting Active Entitlement Status:" -ForegroundColor Green
dcouplr auth status

# 5. Air-Gapped Distribution Download Reference
Write-Host "`n======================================================================" -ForegroundColor DarkCyan
Write-Host "[SUCCESS] <dcouplr/> Enterprise Tier Activated Successfully!" -ForegroundColor Green
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "Enterprise Deployment Options:" -ForegroundColor White
Write-Host "  1. Run System Preflight:          dcouplr doctor" -ForegroundColor Green
Write-Host "  2. Launch In-VPC Cluster Daemon:  dcouplr serve --port 8000" -ForegroundColor Green
Write-Host "  3. Air-Gapped Helm & SBOM Bundle: curl.exe -fsSL https://dcouplr.com/dcouplr-enterprise-v$Version.tar.gz -o dcouplr-enterprise-v$Version.tar.gz" -ForegroundColor Green
Write-Host "  4. Documentation & Portal:        https://dcouplr.com/docs" -ForegroundColor Green
Write-Host "======================================================================`n" -ForegroundColor DarkCyan
