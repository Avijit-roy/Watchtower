#!/usr/bin/env bash
# push-images.sh — Build and push all 3 images to GitHub Container Registry (ghcr.io).
#
# Prerequisites:
#   1. GitHub Personal Access Token (PAT) with write:packages scope
#      Create at: https://github.com/settings/tokens → Tokens (classic)
#      Scopes needed: write:packages, read:packages, delete:packages
#   2. Docker logged in to ghcr.io:
#      echo "<YOUR_PAT>" | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
#
# Usage:
#   GITHUB_USERNAME=your-username EC2_PUBLIC_IP=3.110.45.67 bash k8s/production/push-images.sh
#
# Or set them in your shell:
#   export GITHUB_USERNAME=your-github-username
#   export EC2_PUBLIC_IP=3.110.45.67     # your actual EC2 IP
#   bash k8s/production/push-images.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
GITHUB_USERNAME="${GITHUB_USERNAME:-}"
EC2_PUBLIC_IP="${EC2_PUBLIC_IP:-}"

if [[ -z "$GITHUB_USERNAME" || -z "$EC2_PUBLIC_IP" ]]; then
  echo "ERROR: Set GITHUB_USERNAME and EC2_PUBLIC_IP environment variables."
  echo "Usage: GITHUB_USERNAME=myuser EC2_PUBLIC_IP=3.110.45.67 bash push-images.sh"
  exit 1
fi

REGISTRY="ghcr.io/${GITHUB_USERNAME}"
VITE_API_URL="https://${EC2_PUBLIC_IP}.sslip.io/api"
VITE_SOCKET_URL="https://${EC2_PUBLIC_IP}.sslip.io"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
step()    { echo -e "\n${BOLD}▶ $*${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# ── Build + push server ───────────────────────────────────────────────────────
step "Build + push watchtower-server"
docker build -f server/Dockerfile -t "${REGISTRY}/watchtower-server:latest" .
docker push "${REGISTRY}/watchtower-server:latest"
success "watchtower-server pushed to ${REGISTRY}/watchtower-server:latest"

# ── Build + push worker ───────────────────────────────────────────────────────
step "Build + push watchtower-worker"
docker build -f worker/Dockerfile -t "${REGISTRY}/watchtower-worker:latest" .
docker push "${REGISTRY}/watchtower-worker:latest"
success "watchtower-worker pushed to ${REGISTRY}/watchtower-worker:latest"

# ── Build + push client ───────────────────────────────────────────────────────
step "Build + push watchtower-client"
# The client image must be built with the PRODUCTION URLs baked in (Vite env vars)
docker build -f client/Dockerfile \
  --build-arg "VITE_API_URL=${VITE_API_URL}" \
  --build-arg "VITE_SOCKET_URL=${VITE_SOCKET_URL}" \
  -t "${REGISTRY}/watchtower-client:latest" .
docker push "${REGISTRY}/watchtower-client:latest"
success "watchtower-client pushed to ${REGISTRY}/watchtower-client:latest"

echo ""
success "All images pushed to ghcr.io!"
echo ""
echo -e "${BOLD}Now update the deployment YAMLs:${NC}"
echo "  sed -i 's|<GITHUB_USERNAME>|${GITHUB_USERNAME}|g' k8s/production/server/deployment.yaml"
echo "  sed -i 's|<GITHUB_USERNAME>|${GITHUB_USERNAME}|g' k8s/production/worker/deployment.yaml"
echo "  sed -i 's|<GITHUB_USERNAME>|${GITHUB_USERNAME}|g' k8s/production/client/deployment.yaml"
echo ""
echo -e "${BOLD}And update ingress + configmap:${NC}"
echo "  sed -i 's|<EC2_PUBLIC_IP>|${EC2_PUBLIC_IP}|g' k8s/production/ingress.yaml"
echo "  sed -i 's|<EC2_PUBLIC_IP>|${EC2_PUBLIC_IP}|g' k8s/production/configmap.yaml"
echo ""
echo -e "${BOLD}Create ghcr pull secret on the cluster:${NC}"
echo "  kubectl create secret docker-registry ghcr-credentials \\"
echo "    --docker-server=ghcr.io \\"
echo "    --docker-username=${GITHUB_USERNAME} \\"
echo "    --docker-password=<YOUR_GITHUB_PAT> \\"
echo "    -n watchtower"
