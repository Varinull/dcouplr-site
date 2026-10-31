# Operations Runbook: 24x7 Remote NOC Wallboard & Display Options

**Document Identifier:** `VA-RUNBOOK-WALLBOARD-001`  
**Classification:** Enterprise Standard Operating Procedure & Field Deployment Guide  
**Target Audience:** NOC Operators, SREs, Cloud Infrastructure Engineers, Display Admins  
**Display Options:**
- **Option 1: NOC Desk (Operator Recommended)** — `<dcouplr/> AirLock™` (Zero-Trust Ingress Tunnel • Exact In-VPC Replica without Financial/Simulator Panels)
- **Option 2: Wallboard (Air-Gapped SecOps)** — `<dcouplr/> PulseCast™` (Edge CDN Pulse Mirror • Standalone Public TV Display)
**Full Architectural Master:** Available in Admin Vault at `ProjectAssistant/admin-runbooks/ADMIN-RUNBOOK-WALLBOARD-ARCHITECTURE-MASTER.md`

---

## 1. Executive Summary & Display Options Matrix

Modern enterprise operations centers require visual, real-time infrastructure displays running 24 hours a day, 7 days a week across office TV walls, Network Operations Centers (NOC), and SRE workstations.

`<dcouplr/>` provides two distinct, cost-optimized deployment options:

| Display Option | Best For | Architecture | Where It Runs | Security Profile | Bandwidth / Egress |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option 1: NOC Desk (Operator Recommended)** | SRE War-Rooms, Operator Desks | **`<dcouplr/> AirLock™`**: Outbound mTLS tunnel to Cloudflare Zero Trust. Serves exact replica of in-VPC dashboard with financial and simulator panels hidden. | Workstation Chrome / Edge browser | **Zero Open Ports on VPC**. Authenticated via permanent Service Tokens. | ~129 MB / month (~$0.01/mo WAN fees) |
| **Option 2: Wallboard (Air-Gapped SecOps)** | Public Office TV Walls, Overhead Kiosks | **`<dcouplr/> PulseCast™`**: Unidirectional publisher pushes 1.14 KB JSON snapshot every 5s to an edge CDN (Cloudflare R2 / S3). | Wall TV Raspberry Pi / Intel N100 | **VPC receives ZERO inbound connections**. Fully air-gapped from internal network. | ~648 MB / month ($0.00 on R2, $0.05 on S3) |

---

## 2. Option 1: NOC Desk (Operator Recommended) — `<dcouplr/> AirLock™`

### 2.1 What Tools Are Needed
- **On the in-VPC `<dcouplr/>` host:**
  - `curl` (v7.68+)
  - `systemd` (Linux daemon manager) or Docker
  - `cloudflared` CLI binary (free Cloudflare Zero Trust connector)
  - Outbound network egress: TCP port `443` (HTTPS) and UDP port `7844` (QUIC). **Zero inbound firewall rules required.**
- **On the Operator Workstation:**
  - Modern web browser: Google Chrome (v115+), Microsoft Edge (v115+), Brave, or Firefox.

### 2.2 Where to Get It
Download the deployment artifacts directly from your `<dcouplr/>` in-VPC appliance:

```bash
# 1. Systemd Service Unit for the tunnel connector
curl -sSL http://127.0.0.1:8000/static/deploy/wallboard/airlock/dcouplr-airlock.service -o ./dcouplr-airlock.service

# 2. Automated Tunnel Provisioning Script
curl -sSL http://127.0.0.1:8000/static/deploy/wallboard/airlock/setup_airlock_tunnel.sh -o ./setup_airlock_tunnel.sh

# 3. Docker Compose Stack (Alternative to Systemd)
curl -sSL http://127.0.0.1:8000/static/deploy/wallboard/airlock/docker-compose.airlock.yml -o ./docker-compose.airlock.yml
```

### 2.3 Where to Put It

| File | Target Destination Path | Permissions | Purpose |
| :--- | :--- | :--- | :--- |
| `dcouplr-airlock.service` | `/etc/systemd/system/dcouplr-airlock.service` | `chmod 644` (root:root) | Systemd unit managing the background tunnel daemon. |
| `config.yml` | `/etc/cloudflared/config.yml` | `chmod 600` (root:root) | Tunnel ingress rules routing to local `http://127.0.0.1:8000`. |
| `setup_airlock_tunnel.sh` | `/opt/dcouplr/setup_airlock_tunnel.sh` | `chmod 700` (root:root) | Initial tunnel setup helper script. |
| Workstation Shortcut | Desktop / Taskbar | Standard user | Kiosk browser launch shortcut. |

### 2.4 Step-by-Step Implementation Procedure

#### Step 1: Install `cloudflared` on the `<dcouplr/>` Host
```bash
# On Debian / Ubuntu:
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bookworm main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# On RHEL / AlmaLinux / Amazon Linux 2023:
sudo dnf install -y https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
```

#### Step 2: Configure the AirLock™ Ingress Tunnel
Create the configuration file at `/etc/cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /etc/cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Routes external requests to local <dcouplr/> daemon
  - hostname: noc.yourcompany.com
    service: http://127.0.0.1:8000
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true
  - service: http_status:404
```

#### Step 3: Install & Start the Systemd Service
```bash
sudo cp ./dcouplr-airlock.service /etc/systemd/system/dcouplr-airlock.service
sudo systemctl daemon-reload
sudo systemctl enable --now dcouplr-airlock.service
sudo systemctl status dcouplr-airlock.service
```

**Expected Status Output:**
```text
● dcouplr-airlock.service - <dcouplr/> AirLock Zero-Trust Tunnel Connector
     Loaded: loaded (/etc/systemd/system/dcouplr-airlock.service; enabled)
     Active: active (running) since Wed 2026-10-28 02:00:00 UTC
   Main PID: 18240 (cloudflared)
     Status: "Registered at Cloudflare edge: 4 connections active (QUIC)"
```

#### Step 4: Launch NOC Desk on Operator Workstations
On any operator desk or NOC workstation, open the browser in dedicated kiosk mode:

```powershell
# Windows Operator Workstation (PowerShell):
chrome.exe --app="https://noc.yourcompany.com/dashboard?view=noc-desk" --start-fullscreen
```
```bash
# Linux Operator Workstation (Bash):
google-chrome --kiosk --app="https://noc.yourcompany.com/dashboard?view=noc-desk"
```

> [!TIP]
> **Operator Focused View:** Appending `?view=noc-desk` automatically loads the exact replica of `http://localhost:8000/dashboard` with the **In-VPC Financial Cost Breakdown** and **Alert Rule Threshold Simulator** hidden, keeping the screen 100% focused on active incidents, Raft consensus, and topology health.

---

## 3. Option 2: Wallboard (Air-Gapped SecOps) — `<dcouplr/> PulseCast™`

### 3.1 What Tools Are Needed
- **On the in-VPC `<dcouplr/>` host:**
  - Python 3.10+ (for the lightweight pulse synchronizer daemon)
  - `aws-cli` or `rclone` (to sync JSON file to S3 / Cloudflare R2 bucket)
  - Outbound HTTPS (Port 443) to your CDN / bucket endpoint.
- **On the Wall Display (TV Monitor / Overhead Screen):**
  - Raspberry Pi 4/5, Intel N100 mini PC, or Smart TV browser.
  - No VPN, no SSH keys, and no internal credentials needed.

### 3.2 Where to Get It
Retrieve the static bundle from the repository or your `<dcouplr/>` instance:

```bash
# 1. Standalone Single-File Static Wallboard HTML
curl -sSL http://127.0.0.1:8000/dist/pulsecast-cdn/index.html -o ./index.html

# 2. PulseCast Publisher Sync Script
curl -sSL http://127.0.0.1:8000/static/deploy/wallboard/pulsecast/sync_pulse_to_cdn.py -o ./sync_pulse_to_cdn.py

# 3. Systemd Service Unit for Pulse Sync
curl -sSL http://127.0.0.1:8000/static/deploy/wallboard/pulsecast/dcouplr-pulsecast.service -o ./dcouplr-pulsecast.service
```

### 3.3 Where to Put It

| File | Target Destination Path | Permissions | Purpose |
| :--- | :--- | :--- | :--- |
| `index.html` | `/var/www/html/wallboard/index.html` (or S3/R2 bucket root) | `chmod 644` | Client-side static wallboard application. |
| `sync_pulse_to_cdn.py` | `/opt/dcouplr/pulsecast/sync_pulse_to_cdn.py` | `chmod 750` | 5-second background publisher script. |
| `dcouplr-pulsecast.service` | `/etc/systemd/system/dcouplr-pulsecast.service` | `chmod 644` | Systemd service running the publisher daemon. |

### 3.4 Step-by-Step Implementation Procedure

#### Step 1: Host the Static HTML File
Upload `index.html` to any static web server (Nginx, Apache, or Cloudflare R2 / S3 website):

```bash
# Example: Deploying to internal Nginx server:
sudo mkdir -p /var/www/html/wallboard
sudo cp ./index.html /var/www/html/wallboard/index.html
sudo chown -R www-data:www-data /var/www/html/wallboard
```

#### Step 2: Configure the 5-Second Background Pulse Publisher
On your in-VPC `<dcouplr/>` appliance, deploy the publisher daemon:

```bash
sudo mkdir -p /opt/dcouplr/pulsecast
sudo cp ./sync_pulse_to_cdn.py /opt/dcouplr/pulsecast/sync_pulse_to_cdn.py
sudo cp ./dcouplr-pulsecast.service /etc/systemd/system/dcouplr-pulsecast.service

sudo systemctl daemon-reload
sudo systemctl enable --now dcouplr-pulsecast.service
sudo systemctl status dcouplr-pulsecast.service
```

**Expected Publisher Output:**
```text
[INFO] <dcouplr/> PulseCast Publisher started.
[INFO] Local loopback source: http://127.0.0.1:8000/v1/telemetry/topology-pulse
[INFO] Target CDN endpoint: https://pulse.yourcompany.com/topology-pulse.json
[PULSE] 2026-10-28T02:15:00Z: 1,142 bytes synced (HTTP 200) • SHA: e3b0c442...
[PULSE] 2026-10-28T02:15:05Z: 1,142 bytes synced (HTTP 200) • SHA: 9f86d081...
```

#### Step 3: Open the Wallboard on the Physical TV Display
Launch Chromium on your TV wall PC (Raspberry Pi or Intel N100):

```bash
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  "https://wallboard.yourcompany.com/?pulse=https://pulse.yourcompany.com/topology-pulse.json"
```

#### Step 4: Enable Display Wake Lock
On first launch, click **`☕ Wake Lock Active`** in the top navigation bar. This uses the browser W3C Screen Wake Lock API to prevent the screen from sleeping or turning off overnight.

---

## 4. Disconnection Root Cause Analysis (RCA) & Troubleshooting

If your wall display loses connection, locate the symptom in the table below to resolve it immediately:

### Option 1: NOC Desk (AirLock™) Disconnections

| Failure Mode | Root Cause | Operator Symptom | Immediate Fix Command |
| :--- | :--- | :--- | :--- |
| **Service Token Expiry** | Cloudflare Access Service Token reached validity limit. | HTTP 403 Forbidden or redirect to corporate SSO login screen. | Regenerate token in Cloudflare Zero Trust console and update browser credentials header. |
| **TCP Keepalive Timeout** | Corporate firewall dropped idle TCP connections after 300s. | Stale graphs; WebSocket indicator changes from Green to Amber. | Ensure `originRequest.keepAliveTimeout: 90s` is configured in `/etc/cloudflared/config.yml`. |
| **In-VPC Daemon Restart** | `<dcouplr/>` daemon restarted during an update. | HTTP 502 Bad Gateway. | Check local daemon status: `sudo systemctl status dcouplr`. AirLock reconnects automatically within 3 seconds of service recovery. |
| **DNS Resolution Failure** | Local ISP DNS cache poisoned or workstation disconnected from internet. | `ERR_NAME_NOT_RESOLVED`. | Test tunnel endpoint directly: `curl -I https://noc.yourcompany.com/v1/health`. |
| **Local Sleep Mode** | Workstation entered OS sleep or power-saving mode. | Display froze at historical timestamp. | Disable OS display sleep in Windows Power Settings (`powercfg -change -monitor-timeout-ac 0`). |

### Option 2: Wallboard (PulseCast™) Disconnections

| Failure Mode | Root Cause | Operator Symptom | Immediate Fix Command |
| :--- | :--- | :--- | :--- |
| **Stale Edge Cache** | Publisher daemon crashed or stopped syncing pulse JSON. | Pulse indicator turns Amber: `STALE PULSE (> 15s)`. | Restart publisher service: `sudo systemctl restart dcouplr-pulsecast.service`. |
| **CDN HTTP 404 Not Found** | Pulse JSON path mismatch in URL configuration. | Red banner: `SOURCE UNREACHABLE (HTTP 404)`. | Click `⚙ Source` in HUD header and verify URL matches your CDN path. |
| **CORS Header Missing** | CDN bucket is missing `Access-Control-Allow-Origin: *`. | Browser console shows `CORS header missing`. | Add CORS rule on Cloudflare R2 / S3 bucket: `AllowedOrigins: ["*"], AllowedMethods: ["GET"]`. |
| **Network Cable Unplugged** | Physical Ethernet disconnect on wall monitor PC. | Red badge: `OFFLINE (RETRYING IN 5s)`. | Check physical LAN cable or Wi-Fi status on the TV PC. Wallboard retries automatically every 5s. |
| **TV Display Burn-In / Sleep** | TV hardware timer turned off panel after 4 hours of static video. | Black screen on physical television. | Disable "Eco Mode" and "Auto Standby" in physical TV hardware settings. |

---

## 5. In-VPC Dashboard Health Watch & Indicator Matrix

When monitoring the live dashboard (`http://localhost:8000/dashboard` or the NOC Desk), monitor these **6 critical operational indicators**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD INDICATORS TO WATCH OUT FOR                           │
├──────────────────────┬──────────────────────┬─────────────────┬────────────────────────┤
│ Indicator            │ Normal (Healthy)     │ Warning / Alert │ Action Required        │
├──────────────────────┼──────────────────────┼─────────────────┼────────────────────────┤
│ 1. Consensus Quorum  │ 3/3 NODES OPTIMAL    │ 2/3 DEGRADED    │ Peer dropped; check    │
│                      │ (Neon Emerald)       │ (Amber / Red)   │ journalctl on node     │
├──────────────────────┼──────────────────────┼─────────────────┼────────────────────────┤
│ 2. p99 Ingestion Lag │ < 1.00 ms            │ > 5.00 ms       │ Check network egress   │
│                      │ (Emerald / Purple)   │ (Rose Spikes)   │ or packet saturation   │
├──────────────────────┼──────────────────────┼─────────────────┼────────────────────────┤
│ 3. Memory Leak Drift │ 0.00 MB (Stable)     │ > 10.0 MB       │ Inspect memory gauge;  │
│                      │ (Emerald)            │ (Trending Up)   │ restart agent if leak  │
├──────────────────────┼──────────────────────┼─────────────────┼────────────────────────┤
│ 4. WAN Egress Attest │ $0.00 WAN FEES       │ Non-Zero Value  │ Air-gap breached!      │
│                      │ (Emerald Lock)       │ (Security Red)  │ Check firewall rules   │
├──────────────────────┼──────────────────────┼─────────────────┼────────────────────────┤
│ 5. Live Pulse Dot    │ Blinking Green       │ Solid Red       │ Data feed lost; check  │
│                      │ (Every 2 seconds)    │ (Disconnected)  │ Section 4 troubleshooting│
├──────────────────────┼──────────────────────┼─────────────────┼────────────────────────┤
│ 6. Node License Pill │ Green (≤75% Cap)     │ Red (100% Full) │ Cluster full; upgrade  │
│                      │ Blue (76–89% Cap)    │ (Exhausted)     │ license tier via admin │
└──────────────────────┴──────────────────────┴─────────────────┴────────────────────────┘
```

### Node License Color-Coding Breakdown:
- 🟢 **Green (Comfort Zone &le; 75%):** e.g., `0–56 / 75 Nodes`. Healthy operational capacity.
- 🔵 **Blue (Operational Active 76%–89%):** e.g., `57–67 / 75 Nodes`. Standard load; plan for next wave.
- 🟡 **Amber (Warning 90%–99%):** e.g., `68–74 / 75 Nodes`. Near quota limit; contact procurement to expand cluster tier.
- 🔴 **Red (Critical 100% Full):** e.g., `75 / 75 Nodes`. License fully exhausted. Additional nodes will be throttled.
