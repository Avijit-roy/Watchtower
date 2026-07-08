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

Deployment is fully automated via GitHub Actions, running entirely on free-tier infrastructure — see `TECH_STACK.md` for the full cost breakdown:

1. Push to a feature branch → PR checks run (lint, test, build)
2. Merge to `main` → Docker images built and pushed to **GitHub Container Registry**
3. Auto-deploy to **staging** namespace on the k3s cluster
4. Manual approval gate → deploy to **production** namespace on the same k3s cluster

Kubernetes manifests live in `/k8s`, organized by environment (`/k8s/staging`, `/k8s/production`).

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
- [ ] CI pipeline (lint/test/build)
- [ ] Local Kubernetes deploy (minikube/kind)
- [ ] Free-tier EC2 server + k3s cluster + Nginx Ingress + free TLS
- [ ] CD pipeline with staging/production gates
- [ ] Monitoring & autoscaling
- [ ] Chaos test + self-healing demo

## License

MIT
