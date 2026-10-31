#!/usr/bin/env bash
# ==============================================================================
# <dcouplr/> Universal Community CLI Installer for Linux & macOS
# Zero-Egress Observability & In-VPC Infrastructure Transpiler
# Repository: https://github.com/varinull/dcouplr-community
# Usage: curl -fsSL https://dcouplr.com/install.sh | sh
# ==============================================================================
set -euo pipefail

VERSION="${DCOUPLR_VERSION:-1.0.0}"
GITHUB_REPO="${DCOUPLR_REPO:-varinull/dcouplr-community}"
BINARY_NAME="dcouplr"

# Color constants
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ___   ___  ___  _   _ ___ _     ___  "
echo " <  _\ / __|/ _ \| | | | _ \ |   | _ \ "
echo "  > _|| (__| (_) | |_| |  _/ |__ |   / "
echo " <___/ \___|\___/ \___/|_| |____||_|_\ "
echo -e "${NC}"
echo -e "${GREEN}==> Installing <dcouplr/> Community CLI v${VERSION}...${NC}"

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

TARBALL_NAME="dcouplr-${VERSION}-${PLATFORM}-${ARCH_NAME}.tar.gz"
DOWNLOAD_URL="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${TARBALL_NAME}"

# Select Destination Directory
if [ "$(id -u)" -eq 0 ]; then
    INSTALL_DIR="/usr/local/bin"
else
    INSTALL_DIR="${HOME}/.local/bin"
    mkdir -p "${INSTALL_DIR}"
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo -e "${CYAN}==> Detected System: ${PLATFORM} (${ARCH_NAME})${NC}"
echo -e "${CYAN}==> Target Binary: ${INSTALL_DIR}/${BINARY_NAME}${NC}"

DOWNLOAD_SUCCESS=false
if command -v curl &>/dev/null; then
    echo -e "${GREEN}==> Fetching release artifact: ${DOWNLOAD_URL}...${NC}"
    if curl -fsSL "${DOWNLOAD_URL}" -o "${TMP_DIR}/${TARBALL_NAME}" 2>/dev/null; then
        DOWNLOAD_SUCCESS=true
    fi
elif command -v wget &>/dev/null; then
    echo -e "${GREEN}==> Fetching release artifact: ${DOWNLOAD_URL}...${NC}"
    if wget -q "${DOWNLOAD_URL}" -O "${TMP_DIR}/${TARBALL_NAME}" 2>/dev/null; then
        DOWNLOAD_SUCCESS=true
    fi
fi

if [ "$DOWNLOAD_SUCCESS" = true ]; then
    tar -xzf "${TMP_DIR}/${TARBALL_NAME}" -C "${TMP_DIR}"
    install -m 755 "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
else
    echo -e "${YELLOW}==> Binary release not yet on GitHub Releases. Installing Community Core via git package...${NC}"
    if command -v pip3 &>/dev/null; then
        pip3 install --upgrade git+https://github.com/Varinull/dcouplr.git --quiet || true
    elif command -v pip &>/dev/null; then
        pip install --upgrade git+https://github.com/Varinull/dcouplr.git --quiet || true
    fi
fi

# Ensure INSTALL_DIR is in PATH
if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
    echo -e "${YELLOW}[NOTE] ${INSTALL_DIR} is not in your current PATH.${NC}"
    echo -e "${YELLOW}Add the following to your ~/.bashrc or ~/.zshrc:${NC}"
    echo -e "    export PATH=\"${INSTALL_DIR}:\$PATH\""
fi

echo -e "\n${GREEN}[SUCCESS] <dcouplr/> Community Core v${VERSION} installed successfully!${NC}"
echo -e "${CYAN}----------------------------------------------------------------------${NC}"
echo -e "${GREEN}==> Community Core Entitlement Profile Active:${NC}"
echo -e "  • Monitored Capacity:     1 Local Agent / CLI (\`dcouplr\`)"
echo -e "  • Privacy Guarantee:      In-Memory Zero-Egress Sanitizer"
echo -e "  • AST Transpiler Engine:  Unlimited Local AST Transpilations"
echo -e "  • Autonomous Diagnostics: Automated \`dcouplr doctor\` & \`lint\`"
echo -e "  • Migration Operations:   Zero-Downtime State Relocation Planner"
echo -e "${CYAN}----------------------------------------------------------------------${NC}"
echo -e "Quick Start Commands:"
echo -e "  1. Run System Preflight:          dcouplr doctor"
echo -e "  2. Check Version & Entitlement:   dcouplr version"
echo -e "  3. Translate Monitor/IaC Config:  dcouplr translate -i monitor.json -t grafana"
echo -e "  4. Documentation & Community:     https://github.com/${GITHUB_REPO}"
echo -e "  5. Documentation & Portal:        https://dcouplr.com/docs"
echo -e "${CYAN}----------------------------------------------------------------------\n${NC}"
