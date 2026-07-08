# Product Requirements Document: Incident Command

## 1. Overview

**Product name:** Incident Command
**Owner:** [Your name]
**Status:** Draft / In development
**Last updated:** [date]

### 1.1 Problem statement

When a production system fails, engineering teams need to coordinate a response quickly. Without a dedicated tool, this coordination happens across fragmented channels — Slack messages, phone calls, ad-hoc documents — making it hard to know the current status, who's doing what, and what already happened. After the incident, writing a postmortem requires manually reconstructing a timeline from scattered sources, which is slow and error-prone.

### 1.2 Goal

Build a single platform where a team can declare an incident, coordinate the response in real time, keep external stakeholders informed via a public status page, and automatically generate a postmortem draft from the incident timeline.

### 1.3 Success criteria

- A user can declare an incident in under 10 seconds
- Responders can post timeline updates that all viewers see in real time (< 1s latency)
- A public status page reflects the current incident status without manual duplication of effort
- A postmortem draft is generated automatically and requires only light editing
- The system stays available and self-heals during a simulated failure (demonstrated via chaos test)

## 2. Users & personas

| Persona | Needs |
|---|---|
| **Responder** (engineer) | Declare incidents, log actions, coordinate with other responders |
| **Admin** (eng lead / SRE) | Manage users/roles, view all incidents, oversee postmortem quality |
| **Stakeholder** (PM, support, exec) | View status page, understand impact and ETA without joining the response |
| **Customer** (external, optional) | View public status page only |

## 3. Scope

### 3.1 In scope (MVP)

- User authentication with role-based access (Responder, Admin, Read-only)
- Create/update/resolve incidents with severity levels (SEV1–SEV4)
- Tag incidents with affected services
- Real-time shared timeline per incident (Socket.io)
- Public status page reflecting current open incidents and their status
- Auto-generated postmortem draft (markdown) on resolution
- Email/Slack notification on incident creation and major status changes

### 3.2 Out of scope (MVP)

- Automated incident detection (e.g., integration with monitoring tools to auto-create incidents) — stretch goal
- On-call scheduling / paging rotations
- Multi-tenant support (single organization only for MVP)
- Mobile app (responsive web only)

### 3.3 Stretch goals

- Prometheus/Grafana integration for live metrics on the incident page
- Slack slash-command to declare incidents directly from Slack
- Auto-scaling demonstration and chaos-engineering test suite

## 4. Functional requirements

### 4.1 Incident management
- FR1: A Responder can create an incident with title, description, severity, and affected services
- FR2: A Responder can change incident status (Investigating → Identified → Monitoring → Resolved)
- FR3: An Admin can assign/reassign responders to an incident
- FR4: All incident actions are timestamped and attributed to a user

### 4.2 Real-time timeline
- FR5: Any authorized user can post a timeline entry (free text) to an active incident
- FR6: Timeline entries appear in real time for all viewers of that incident without a page refresh

### 4.3 Status page
- FR7: The public status page lists all currently open incidents, their severity, and latest status
- FR8: Resolved incidents move to a "recent history" section after resolution
- FR9: The status page requires no authentication to view

### 4.4 Postmortem generation
- FR10: On incident resolution, the system compiles the full timeline into a structured markdown document
- FR11: The generated postmortem includes: incident summary, timeline, root cause field (manual entry), and action items (manual entry)
- FR12: Postmortems are editable after generation and exportable as a markdown file download directly from the app (stored in MongoDB alongside the incident — no separate file storage service needed)

### 4.5 Notifications
- FR13: The system sends a notification (email and/or Slack webhook) when an incident is created
- FR14: The system sends a notification when an incident is resolved

### 4.6 Auth & access control
- FR15: Users authenticate via email/password (JWT-based sessions)
- FR16: Role-based permissions enforced on both API and UI (Responder / Admin / Read-only)

## 5. Non-functional requirements

- **Availability:** The application should remain available during a single-pod failure (validated via chaos test)
- **Scalability:** API and worker services scale horizontally under load (validated via HPA demo)
- **Performance:** Timeline updates propagate to connected clients in under 1 second
- **Security:** Secrets (DB credentials, JWT secret, webhook URLs) are never committed to source control; managed via Kubernetes Secrets
- **Observability:** Basic health/readiness endpoints exposed for Kubernetes probes; logs/metrics via self-hosted Prometheus + Grafana
- **Cost:** The entire system must run at $0 — every infrastructure choice is validated against the free-tier strategy in `TECH_STACK.md` before being adopted

## 6. System architecture (summary)

- **Frontend:** React SPA served as a separate Kubernetes Deployment
- **API:** Node/Express REST + Socket.io service, separate Deployment
- **Worker:** Dedicated Node service for outbound notifications (email/Slack), decoupled from the API via a queue or event emitter
- **Database:** MongoDB Atlas (free M0 tier)
- **Ingress:** Nginx Ingress Controller handles routing; cert-manager + Let's Encrypt handles TLS termination
- **Infra:** Self-managed k3s on a free-tier AWS EC2 instance, GitHub Container Registry (images), sslip.io (DNS), Prometheus + Grafana (logs/metrics) — see `TECH_STACK.md` for the full free-tier breakdown

## 7. CI/CD requirements

- PR to any branch triggers lint + unit tests + Docker build (no deploy)
- Merge to `main` triggers: build → push images to GitHub Container Registry → deploy to staging namespace automatically
- Deploy to production namespace requires a manual approval step in GitHub Actions
- Rollback strategy: previous image tag redeployable via a single workflow dispatch

## 8. Milestones

High-level delivery arc, grouped into three stages. See `plan.md` for the authoritative, detailed 8-phase build plan with weekly checklists — that file is the source of truth for current progress; this table should not be tracked separately.

| Stage | Covers | Detail in `plan.md` |
|---|---|---|
| Build the product | Core app, real-time timeline, status page, postmortem generation | Phases 1–2 |
| Containerize & automate | Docker, CI pipeline, local Kubernetes | Phases 3–5 |
| Ship to production | Free-tier EC2 + k3s infrastructure, full CD pipeline, autoscaling, chaos test | Phases 6–8 |

## 9. Risks & open questions

- **Cost drift:** The free-tier strategy in `TECH_STACK.md` only holds if every new AWS resource is confirmed "Free Tier eligible" before creation — a Budget Alert at $1 should catch any mistake early
- **12-month free tier expiry:** AWS's EC2 free tier lasts 12 months from account creation; the plan is to migrate the same k3s setup to Oracle Cloud's Always Free tier if the project needs to stay live longer
- **Self-managed control plane:** k3s means you (not AWS) are responsible for the Kubernetes control plane — this is more to learn than EKS, but it's also more of the actual skill recruiters are testing for
- **Scope creep:** Automated incident detection and on-call scheduling are compelling but should stay out of MVP to protect the timeline
