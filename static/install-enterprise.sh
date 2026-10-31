#!/usr/bin/env bash
# ==============================================================================
# <dcouplr/> Paid Commercial & Enterprise Tier Installer (Linux & macOS)
# Zero-Egress Observability & In-VPC Infrastructure Transpiler
# Features:
#   1. Offline Ed25519 Entitlement Token Validation ($0 Egress)
#   2. Enterprise Node Quota & Multi-VPC Mesh Activation
#   3. Air-Gapped Distribution Setup (Containers, Helm, CRDs, SBOM)
#
# Usage:
#   curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
#   DCOUPLR_LICENSE_KEY="DCL-PRO-ACME-8821B47C9" curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
# ==============================================================================
set -euo pipefail

VERSION="${DCOUPLR_VERSION:-1.0.0}"
LICENSE_KEY="${DCOUPLR_LICENSE_KEY:-}"
CUSTOMER_ORG="${DCOUPLR_ORG:-}"
BINARY_NAME="dcouplr"

# Color constants
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ___   ___  ___  _   _ ___ _     ___  "
echo " <  _\ / __|/ _ \| | | | _ \ |   | _ \ "
echo "  > _|| (__| (_) | |_| |  _/ |__ |   / "
echo " <___/ \___|\___/ \___/|_| |____||_|_\ "
echo -e "${NC}"
echo -e "${MAGENTA}======================================================================${NC}"
echo -e "${MAGENTA}   <dcouplr/> Commercial & Enterprise Tier Installer v${VERSION}${NC}"
echo -e "${MAGENTA}======================================================================${NC}"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="darwin";;
    *)          echo -e "${RED}[ERROR] Unsupported operating system: ${OS}${NC}"; exit 1;;
esac

# Detect Architecture
ARCH="$(uname -m)"
case "${ARCH}" in
    x86_64)        ARCH_NAME="amd64";;
    aarch64|arm64) ARCH_NAME="arm64";;
    *)             echo -e "${RED}[ERROR] Unsupported architecture: ${ARCH}${NC}"; exit 1;;
esac

# 1. Prompt for License Key if not set in environment
if [ -z "${LICENSE_KEY}" ]; then
    echo -e "${YELLOW}==> Step 2 of 4: Enter your Commercial Entitlement Key:${NC}"
    echo -e "    Format: DCL-PRO-<ORG>-<SIG> or DCL-CLUS-<TIER>-<ORG>-<SIG>"
    printf "    License Key: "
    read -r LICENSE_KEY || true
    if [ -z "${LICENSE_KEY}" ]; then
        echo -e "${RED}[ERROR] A valid Commercial License Key is required for Enterprise activation.${NC}"
        echo -e "${CYAN}    To obtain a key, subscribe at: https://dcouplr.com/#pricing${NC}"
        exit 1
    fi
fi

# 2. Base CLI Installation
if [ "$(id -u)" -eq 0 ]; then
    INSTALL_DIR="/usr/local/bin"
else
    INSTALL_DIR="${HOME}/.local/bin"
    mkdir -p "${INSTALL_DIR}"
fi

echo -e "\n${GREEN}==> Step 1 of 4: Installing <dcouplr/> CLI Engine to ${INSTALL_DIR}...${NC}"
if command -v pip3 &>/dev/null; then
    pip3 install --upgrade git+https://github.com/Varinull/dcouplr.git --quiet || true
elif command -v pip &>/dev/null; then
    pip install --upgrade git+https://github.com/Varinull/dcouplr.git --quiet || true
fi

# Ensure executable wrapper exists
if ! command -v dcouplr &>/dev/null; then
    WRAPPER="${INSTALL_DIR}/${BINARY_NAME}"
    cat << 'EOF' > "${WRAPPER}"
#!/usr/bin/env bash
exec python3 -m migration_tools.cli "$@"
EOF
    chmod +x "${WRAPPER}"
fi

# Ensure PATH
if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
    export PATH="${INSTALL_DIR}:${PATH}"
fi

# 3. Offline Ed25519 License Key Activation
echo -e "${GREEN}==> Step 3 of 4: Activating Commercial License Key Offline ($0 Egress)...${NC}"
if [ -n "${CUSTOMER_ORG}" ]; then
    dcouplr auth login --license-key "${LICENSE_KEY}" --org "${CUSTOMER_ORG}"
else
    dcouplr auth login --license-key "${LICENSE_KEY}"
fi

# 4. Display Active Commercial Entitlements
echo -e "\n${GREEN}==> Step 4 of 4: Inspecting Active Entitlement Status:${NC}"
dcouplr auth status

# 5. Air-Gapped Distribution Download Reference
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "${GREEN}[SUCCESS] <dcouplr/> Enterprise Tier Activated Successfully!${NC}"
echo -e "${CYAN}----------------------------------------------------------------------${NC}"
echo -e "Enterprise Deployment Options:"
echo -e "  1. Run System Preflight & Doctor: dcouplr doctor"
echo -e "  2. Launch In-VPC Cluster Daemon:  dcouplr serve --port 8000"
echo -e "  3. Air-Gapped Helm & SBOM Bundle: curl -fsSL https://dcouplr.com/dcouplr-enterprise-v${VERSION}.tar.gz -o dcouplr-enterprise-v${VERSION}.tar.gz"
echo -e "  4. Documentation & Enterprise Runbooks: https://dcouplr.com/docs"
echo -e "${CYAN}======================================================================\n${NC}"
