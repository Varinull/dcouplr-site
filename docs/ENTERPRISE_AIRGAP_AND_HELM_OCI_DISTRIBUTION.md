# 📦 Enterprise Air-Gapped Offline Bundle & Signed Helm OCI Distribution

**Wordmark & Product Identity:** `<dcouplr/>`  
**Distribution Target:** GitHub Container Registry (GHCR OCI) & Air-Gapped Defense/Banking Deployments  
**Security Standard:** SLSA Provenance Level 3, Sigstore Cosign Keyless Signatures, CycloneDX 1.5 & SPDX 2.3 SBOMs  
**Runtime Posture:** Distroless Non-Root (`UID 65532`, `gcr.io/distroless/static-debian12`), Zero-Egress NetworkPolicy  

---

## 1. Enterprise Helm Chart Architecture (`deploy/helm/`)

`<dcouplr/>` ships with a production Kubernetes Helm chart designed for zero-egress in-VPC clusters:

### Key Components & Manifests
* **`Chart.yaml`:** Chart specification v1.0.0 adhering to Helm 3 OCI packaging standards.
* **`values.yaml` & `values.schema.json`:** Comprehensive configuration schema with validation constraints for cluster nodes, storage backends, and telemetry routing.
* **`templates/deployment.yaml`:** Multi-replica core engine deployment utilizing non-root security contexts (`runAsUser: 65532`), read-only root filesystems, and dropped Linux capabilities (`drop: ["ALL"]`).
* **`templates/operator-deployment.yaml` & `operator-rbac.yaml`:** High-availability Kubernetes Operator deployment with leader election (`coordination.k8s.io/leases`) and automated reconciliation.
* **`templates/servicemonitor.yaml`:** Native Prometheus Operator metrics scraping configuration for cluster health monitoring.
* **`templates/networkpolicy.yaml`:** Zero-egress network microsegmentation enforcing strictly internal in-VPC ingress/egress.

---

## 2. Signed OCI Helm Distribution Pipeline

The enterprise distribution pipeline is automated via [`.github/workflows/helm-release-production.yml`](https://github.com/Varinull/dcouplr/blob/main/.github/workflows/helm-release-production.yml):

```bash
# 1. Lint and validate chart schema
helm lint ./deploy/helm

# 2. Package OCI chart archive
helm package ./deploy/helm --destination ./dist/charts

# 3. Authenticate and push to GitHub Container Registry (GHCR)
echo "${{ secrets.GITHUB_TOKEN }}" | helm registry login ghcr.io -u "${{ github.actor }}" --password-stdin
helm push ./dist/charts/dcouplr-1.0.0.tgz oci://ghcr.io/varinull/charts

# 4. Sign OCI artifact with Cosign
cosign sign --yes ghcr.io/varinull/charts/dcouplr:1.0.0
```

---

## 3. Turnkey Air-Gapped Offline Bundle (`package_airgap_bundle.py`)

For regulated environments with zero internet connectivity (financial banking enclaves, defense networks):
* **Execution Script:** [`scripts/package_airgap_bundle.py`](https://github.com/Varinull/dcouplr/blob/main/scripts/package_airgap_bundle.py)
* **Output Archive:** `dist/dcouplr-airgap-bundle-v1.0.0.tar.gz`
* **Artifact Manifest:** 37 distinct self-contained release artifacts including binaries, container images, Helm charts, and documentation.
* **Cryptographic Attestations:**
  * **CycloneDX 1.5 SBOM:** `dist/sbom-cyclonedx.json`
  * **SPDX 2.3 SBOM:** `dist/sbom-spdx.json`
  * **SLSA Level 3 Provenance:** `dist/slsa-provenance.json`
  * **Integrity Digest:** SHA-256 checksum file `dist/dcouplr-airgap-bundle-v1.0.0.tar.gz.sha256`

---

## 4. Air-Gapped Installation Runbook

```bash
# Step 1: Verify SHA-256 checksum inside air-gapped perimeter
sha256sum -c dcouplr-airgap-bundle-v1.0.0.tar.gz.sha256

# Step 2: Extract bundle
tar -xzf dcouplr-airgap-bundle-v1.0.0.tar.gz -C /opt/dcouplr-offline

# Step 3: Load pre-cached distroless container images into internal registry
podman load -i /opt/dcouplr-offline/images/dcouplr-core.tar
podman tag dcouplr-core:latest internal-registry.corp.local/dcouplr/core:v1.0.0
podman push internal-registry.corp.local/dcouplr/core:v1.0.0

# Step 4: Install Helm chart from local filesystem
helm install dcouplr-enterprise /opt/dcouplr-offline/helm \
  --namespace dcouplr-system \
  --create-namespace \
  --values /opt/dcouplr-offline/helm/values-airgap.yaml
```

---

## 5. Verification Checklist

* [x] `python scripts/package_airgap_bundle.py` (SPDX, CycloneDX, SLSA Level 3 generated and verified)
* [x] `pytest tests/test_enterprise_packaging_and_recipes.py` (13/13 passed)
* [x] `pytest tests/test_k8s_operator_runtime.py` (6/6 passed)
* [x] `pytest tests/test_translation.py` (81/81 passed)
* [x] `python scripts/verify_all.py` (5/5 steps 100% green)
