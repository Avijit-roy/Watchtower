#!/usr/bin/env bash
# deploy-production.sh — Deploy Watchtower to the k3s cluster on EC2.
#
# Run this from your LAPTOP after:
#   1. EC2 instance is running
#   2. k3s is installed (setup-k3s.sh completed)
#   3. kubeconfig is saved to ~/.kube/watchtower-k3s.kubeconfig
#   4. Images are pushed to ghcr.io (push-images.sh completed)
#   5. k8s/production/configmap.yaml has the real <EC2_PUBLIC_IP>
#   6. k8s/production/ingress.yaml has the real <EC2_PUBLIC_IP>
#   7. k8s/production/secret.yaml exists with real base64 values
#   8. Each deployment.yaml has the real <GITHUB_USERNAME>
#
# Usage:
#   export KUBECONFIG=~/.kube/watchtower-k3s.kubeconfig
#   bash k8s/production/deploy-production.sh

set -euo pipefail

NAMESPACE="watchtower"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
step()    { echo -e "\n${BOLD}▶ $*${NC}"; }

# ── Preflight ─────────────────────────────────────────────────────────────────
step "Preflight checks"

command -v kubectl > /dev/null 2>&1 || { echo "kubectl not found"; exit 1; }
kubectl cluster-info > /dev/null 2>&1 || { echo "Cannot connect to cluster. Check KUBECONFIG."; exit 1; }

[[ -f "$SCRIPT_DIR/secret.yaml" ]] || {
  echo "k8s/production/secret.yaml not found."
  echo "Copy secret.example.yaml → secret.yaml and fill in real base64 values."
  exit 1
}

success "Connected to cluster: $(kubectl config current-context)"

# ── Step 1: Namespace ─────────────────────────────────────────────────────────
step "Step 1: Create namespace"
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

# ── Step 2: ConfigMap + Secret ────────────────────────────────────────────────
step "Step 2: Apply ConfigMap and Secret"
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/secret.yaml"

# ── Step 3: ClusterIssuers ────────────────────────────────────────────────────
step "Step 3: Apply cert-manager ClusterIssuers"
kubectl apply -f "$SCRIPT_DIR/clusterissuer.yaml"
info "Waiting 10s for cert-manager to process ClusterIssuers..."
sleep 10

# ── Step 4: Workloads (one at a time, verify each) ────────────────────────────
step "Step 4: Deploy server"
kubectl apply -f "$SCRIPT_DIR/server/service.yaml"
kubectl apply -f "$SCRIPT_DIR/server/deployment.yaml"
kubectl rollout status deployment/watchtower-server -n "$NAMESPACE" --timeout=120s

step "Step 5: Deploy worker"
kubectl apply -f "$SCRIPT_DIR/worker/service.yaml"
kubectl apply -f "$SCRIPT_DIR/worker/deployment.yaml"
kubectl rollout status deployment/watchtower-worker -n "$NAMESPACE" --timeout=120s

step "Step 6: Deploy client"
kubectl apply -f "$SCRIPT_DIR/client/service.yaml"
kubectl apply -f "$SCRIPT_DIR/client/deployment.yaml"
kubectl rollout status deployment/watchtower-client -n "$NAMESPACE" --timeout=120s

# ── Step 7: Ingress (triggers cert issuance) ──────────────────────────────────
step "Step 7: Apply Ingress (triggers TLS certificate issuance)"
kubectl apply -f "$SCRIPT_DIR/ingress.yaml"

info "Certificate issuance takes 1-3 minutes. Watch progress with:"
info "  kubectl describe certificate -n $NAMESPACE"
info "  kubectl get certificaterequest -n $NAMESPACE"

# ── Final status ──────────────────────────────────────────────────────────────
step "Deployment Status"
echo ""
kubectl get pods -n "$NAMESPACE"
echo ""
kubectl get ingress -n "$NAMESPACE"
echo ""

HOST=$(kubectl get ingress watchtower-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "<your-ip>.sslip.io")
success "✅ Watchtower deployed!"
echo -e "${GREEN}   App URL (HTTPS ready in ~2min): https://${HOST}${NC}"
echo ""
echo -e "${BOLD}Self-healing demo:${NC}"
echo "  kubectl delete pod \$(kubectl get pods -n $NAMESPACE -l app=watchtower-server -o name | head -1) -n $NAMESPACE"
echo "  kubectl get pods -n $NAMESPACE -w"
