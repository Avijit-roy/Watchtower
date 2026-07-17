# Incident Command

A collaborative incident management platform for engineering teams — declare incidents, coordinate response in real time, keep stakeholders updated with a public status page, and auto-generate postmortems when it's over.

Built with the MERN stack and deployed using a production-grade DevOps pipeline: Docker, Kubernetes (self-managed k3s on AWS), Nginx Ingress, GitHub Actions CI/CD, and free-tier cloud infrastructure — **$0 to build and run**. See `TECH_STACK.md` for the full free-tier strategy.

---

## Why this project exists

When production breaks, most teams coordinate the response across scattered Slack threads, phone calls, and tribal memory. Incident Command gives them one place to:

- Declare an incident and set its severity
- Log a live, shared timeline of what's being tried and what's happening
- Show customers/stakeholders a status page that updates automatically
- Auto-draft a postmortem from the timeline once the incident is resolved
- Notify the right people the moment something breaks

## Features

| Feature | Description |
|---|---|
| Incident creation & triage | Create an incident, set severity (SEV1–SEV4), tag affected services, assign responders |
| Real-time collaboration | Socket.io-powered live timeline so multiple responders can coordinate without leaving the page |
| Public status page | Auto-updates as incident status changes — mirrors real-world tools like Statuspage |
| Postmortem generator | Converts the incident timeline into a structured markdown report on resolution |
| Notifications | Email / Slack webhook alerts on incident creation and status changes |
| Auth & RBAC | Responder, Admin, and Read-only stakeholder roles |

## Tech Stack

**Application**
- MongoDB, Express.js, React, Node.js (MERN)
- Socket.io for real-time updates
- JWT-based authentication

**Infrastructure & DevOps** *(all free-tier — see `TECH_STACK.md` for the full $0 breakdown)*
- Docker (multi-stage builds for frontend, API, and worker services)
- Kubernetes via self-managed **k3s** on a free-tier AWS EC2 instance, with Horizontal Pod Autoscaling
- Nginx Ingress Controller (routing) + cert-manager with Let's Encrypt (free TLS)
- GitHub Actions (lint → test → build → push → deploy, with staging/production gates)
- GitHub Container Registry for images, sslip.io for DNS (no domain purchase needed)
- Prometheus + Grafana, self-hosted in-cluster, for monitoring

## Architecture

```
                        ┌─────────────┐
                        │  sslip.io   │  (free DNS → EC2 IP)
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │ Nginx Ingress│  (TLS via cert-manager + Let's Encrypt)
                        └──────┬──────┘
                 ┌─────────────┼─────────────┐
          ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
          │  Frontend   │ │   API    │ │  Worker    │
          │  (React)    │ │ (Node)   │ │ (Notify)   │
          │  Pod x N    │ │ Pod x N  │ │  Pod x N   │
          └─────────────┘ └────┬─────┘ └────────────┘

                                │
                         ┌──────▼──────┐
                         │  MongoDB    │
                         │ MongoDB Atlas│  (free M0 tier)
                         └─────────────┘
```

All services run as separate Kubernetes Deployments behind a shared Ingress, scaled independently via HPA, deployed automatically via GitHub Actions on merge to `main`.

## Local Development

You can run the application locally either using npm workspaces (for bare-metal development) or Docker Compose (once Phase 3 is set up).

### 1. Bare-metal Development (npm Workspaces)

```bash
# Clone the repo
git clone https://github.com/<your-username>/incident-command.git
cd incident-command

# Install all dependencies for all workspaces (client, server, worker) and link them
npm install

# Start all three services concurrently in development mode
npm run dev

# Run server integration tests
npm run test:server
```

- **Frontend (Client):** http://localhost:5173
- **API Server:** http://localhost:5000
- **Notification Worker:** http://localhost:5001

### 2. Environment Variables

Copy the root [.env.example](file:///media/avijit/DATA1/vsproject/my%20file/webdeveloping/Watchtower/.env.example) to `.env` inside `/server` and `/worker` subdirectories:

* **Server env (`server/.env`):**
  - Needs `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `WORKER_URL`.
* **Worker env (`worker/.env`):**
  - Needs `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SLACK_WEBHOOK_URL`, and `NOTIFICATION_EMAIL`.


## Deployment

Deployment is fully automated via GitHub Actions, running entirely on free-tier infrastructure (k3s on AWS EC2, GHCR, MongoDB Atlas) — see `TECH_STACK.md` for the full cost breakdown.

### CI/CD Pipeline Architecture
```
  [Developer Push]
         │
         ▼
  ┌──────────────┐
  │  CI Pipeline │ (PR checks: lint, test, dry-run build)
  └──────┬───────┘
         │ (Merge to main)
         ▼
  ┌──────────────┐
  │ Build & Push │ (Builds environment-agnostic client/server/worker, tags latest + SHA, pushes to GHCR)
  └──────┬───────┘
         │
         ▼
  ┌─────────────────┐
  │ Deploy Staging  │ (Auto-deploys to 'watchtower-staging' namespace; URL: staging.<IP>.sslip.io)
  └──────┬──────────┘
         │
         ▼
 ┌───────────────┐
 │   Approval    │ (Requires manual review and approval in GitHub Environment settings)
 └──────┬────────┘
        │ (Approved)
        ▼
  ┌─────────────────┐
  │Deploy Production│ (Deploys to 'watchtower' namespace; URL: <IP>.sslip.io)
  └─────────────────┘
```

### GitHub Secrets Setup
To enable the deployment, configure the following secrets under **Settings** → **Secrets and variables** → **Actions** in your GitHub repository:
- `KUBECONFIG`: The contents of your Kubernetes cluster's kubeconfig (typically retrieved from `/etc/rancher/k3s/k3s.yaml` on your EC2 instance).
- `MONGODB_URI`: The MongoDB Atlas connection string.
- `JWT_SECRET`: Secret key used for signing JWT auth tokens.
- `SMTP_USER`: Gmail/SMTP username for notifications.
- `SMTP_PASS`: Gmail/SMTP password or app-specific password.
- `SLACK_WEBHOOK_URL`: Webhook URL for Slack alerts.

### Configuring Manual Approval Gate
1. Navigate to your GitHub repository.
2. Go to **Settings** → **Environments**.
3. Click **New environment** and name it `production`.
4. Check the box for **Required reviewers** and add yourself (or designated reviewers).
5. Save. Any build to production will now pause and wait for your manual approval.

### Rollbacks on Demand
If a deployment fails or contains bugs, you can manually trigger a rollback to any previous version:
1. Navigate to the **Actions** tab in GitHub.
2. Select the **Manual Rollback** workflow on the left sidebar.
3. Click the **Run workflow** dropdown.
4. Select the target **Environment** (`staging` or `production`) and enter the specific Docker tag (e.g. `sha-8a2bf63`).
5. Click **Run workflow**. The pipeline will immediately update the running images to the specified tag and verify the rollout.

Kubernetes manifests live in [/k8s](file:///media/avijit/DATA1/vsproject/my%20file/webdeveloping/Watchtower/k8s), organized by environment ([/k8s/staging](file:///media/avijit/DATA1/vsproject/my%20file/webdeveloping/Watchtower/k8s/staging), [/k8s/production](file:///media/avijit/DATA1/vsproject/my%20file/webdeveloping/Watchtower/k8s/production)).

## Project Structure

```
incident-command/
├── client/              # React frontend (Vite)
├── server/              # Express API + Socket.io
├── worker/              # Notification worker service
├── k8s/
│   ├── staging/
│   └── production/
├── nginx/               # Nginx Ingress config
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml
├── README.md
├── PRD.md
├── CLAUDE.md
├── TECH_STACK.md
├── FRONTEND_GUIDELINES.md
├── rules.md
└── plan.md
```

## Documentation

| File | Purpose |
|---|---|
| `PRD.md` | Full product requirements, scope, and functional requirements |
| `TECH_STACK.md` | Every technology used, with rationale, and what was deliberately excluded |
| `FRONTEND_GUIDELINES.md` | React conventions, folder structure, styling, and accessibility rules |
| `rules.md` | Non-negotiable engineering and security rules for all contributors |
| `plan.md` | Detailed, week-by-week phased build plan with checklists |
| `CLAUDE.md` | Guidance for AI-assisted development on this repo |

## Roadmap

See `plan.md` for the full phased build plan with detailed checklists. High-level summary:

- [x] Core MERN app (incidents, timeline, auth)
- [x] Dockerize all services
- [x] CI pipeline (lint/test/build)
- [x] Local Kubernetes deploy (minikube/kind)
- [x] Free-tier EC2 server + k3s cluster + Nginx Ingress + free TLS
- [ ] CD pipeline with staging/production gates
- [ ] Monitoring & autoscaling
- [ ] Chaos test + self-healing demo

## License

MIT
