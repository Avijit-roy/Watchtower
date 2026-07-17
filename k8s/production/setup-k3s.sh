#!/usr/bin/env bash
# setup-k3s.sh — Run this ON the EC2 instance after SSH-ing in.
#
# What it does:
#   1. Installs k3s (lightweight Kubernetes)
#   2. Installs Nginx Ingress Controller
#   3. Installs cert-manager
#   4. Prints the kubeconfig you need to copy to your laptop
#
# Usage (from your laptop):
#   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
#   bash -s < k8s/production/setup-k3s.sh
#
# Or copy and paste the contents manually section by section.

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
step()    { echo -e "\n${BOLD}▶ $*${NC}"; }

# ── Step 1: Install k3s ───────────────────────────────────────────────────────
step "Step 1: Install k3s"

# --disable traefik: k3s ships with Traefik by default; we use Nginx instead
# per TECH_STACK.md. Disabling it prevents port conflicts.
curl -sfL https://get.k3s.io | sh -s - \
  --disable traefik \
  --write-kubeconfig-mode 644

success "k3s installed"

# Wait for k3s node to be Ready
info "Waiting for k3s node to be Ready..."
until sudo kubectl get nodes | grep -q " Ready"; do
  sleep 2
done
success "Node is Ready"
sudo kubectl get nodes

# ── Step 2: Install Nginx Ingress Controller ──────────────────────────────────
step "Step 2: Install Nginx Ingress Controller"

# The 'cloud' variant works for bare-metal/VMs with LoadBalancer support.
# k3s includes klipper-lb which handles LoadBalancer services on a single node.
sudo kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

info "Waiting for ingress-nginx controller to be ready (this takes ~60s)..."
sudo kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

success "Nginx Ingress Controller ready"

# ── Step 3: Install cert-manager ──────────────────────────────────────────────
step "Step 3: Install cert-manager"

sudo kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml

info "Waiting for cert-manager pods to be ready (this takes ~60s)..."
sudo kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

success "cert-manager ready"

# ── Step 4: Print kubeconfig ──────────────────────────────────────────────────
step "Step 4: Your kubeconfig"

echo ""
echo -e "${YELLOW}Copy this kubeconfig to your laptop:${NC}"
echo -e "${YELLOW}(Replace <EC2_PUBLIC_IP> in the server URL with your actual IP)${NC}"
echo ""
sudo cat /etc/rancher/k3s/k3s.yaml | sed "s/127.0.0.1/$(curl -s ifconfig.me)/g"
echo ""

success "k3s setup complete!"
echo ""
echo -e "${BOLD}Next steps (run from your LAPTOP after copying the kubeconfig):${NC}"
echo "  1. Save the kubeconfig above to: ~/.kube/watchtower-k3s.kubeconfig"
echo "  2. Test: KUBECONFIG=~/.kube/watchtower-k3s.kubeconfig kubectl get nodes"
echo "  3. Then run: bash k8s/production/deploy-production.sh"
