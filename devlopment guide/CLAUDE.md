# CLAUDE.md

Guidance for Claude (or any AI coding assistant) working in this repository. Read this before making changes.

## Project summary

Incident Command is a MERN-stack incident management platform, deployed via Docker + Kubernetes (self-managed **k3s** on a free-tier AWS EC2 instance) with a GitHub Actions CI/CD pipeline and Nginx Ingress. **The entire project is built to run at $0 cost** — see `TECH_STACK.md` for the full free-tier strategy before introducing any new infrastructure. See `PRD.md` for full requirements and `README.md` for setup/deployment instructions.

## Repository structure

```
incident-command/
├── client/              # React frontend (Vite)
├── server/              # Express API + Socket.io
├── worker/              # Notification worker (email/Slack)
├── k8s/
│   ├── staging/
│   └── production/
├── nginx/                # Ingress + nginx.conf
├── .github/workflows/    # CI/CD pipeline definitions
├── docker-compose.yml    # Local dev orchestration
├── README.md
├── PRD.md
├── CLAUDE.md
├── TECH_STACK.md
├── FRONTEND_GUIDELINES.md
├── rules.md
└── plan.md
```

## Related docs

Read these alongside this file, depending on the change you're making:

- `PRD.md` — what's in scope and why (check before adding/changing functionality)
- `TECH_STACK.md` — the fixed set of technologies and the reasoning behind each choice
- `FRONTEND_GUIDELINES.md` — React/client-side conventions (defer to this over general React habits)
- `rules.md` — hard rules on security, git workflow, and deploy process
- `plan.md` — current phase and what's already been built vs. what's next

## Tech stack conventions

- **Frontend:** React (functional components + hooks only, no class components), fetch data via a small API client module rather than inline fetch calls scattered across components
- **Backend:** Express, organized by feature (`routes/`, `controllers/`, `models/`, `services/`) — not by file type alone
- **Real-time:** Socket.io events are namespaced per incident room (`incident:<id>`); don't broadcast globally
- **Database:** Mongoose schemas live in `server/models/`; keep validation in the schema, not scattered in controllers
- **Styling:** Keep it simple and consistent — pick one approach (CSS modules or Tailwind) and stick to it across the app

## Coding guidelines

- Prefer explicit, readable code over clever one-liners — this is a portfolio project meant to be read by reviewers
- Every API route should have basic input validation and consistent error response shape: `{ error: string }`
- Never hardcode secrets, URLs, or credentials — use environment variables, and update `.env.example` whenever a new variable is introduced
- Write meaningful commit messages (`feat:`, `fix:`, `chore:`, `docs:` prefixes) — commit history is part of the portfolio story
- Add comments explaining *why*, not *what*, especially around infra/deploy code

## Docker

- Each service (`client`, `server`, `worker`) has its own `Dockerfile` using multi-stage builds (build stage + slim runtime stage)
- Keep images small — use `node:alpine` base images where possible
- `docker-compose.yml` is for local development only; it is not used in production deployment

## Kubernetes

- Manifests are split by environment under `k8s/staging` and `k8s/production` — avoid duplicating shared config; use Kustomize overlays if complexity grows
- Every Deployment must define resource `requests`/`limits` and readiness/liveness probes hitting a real health endpoint (`/healthz`)
- Secrets (DB URI, JWT secret, webhook URLs) go in Kubernetes Secrets, never in ConfigMaps or committed manifests
- HPA config targets CPU utilization for the API deployment; document any threshold changes in the PR description

## CI/CD (GitHub Actions)

- Workflow files live in `.github/workflows/`
- PR workflow: lint → unit tests → Docker build (no push, no deploy)
- Main-branch workflow: build → push to GitHub Container Registry → deploy to staging automatically → require manual approval before production deploy
- Any change to deploy workflows should be tested against staging first — never modify the production deploy job without a corresponding staging validation

## When making changes, Claude should:

1. **Check `PRD.md` first** if the change affects functionality — confirm it aligns with defined scope (MVP vs. out-of-scope vs. stretch)
2. **Check `rules.md`** for anything touching security, git workflow, or the deploy pipeline — those rules are non-negotiable
3. **Follow `FRONTEND_GUIDELINES.md`** for any change inside `client/`
4. **Keep services decoupled** — the API should not directly send notifications; that's the worker's job
5. **Update documentation alongside code** — if you add an env var, a new endpoint, or a new K8s resource, update the relevant doc (`README.md`, `TECH_STACK.md`, or `PRD.md`) in the same change, and check off the relevant item in `plan.md`
6. **Not introduce new infrastructure tools or any non-free-tier resource** (e.g., swapping Nginx for Traefik, switching from k3s to a paid managed control plane, or provisioning an AWS resource that isn't free-tier eligible) without flagging it — the tech stack in `TECH_STACK.md` is intentionally fixed to match the project's DevOps learning goals **and its $0 budget**
7. **Favor clarity over premature optimization** — this project prioritizes demonstrating clean, professional workflows over cleverness

## What NOT to do

- Don't commit `.env` files or real credentials, even example-looking ones that resemble real keys
- Don't add authentication/authorization shortcuts (e.g., disabling JWT checks "temporarily") — security posture is part of what this project demonstrates
- Don't bypass the CI pipeline by pushing images or manifests manually once the pipeline exists — the automated path is the point of the project
- Don't scope-creep into features marked "out of scope" in `PRD.md` (on-call scheduling, multi-tenancy, mobile app) without explicit discussion

## Useful commands

```bash
# Local dev (all services)
docker-compose up --build

# Run server tests
cd server && npm test

# Run client tests
cd client && npm test

# Lint
npm run lint --workspaces

# Build and tag an image manually (for debugging, not for deploy)
docker build -t incident-command-server ./server

# Apply k8s manifests to a local cluster
kubectl apply -k k8s/staging
```
