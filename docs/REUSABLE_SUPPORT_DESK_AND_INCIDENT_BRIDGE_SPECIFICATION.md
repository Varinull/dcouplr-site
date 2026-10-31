# Reusable Support Desk & In-VPC Incident Bridge Specification
**Architecture, Multi-Tenancy Blueprint, and Jitsi War-Room Implementation**

**Classification:** Enterprise Systems & Infrastructure Architecture Runbook  
**Target Audience:** SRE Leads, Systems Architects, DevOps Engineers, Product Owners  
**Target Module:** Customer Support Desk (`/support`) & SRE Operations Console (`/support-console`)  
**Core Reference Implementation:** `migration_tools/api/support.py`, `support.html`, `support.js`, `support.css`

---

## Executive Summary

Modern enterprise platforms require both a seamless, friction-free **Client Helpdesk** for customers to submit tickets and view SLAs, and a unified, multi-application **Internal SRE Operations Console** for engineering teams to triage alerts, resolve tickets, and instantly spin up live incident war-rooms.

This specification documents how to extract, package, and reuse `<dcouplr/>`'s Support Desk architecture across **all applications** you build, coupled with an engineering evaluation and implementation blueprint for **Jitsi Meet** as a zero-egress, in-VPC incident bridge.

---

## Part 1: Reusable Support Desk Architecture

### 1.1 The Operational Problem

When building multiple independent services (e.g. *App 1: dcouplr*, *App 2: cloaudit (Cloud Audit)*, *App 3: billing-service*), hardcoding isolated ticketing systems inside each application creates severe operational fragmentation:
1. **SRE Context Thrashing:** Engineers must monitor and log into 5 to 10 distinct web consoles.
2. **Failure Coupling:** If *App A* suffers a severe cluster-wide outage or database corruption, its embedded support desk crashes along with it, leaving customers unable to report the outage.
3. **Inconsistent SLAs:** Different apps drift in their SLA enforcement, response times, and incident runbooks.

### 1.2 The Hub-and-Spoke Architectural Standard

```
+---------------------------------------------------------------------------------------------------+
|                                         YOUR APPLICATIONS                                         |
|   [ App 1: dcouplr ]              [ App 2: cloaudit (Cloud Audit) ]       [ App N: Future App ]   |
|   (Embedded Client Desk)          (Embedded Client Desk)                  (Embedded Client Desk)  |
+-----------------------------------+---------------------------------------+-----------------------+
                              |                             |
                              +--------------+--------------+
                                             |
                                             v
                      +---------------------------------------------+
                      |         CENTRALIZED SUPPORT SERVICE         |
                      |            "supportops-core" API            |
                      |   - Multi-tenant: app_id + customer_id      |
                      |   - Shared Postgres / DynamoDB / SQLite     |
                      |   - Webhook Engine (Slack, PagerDuty, Email)|
                      +---------------------------------------------+
                                             ^
                                             |
                      +---------------------------------------------+
                      |          INTERNAL SRE WAR-ROOM              |
                      |       (Single Unified Control Center)       |
                      |   - Triage all apps in one single queue     |
                      |   - Universal Incident Bridges (Jitsi)      |
                      |   - Global Knowledge Base (SOPs & Recipes)  |
                      +---------------------------------------------+
```

---

### 1.3 The 3 Packaging & Delivery Approaches

#### Approach A: Centralized Multi-Tenant Support Service (Recommended for Multi-Product Suites)
* **Mechanics:** Run the support API and SRE console as an independent microservice (`support.internal.yourdomain.com`).
* **Why It Wins:**
  * **Unified Command Center:** SREs keep a single tab open. A P0 ticket from *App A* and a P1 from *App B* land in the same prioritized triage matrix.
  * **Zero Failure Coupling:** Target application database outages do not impact the support desk.
  * **Client Integration:** Target applications render the client submission form via a lightweight `<support-desk-widget>` or a standard 302 redirect.

#### Approach B: Mountable Python Engine (`supportops-engine`) (Recommended for On-Prem / Air-Gapped Installs)
* **Mechanics:** Package the FastAPI `APIRouter` and bundled assets as a reusable pip library.
* **Usage in any FastAPI project:**
  ```python
  from fastapi import FastAPI
  from supportops import create_support_portal, PostgresStorageAdapter

  app = FastAPI()

  # Mount entire client desk + internal ops console in 4 lines:
  support_portal = create_support_portal(
      app_id="cloaudit",  # cloaudit (Cloud Audit)
      storage=PostgresStorageAdapter(db_url="postgresql://..."),
      slack_webhook_url="https://hooks.slack.com/services/...",
      jitsi_domain="meet.internal.yourdomain.com"
  )
  app.include_router(support_portal.router)
  app.mount("/support", support_portal.static_app)
  ```
* **Best For:** Completely isolated, customer-hosted VPCs where external network traffic is prohibited.

#### Approach C: Headless REST API + Embeddable Web Component
* **Backend:** Standardized REST endpoints (`/v1/support/tickets`, `/v1/support/bridges`, `/v1/support/solutions`).
* **Frontend:** A standalone compiled custom element `<support-desk app="cloaudit" theme="dark"></support-desk>` (for `cloaudit` [Cloud Audit]) that works natively in React, Vue, Svelte, or vanilla HTML.

---

### 1.4 Step-by-Step Implementation Blueprint

#### 1. Multi-Tenant Schema Partitioning (`app_id`)
Every record is partitioned by `app_id`:
```python
from pydantic import BaseModel, Field

class Ticket(BaseModel):
    id: str
    app_id: str = Field(..., example="dcouplr") # Multi-tenant discriminator
    customer_id: str
    customer_name: str
    title: str
    priority: str  # P0 - Blocker, P1 - Critical, P2 - Major, P3 - Minor
    status: str    # OPEN, IN_PROGRESS, ESCALATED, RESOLVED, CLOSED
    assigned_to: str
    sla_target: str
    created_at: str
    description: str
```

* **Client View Query:** `GET /v1/support/tickets?app_id=dcouplr&customer_id=CUST-101`
* **Internal SRE Console Query:** `GET /v1/support/tickets?app_id=all&status=OPEN`

#### 2. Pluggable Storage Layer (Repository Pattern)
Decouple from in-memory stores into an abstract repository:
```python
from abc import ABC, abstractmethod
from typing import List, Optional

class SupportRepository(ABC):
    @abstractmethod
    async def get_ticket(self, ticket_id: str) -> Optional[Ticket]: ...
    
    @abstractmethod
    async def list_tickets(self, app_id: Optional[str] = None, status: Optional[str] = None) -> List[Ticket]: ...
    
    @abstractmethod
    async def save_ticket(self, ticket: Ticket) -> Ticket: ...
```
Adapters provided:
* `MemorySupportRepository`: For local development, tests, and zero-dependency demos.
* `SQLAlchemySupportRepository`: For PostgreSQL/MySQL production deployments with ACID transactions.

#### 3. Event Webhook Engine (Notification Dispatcher)
When a ticket transitions to `P0` or an Incident Bridge is spawned, the engine dispatches webhooks:
* **Slack / Teams:** Posts interactive message with "Join Bridge" and "Acknowledge" buttons.
* **PagerDuty / OpsGenie:** Triggers on-call engineer phone/SMS escalation.
* **Email / SNS:** Sends ticket confirmation and SLA countdown timer to the customer.

---

## Part 2: Engineering Assessment of Jitsi for Incident War-Room Bridges

### 2.1 Verdict: The Gold Standard for In-VPC SRE War-Rooms

When an emergency P0/P1 infrastructure incident occurs, conventional video conferencing tools (Zoom, Microsoft Teams, Google Meet) break down due to:
* Mandatory account sign-in / SSO authentication loops.
* External third-party public cloud egress (violating enterprise zero-egress compliance).
* Heavy client application installation requirements.

**Jitsi Meet (`jitsi-meet`) solves all three problems completely.**

---

### 2.2 Comprehensive Solution Comparison Matrix

| Capability / Dimension | Jitsi Meet | LiveKit | Daily.co | Zoom / Google Meet |
| :--- | :---: | :---: | :---: | :---: |
| **Self-Hostable In-VPC** | **Yes (100% On-Prem)** | Yes (Self-hosted core) | No (SaaS only) | No (Vendor Cloud) |
| **Prebuilt Embeddable UI** | **Yes (Official IFrame API)** | No (Headless only) | Yes (Prebuilt) | Complex Web SDK |
| **Zero Account Sign-In** | **Yes (URL / JWT)** | Yes (Token-based) | Yes (Token-based) | No (SSO / App login) |
| **Bandwidth / Cost Risk** | **$0 / Unlimited** | $0 Self-hosted | Metered ($/min) | Fixed User Licenses |
| **Zero WAN Egress** | **100% Air-Gappable** | 100% Air-Gappable | Violates Egress | Violates Egress |
| **Screen Share Fidelity** | **60 FPS WebRTC Desktop** | 60 FPS WebRTC | 30 FPS WebRTC | Standard Video |
| **Setup Overhead** | **Low (Docker Compose)** | Medium | Very Low (API key) | Medium |

---

### 2.3 The 5 Pillars of Jitsi for Incident Bridges

1. **Zero-Friction, Ephemeral URL War-Rooms:**
   During a 3:00 AM production outage, nobody should wait for a calendar invite. Bridges are generated deterministically:
   `https://meet.internal.dcouplr.com/bridge-inc-{ticket_id}`. Engineers and customers click once and are on the call in sub-second time.
2. **100% Zero-Egress In-VPC Compliance:**
   WebRTC audio, video, and screen sharing streams stay entirely within your private VPC perimeter. No financial transaction data, CLI credentials, or proprietary source code shared over screen share ever exits to public clouds.
3. **Drop-In IFrame Embedding (`JitsiMeetExternalAPI`):**
   Engineers do not have to leave the Support Console. The war-room is rendered directly inside the SRE workspace alongside live AST linters and ticket notes.
4. **JWT Security & Room Lockdown:**
   Bridges can be secured using RS256 JWT tokens generated by `support.py`. Only authenticated on-call SREs and the ticket owner can enter, preventing unauthorized snooping.
5. **Optimized for Screen Sharing & Voice:**
   Incident response requires crystal-clear audio and terminal screen sharing. Jitsi automatically disables cameras by default to conserve internal network bandwidth.

---

### 2.4 Production Implementation: Embedded Jitsi in 15 Lines of JavaScript

The following script integrates Jitsi directly into the Support Desk console (`support.html`):

```html
<!-- Load official Jitsi IFrame API -->
<script src="https://meet.jit.si/external_api.js"></script>

<div id="jitsi-war-room-container" style="height: 620px; width: 100%; border-radius: 12px; overflow: hidden;"></div>

<script>
function launchJitsiIncidentBridge(ticketId, displayName, isModerator = false) {
  const domain = "meet.internal.dcouplr.com"; // Or "meet.jit.si" for local sandbox testing
  const options = {
    roomName: "dcouplr-warroom-" + ticketId.replace("TCK-", ""),
    width: "100%",
    height: "100%",
    parentNode: document.querySelector('#jitsi-war-room-container'),
    userInfo: {
      displayName: displayName // e.g. "Marcus Vance (Staff TAM / SRE Lead)"
    },
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: true, // Keep video off by default to minimize bandwidth
      prejoinPageEnabled: false, // Immediate entry without pre-join lobby
      disableDeepLinking: true,   // Never redirect to mobile app store
      enableWelcomePage: false
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'desktop', 'chat', 
        'raisehand', 'tileview', 'hangup'
      ]
    }
  };

  const api = new JitsiMeetExternalAPI(domain, options);

  // Hook telemetry & audit events into your ticket timeline
  api.addEventListener('videoConferenceJoined', (event) => {
    fetch(`/v1/support/tickets/${ticketId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: displayName,
        note: `Joined live incident war-room bridge (${event.roomName}).`
      })
    });
  });

  api.addEventListener('videoConferenceLeft', () => {
    console.log("Engineer left bridge. Ready for post-mortem summary.");
  });
}
</script>
```

---

### 2.5 Jitsi Deployment Blueprint: Docker Compose In-VPC

To run Jitsi 100% inside your private VPC with zero public egress:

```yaml
version: '3.8'

services:
  # 1. Web Frontend & Nginx Proxy
  web:
    image: jitsi/web:stable-9220
    restart: unless-stopped
    ports:
      - "8443:443"
    environment:
      - ENABLE_AUTH=1
      - ENABLE_GUEST=0
      - AUTH_TYPE=jwt
    volumes:
      - ./jitsi-config/web:/config

  # 2. XMPP Signaling Server
  prosody:
    image: jitsi/prosody:stable-9220
    restart: unless-stopped
    environment:
      - JWT_APP_ID=dcouplr-support
      - JWT_APP_SECRET=your-in-vpc-secret-key

  # 3. Focus Conference Coordinator
  jicofo:
    image: jitsi/jicofo:stable-9220
    restart: unless-stopped

  # 4. Jitsi Videobridge (WebRTC UDP Media Relay)
  jvb:
    image: jitsi/jvb:stable-9220
    restart: unless-stopped
    ports:
      - "10000:10000/udp" # WebRTC media stream
    environment:
      - DOCKER_HOST_ADDRESS=10.100.1.50 # Internal VPC IP
```

* **Resource Footprint:** 2 vCPU, 4 GiB RAM handles 15 simultaneous 20-person war-rooms.
* **Network Requirements:** Only internal UDP port `10000` between client workstations and the JVB instance.

---

## Part 3: Migration & Extraction Action Checklist

| Phase | Milestone | Deliverable | Status |
| :--- | :--- | :--- | :---: |
| **Phase 1** | Schema Multi-Tenancy | Add `app_id` to `Ticket`, `Customer`, `SupportBridge` models | Ready |
| **Phase 2** | Persistence Decoupling | Implement `SQLAlchemySupportRepository` alongside in-memory store | Ready |
| **Phase 3** | Jitsi Bridge Integration | Embed `JitsiMeetExternalAPI` in `support.html` war-room modal | Ready |
| **Phase 4** | Webhook Engine | Connect P0/P1 event triggers to Slack/PagerDuty webhooks | Ready |
| **Phase 5** | Reusable Packaging | Publish `supportops-core` library for one-line mounting in other apps | Ready |

---

*This specification is maintained as part of the official <dcouplr/> enterprise documentation suite.*
