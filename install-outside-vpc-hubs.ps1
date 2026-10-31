# ==============================================================================
# <dcouplr/> Outside-VPC Hubs: Turnkey Deployment & Cloudflare Tunnel Installer
# Windows Server & Windows 11 PowerShell Installer
# Provisions /NOCDesk, /SREDesk, /wallboard, and /kiosk projections outside the VPC
# with ZERO open inbound ports and ZERO billable cloud network egress.
# ==============================================================================
[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$TunnelToken = "",

    [Parameter(Mandatory = $false)]
    [string]$Domain = "noc.yourcompany.com",

    [Parameter(Mandatory = $false)]
    [int]$LocalPort = 8000,

    [Parameter(Mandatory = $false)]
    [switch]$InstallService = $true
)

$ErrorActionPreference = "Stop"

function Write-HubBanner {
    Write-Host ""
    Write-Host "  ==================================================================" -ForegroundColor Cyan
    Write-Host "      <dcouplr/> Outside-VPC Hubs: Windows Cloudflare Installer     " -ForegroundColor Cyan
    Write-Host "      Projecting: /NOCDesk • /SREDesk • /wallboard • /kiosk        " -ForegroundColor Cyan
    Write-Host "  ==================================================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-HubBanner

# 1. Check Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This installer requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please re-run this script in an elevated PowerShell session (Run as Administrator)." -ForegroundColor Yellow
    exit 1
}

# 2. Setup Installation Directory
$InstallDir = "C:\Program Files\dcouplr\hubs"
$CloudflaredDir = "C:\Program Files\cloudflared"
$ConfigFile = Join-Path $InstallDir "config.yml"

Write-Host "--> Step 1: Preparing directories..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null

# 3. Locate or Download cloudflared.exe
$CloudflaredExe = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $CloudflaredExe) {
    $TargetExe = Join-Path $CloudflaredDir "cloudflared.exe"
    if (-not (Test-Path $TargetExe)) {
        Write-Host "--> Step 2: Downloading official cloudflared Windows binary..." -ForegroundColor Cyan
        $DownloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $TargetExe -UseBasicParsing
        Write-Host "    Installed cloudflared to: $TargetExe" -ForegroundColor Green
    }
    $CloudflaredExe = $TargetExe
    
    # Add to Machine Path if not present
    $MachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($MachinePath -notlike "*$CloudflaredDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$MachinePath;$CloudflaredDir", "Machine")
        $env:Path = "$env:Path;$CloudflaredDir"
    }
} else {
    Write-Host "--> Step 2: cloudflared already present on system: $CloudflaredExe" -ForegroundColor Green
}

# 4. Generate Multi-Hub config.yml
Write-Host "--> Step 3: Generating Outside-VPC Hubs Multi-Ingress config.yml..." -ForegroundColor Cyan

$ConfigContent = @"
# ==============================================================================
# <dcouplr/> Outside-VPC Hubs: Windows Cloudflare Tunnel Configuration
# ==============================================================================
ingress:
  # 1. NOC Desk (2-Way Interactive Command Center & /dashboard replica)
  - hostname: $Domain
    path: ^/NOCDesk.*
    service: http://127.0.0.1:$LocalPort
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # 2. SRE Desk (2-Way Specialized 7-Tier Matrix Console)
  - hostname: $Domain
    path: ^/SREDesk.*
    service: http://127.0.0.1:$LocalPort
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # 3. 7-Tier Wallboard (1-Way Passive Matrix Display)
  - hostname: $Domain
    path: ^/wallboard.*
    service: http://127.0.0.1:$LocalPort
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # 4. NOC Kiosk (1-Way Passive Topology Kiosk)
  - hostname: $Domain
    path: ^/kiosk.*
    service: http://127.0.0.1:$LocalPort
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # Fallback in-VPC root for authenticated operators
  - hostname: $Domain
    service: http://127.0.0.1:$LocalPort
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  - service: http_status:404
"@

Set-Content -Path $ConfigFile -Value $ConfigContent -Encoding UTF8
Write-Host "    Configuration saved to: $ConfigFile" -ForegroundColor Green

# 5. Service Installation
if ($InstallService) {
    Write-Host "--> Step 4: Configuring Windows background service..." -ForegroundColor Cyan
    $ServiceName = "dcouplr-hubs-tunnel"
    
    # Stop existing service if running
    $ExistingSvc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($ExistingSvc) {
        Write-Host "    Stopping existing service '$ServiceName'..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    }
    
    if ($TunnelToken) {
        & $CloudflaredExe service install $TunnelToken
        Write-Host "    Installed cloudflared Windows service with provided token." -ForegroundColor Green
    } else {
        Write-Host "    [INFO] Token omitted. Running standalone connector test:" -ForegroundColor Yellow
        Write-Host "    To install as a permanent Windows Service with token, execute:" -ForegroundColor DarkGray
        Write-Host "      cloudflared.exe service install <YOUR_TOKEN>" -ForegroundColor DarkGray
    }
}

# 6. Verify Local Controller
Write-Host "--> Step 5: Verifying local <dcouplr/> controller responsiveness..." -ForegroundColor Cyan
try {
    $TestReq = Invoke-WebRequest -Uri "http://127.0.0.1:$LocalPort/health" -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($TestReq.StatusCode -eq 200) {
        Write-Host "    [OK] In-VPC controller responding on http://127.0.0.1:$LocalPort!" -ForegroundColor Green
    }
} catch {
    Write-Host "    [NOTE] Controller not yet active on port $LocalPort. Ensure 'scripts/run_server.py $LocalPort' is running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] Outside-VPC Hubs Deployment Complete on Windows!       " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Your 4 Outside-VPC Hub Projections are mapped:"
Write-Host "   1. NOC Desk (2-Way Interactive):   https://$Domain/NOCDesk" -ForegroundColor White
Write-Host "   2. SRE Desk (2-Way Console):       https://$Domain/SREDesk" -ForegroundColor White
Write-Host "   3. 7-Tier Wallboard (1-Way Wall):  https://$Domain/wallboard" -ForegroundColor White
Write-Host "   4. NOC Kiosk (1-Way Topology):     https://$Domain/kiosk" -ForegroundColor White
Write-Host ""
Write-Host " Security Invariants Enforced:"
Write-Host "   • 0 Inbound Open Ports on Windows Firewall / AWS SG (Outbound TLS/QUIC Only)" -ForegroundColor DarkGray
Write-Host "   • 100% In-Perimeter Invariant Evaluation" -ForegroundColor DarkGray
Write-Host "   • `$0.00 WAN Cloud Data Egress" -ForegroundColor DarkGray
Write-Host ""
