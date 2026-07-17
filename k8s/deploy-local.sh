#!/usr/bin/env bash
# deploy-local.sh — Full local Kubernetes deployment for Watchtower
#
# This script automates the complete sequence needed to run Watchtower
# on a local kind cluster. Run it from the project root:
#   bash k8s/deploy-local.sh
#
# Prerequisites:
#   - kind installed (https://kind.sigs.k8s.io)
#   - kubectl installed
#   - Docker running
#   - k8s/secret.yaml created from k8s/secret.example.yaml
#
# What it does:
#   1. Creates a kind cluster with port mapping (localhost:8080 → app)
#   2. Builds all 3 Docker images
#   3. Loads images into kind (so pods don't need a registry)
#   4. Applies all Kubernetes manifests in order
#   5. Waits for pods to be ready
#   6. Prints status and access URL

set -euo pipefail   # exit on error, undefined var, or pipe failure

CLUSTER_NAME="watchtower"
NAMESPACE="watchtower"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}▶ $*${NC}"; }

# ── Preflight checks ──────────────────────────────────────────────────────────
step "Preflight checks"

command -v kind    >/dev/null 2>&1 || error "kind not found. Install: https://kind.sigs.k8s.io"
command -v kubectl >/dev/null 2>&1 || error "kubectl not found."
command -v docker  >/dev/null 2>&1 || error "Docker not found."
docker info        >/dev/null 2>&1 || error "Docker daemon is not running."

[[ -f "$SCRIPT_DIR/secret.yaml" ]] || error "k8s/secret.yaml not found. Copy secret.example.yaml and fill in real values."

success "All tools available"

# ── Step 1: Create kind cluster ───────────────────────────────────────────────
step "Step 1: Create kind cluster"

if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  warn "Cluster '${CLUSTER_NAME}' already exists — skipping create"
else
  info "Creating cluster '${CLUSTER_NAME}'..."
  kind create cluster \
    --name "$CLUSTER_NAME" \
    --config "$SCRIPT_DIR/kind-config.yaml"
  success "Cluster created"
fi

# Set kubectl context
kubectl config use-context "kind-${CLUSTER_NAME}" >/dev/null
success "kubectl context set to kind-${CLUSTER_NAME}"

# ── Step 2: Build Docker images ───────────────────────────────────────────────
step "Step 2: Build Docker images"

cd "$PROJECT_ROOT"

info "Building watchtower-server..."
docker build -f server/Dockerfile -t watchtower-server:latest . --quiet
success "watchtower-server built"

info "Building watchtower-worker..."
docker build -f worker/Dockerfile -t watchtower-worker:latest . --quiet
success "watchtower-worker built"

info "Building watchtower-client..."
docker build -f client/Dockerfile \
  --build-arg VITE_API_URL=http://localhost:5000/api \
  --build-arg VITE_SOCKET_URL=http://localhost:5000 \
  -t watchtower-client:latest . --quiet
success "watchtower-client built"

# ── Step 3: Load images into kind ─────────────────────────────────────────────
step "Step 3: Load images into kind cluster"

# kind load puts local Docker images into the cluster nodes so pods can use them
# without needing imagePullPolicy: Always and a registry
for image in watchtower-server:latest watchtower-worker:latest watchtower-client:latest; do
  info "Loading ${image}..."
  kind load docker-image "$image" --name "$CLUSTER_NAME"
  success "${image} loaded"
done

# ── Step 4: Apply manifests ───────────────────────────────────────────────────
step "Step 4: Apply Kubernetes manifests"

# Order matters: namespace first, then config/secrets, then workloads
info "Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

info "Applying ConfigMap and Secret..."
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/secret.yaml"

# Deploy one at a time per plan.md guidance
info "Deploying server..."
kubectl apply -f "$SCRIPT_DIR/server/service.yaml"
kubectl apply -f "$SCRIPT_DIR/server/deployment.yaml"
kubectl rollout status deployment/watchtower-server -n "$NAMESPACE" --timeout=120s

info "Deploying worker..."
kubectl apply -f "$SCRIPT_DIR/worker/service.yaml"
kubectl apply -f "$SCRIPT_DIR/worker/deployment.yaml"
kubectl rollout status deployment/watchtower-worker -n "$NAMESPACE" --timeout=120s

info "Deploying client..."
kubectl apply -f "$SCRIPT_DIR/client/service.yaml"
kubectl apply -f "$SCRIPT_DIR/client/deployment.yaml"
kubectl rollout status deployment/watchtower-client -n "$NAMESPACE" --timeout=120s

# ── Step 5: Final status ──────────────────────────────────────────────────────
step "Step 5: Deployment Status"

echo ""
kubectl get pods -n "$NAMESPACE" -o wide
echo ""
kubectl get services -n "$NAMESPACE"

echo ""
success "✅ Watchtower is running on your local cluster!"
echo -e "${GREEN}   Access the app at: http://localhost:8080${NC}"
echo ""
echo -e "${BOLD}Useful commands:${NC}"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs <pod-name> -n $NAMESPACE"
echo "  kubectl describe pod <pod-name> -n $NAMESPACE"
echo ""
echo -e "${BOLD}Self-healing demo:${NC}"
echo "  kubectl delete pod \$(kubectl get pods -n $NAMESPACE -l app=watchtower-server -o name | head -1) -n $NAMESPACE"
echo "  kubectl get pods -n $NAMESPACE -w    # watch it recreate"
echo ""
echo -e "${BOLD}Tear down:${NC}"
echo "  kind delete cluster --name $CLUSTER_NAME"
