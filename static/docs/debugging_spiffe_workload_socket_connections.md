# 🔍 Debugging Initial SPIFFE Workload Socket Connections

When your local agent binary boots, it expects to negotiate short-lived mutual TLS (mTLS) identities via the local SPIRE Workload API Unix Domain Socket. Use this triage matrix if the binary logs socket timeout errors on startup:

## Step 1: Verify Socket File Existence and Permissions
Confirm that the SPIRE background daemon is actively running and that the socket file descriptor exists with the correct user access permissions:

```bash
ls -la /run/spire/sockets/agent.sock
```

If the file is missing, the SPIRE agent daemon is down. If it exists but throws permissions blocks, verify that your user account belongs to the group mapped to the socket descriptor.

## Step 2: Run a Headless Socket Connectivity Test
Use `socat` or `netcat` to verify that the socket layer accepts headless connections without dropping or truncating communication paths:

```bash
# For Unix domain socket verification
socat - UNIX-CONNECT:/run/spire/sockets/agent.sock
```

If the connection is immediately terminated, the SPIRE agent's internal queue is saturated or the socket has stalled.

## Step 3: Inspect Attestation Selectors and Logs
If the connection opens but the agent is denied an identity document (SVID), check the SPIRE server logs to ensure that your local system attributes match the registered node selectors:

```bash
# Check raw SPIRE agent daemon status logs
sudo journalctl -u spire-agent --no-pager -n 50
```

Look for `attestation failed` errors. Ensure your local environment variables (such as AWS EC2 IID tags or local Linux UID/GID numbers) align precisely with your `spire-server-entry.yaml` policy definitions.
