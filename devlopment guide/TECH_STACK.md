# Tech Stack

Full technology breakdown for Incident Command, with what each piece is used for and why it was chosen.

## Budget & free-tier strategy

**Target cost: $0.** This project is built to run entirely on free tiers — no credit card charges are required at any point if you follow this stack as written.

The one substitution this requires: **AWS EKS is not free** (its control plane costs ~$0.10/hour regardless of usage, roughly $73/month, with no free-tier exception). Instead, this project runs **self-managed k3s** (a lightweight, production-grade Kubernetes distribution) on a **free-tier AWS EC2 instance**. You still get real Kubernetes, real AWS, real Linux server administration — you're just also managing the control plane yourself, which is a legitimate and common pattern (plenty of startups do exactly this to control cost).

| Piece | Paid default | Free substitute used here |
|---|---|---|
| Kubernetes control plane | AWS EKS (~$73/mo) | Self-managed **k3s** on a free-tier EC2 instance ($0) |
| Container registry | AWS ECR (small cost past free tier) | **GitHub Container Registry** (free, unlimited for public repos) |
| DNS | AWS Route53 (~$0.50/mo per hosted zone) | **sslip.io** (free wildcard DNS that maps to your server's IP, no domain purchase needed) |
| TLS certificates | AWS ACM | **cert-manager + Let's Encrypt** (free, auto-renewing, works with any DNS) |
| Monitoring/logs | AWS CloudWatch (free tier is limited, then billed) | **Prometheus + Grafana**, self-hosted in-cluster (free, open source) |
| Email notifications | AWS SES (requires production access request) | **Nodemailer + a free SMTP provider** (e.g., Gmail app password or Brevo free tier) |
| Database | AWS DocumentDB (no free tier) | **MongoDB Atlas free tier** (M0 cluster, 512MB, free forever) |

**Guardrails to actually stay at $0:**
- Only use AWS services explicitly marked "Free Tier eligible" in the AWS Console
- Set up an **AWS Budget alert at $1** the moment you create your AWS account — this emails you before anything could ever charge your card
- The AWS free tier covers 750 hours/month of a `t2.micro`/`t3.micro` EC2 instance for your first 12 months — that's enough to run one instance 24/7, so no need to stop/start it
- If your 12 months run out and you want to keep the project live for free indefinitely, migrate the same k3s setup to **Oracle Cloud's Always Free tier**, which has no expiry (this is a drop-in swap — same k3s manifests, different VM)

## Application layer

| Technology | Purpose | Why this choice |
|---|---|---|
| **React** (Vite) | Frontend SPA | Fast dev server, industry-standard, large hiring relevance |
| **Node.js + Express** | Backend REST API | Pairs naturally with React (MERN), simple to containerize |
| **MongoDB** (Atlas free tier) | Primary datastore | Flexible schema fits incident/timeline data well; Atlas M0 tier is free forever |
| **Mongoose** | ODM for MongoDB | Schema validation and structure on top of MongoDB's flexibility |
| **Socket.io** | Real-time timeline updates | Simple abstraction over WebSockets with automatic fallback, well-documented |
| **JWT** | Authentication | Stateless auth that works cleanly across horizontally-scaled API pods (no server-side session store needed) |
| **Tailwind CSS** | Styling | Fast, consistent utility-first styling without a separate design system dependency |

## Containerization

| Technology | Purpose | Why this choice |
|---|---|---|
| **Docker** | Package each service into a portable, reproducible image | Industry standard; required for Kubernetes deployment |
| **Multi-stage builds** | Keep production images small | Separates build dependencies from runtime, reduces image size/attack surface |
| **Docker Compose** | Local development orchestration | Runs frontend, API, worker, and MongoDB together with one command, mirrors (loosely) the multi-service production topology |

## Orchestration

| Technology | Purpose | Why this choice |
|---|---|---|
| **Kubernetes** | Container orchestration, self-healing, scaling | The industry standard for production container orchestration; demonstrates the deepest DevOps skill on the list |
| **k3s** (self-managed, on a free-tier EC2 instance) | Lightweight Kubernetes distribution | Real Kubernetes with a much lighter footprint than full K8s — runs comfortably on a single small free-tier VM, unlike EKS which charges for the control plane regardless of size |
| **Horizontal Pod Autoscaler (HPA)** | Auto-scale API pods based on CPU/load | Demonstrates the app can handle real traffic spikes, not just run statically |
| **Kubernetes Secrets & ConfigMaps** | Manage environment-specific config and credentials | Keeps secrets out of source control and images; standard K8s practice |

## Networking & ingress

| Technology | Purpose | Why this choice |
|---|---|---|
| **Nginx Ingress Controller** | Route external traffic to the right service, TLS termination | Most widely used Ingress controller; solid real-world default |
| **cert-manager + Let's Encrypt** | Automatic, free, auto-renewing TLS certificates | No AWS ACM needed; works with any DNS provider, entirely free |
| **sslip.io** | DNS — maps a hostname to your EC2 instance's public IP with zero setup | Free, no domain purchase or Route53 hosted zone required (e.g., `app.<your-ec2-ip>.sslip.io` resolves automatically) |

## CI/CD

| Technology | Purpose | Why this choice |
|---|---|---|
| **GitHub Actions** | CI/CD pipeline (lint, test, build, deploy) | Native to GitHub; **free and unlimited minutes on public repositories** (2,000 min/month free even on private) |
| **GitHub Container Registry (ghcr.io)** | Container image registry | Free and unlimited for public repos, integrates directly with GitHub Actions with no extra credentials to manage |
| **Manual approval gates** | Guard production deploys | Demonstrates a real production workflow, not just "auto-deploy everything" |

## Observability

| Technology | Purpose | Why this choice |
|---|---|---|
| **Prometheus + Grafana**, self-hosted in-cluster | Cluster and app-level metrics dashboards | Industry-standard K8s monitoring stack, entirely free since it runs as pods in your own cluster — no cloud billing risk |
| `kubectl logs` / `kubectl top` | Quick local debugging | Zero setup, useful before Grafana is wired up |

## Notifications

| Technology | Purpose | Why this choice |
|---|---|---|
| **Nodemailer + a free SMTP provider** (Gmail app password or Brevo free tier) | Email notifications | Zero cost, zero approval process — AWS SES requires a "production access" request to send to unverified addresses |
| **Slack Incoming Webhooks** | Slack notifications | Simple to integrate, no OAuth flow required for a single-workspace webhook, completely free |

## Testing

| Technology | Purpose |
|---|---|
| **Jest** | Unit tests (backend and frontend logic) |
| **React Testing Library** | Frontend component tests |
| **Supertest** | API endpoint integration tests |

## Version control & collaboration

| Technology | Purpose |
|---|---|
| **Git / GitHub** | Source control, PR review workflow |
| **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`) | Readable commit history, groundwork for changelogs if needed |

## Environment summary

| Environment | Where it runs | Cost |
|---|---|---|
| **Local** | Docker Compose on developer machine | $0 |
| **Staging** | Namespace on the same k3s cluster, auto-deployed on merge to `main` | $0 (shares the free-tier EC2 instance with production) |
| **Production** | Namespace on the k3s cluster, deployed after manual approval | $0 (within AWS free tier for 12 months; migrate to Oracle Always Free after if needed) |

## Deliberately excluded (and why)

- **Redux / Zustand** — app state needs are simple enough for React Context + local state; adding a state library would be unjustified complexity
- **GraphQL** — REST is sufficient for this data model and keeps the API layer simple to reason about and test
- **AWS EKS** — real managed Kubernetes, but its control plane cost has no free tier; self-managed k3s gets the same learning outcome for $0
- **Terraform** *(not excluded, just not MVP)* — infrastructure is provisioned manually for MVP so every step is understood before automating it; Terraform is a natural stretch goal once the manual process is familiar (see `plan.md`)
- **Service mesh (Istio/Linkerd)** — unnecessary complexity for a 3-service app and for a single small VM; would obscure rather than demonstrate understanding
