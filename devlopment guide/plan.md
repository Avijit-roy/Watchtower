# Build Plan

A phased plan for building Incident Command, from local MERN app to a fully deployed, self-healing system — for **$0 total cost**. Each phase should result in something demoable — don't move on until the current phase actually works.

You're starting from zero in DevOps, so this plan is written to teach the "why" before the "how" at each step, not just hand you commands to copy. Working basically full-time, expect **5-6 weeks**. Don't rush the Kubernetes phases (5-7) — that's the part recruiters will actually probe you on, and it's the part you know least right now.

**Cost target: $0.** See `TECH_STACK.md` for the full free-tier substitution list (self-managed k3s instead of EKS, free DNS/TLS, self-hosted monitoring, etc.).

---

## Phase 0 — Foundations before you write code (Week 1, first 2-3 days)

**Goal:** Enough working knowledge that Phases 5-7 don't feel like magic. Skipping this phase is the #1 way beginners get stuck later and give up.

- [x] Learn Docker basics: images vs. containers, `Dockerfile` structure, `docker build`/`docker run` (a couple hours of a beginner tutorial is enough — you'll cement it in Phase 3)
- [x] Learn Kubernetes core concepts *conceptually* before touching YAML: Pod, Deployment, Service, Ingress, ConfigMap, Secret — what each one is *for*, not syntax yet
- [x] Skim what a CI/CD pipeline actually automates (you'll build one in Phase 4, so a mental model now saves confusion later)
- [x] Create your AWS account, immediately set up a **Billing Alert at $1** (AWS Console → Billing → Budgets) — this is your safety net, do this before anything else in AWS
- [x] Create a free MongoDB Atlas account and free GitHub account (if you don't already have one)

**Demo at end of phase:** You can explain, in your own words, the difference between a container and a Pod, and why an Ingress exists. No code yet — that's fine.

## Phase 1 — Core MERN application (Week 1-2)

**Goal:** A fully working app running locally with `npm run dev`, no Docker yet.

- [x] Set up `client/` (Vite + React) and `server/` (Express) as separate folders
- [x] MongoDB connection (Atlas free tier) via Mongoose
- [x] User model + JWT auth (register/login, role field: responder/admin/readonly)
- [x] Incident model (title, description, severity, status, affected services, timestamps)
- [x] Timeline entry model (linked to incident, author, text, timestamp)
- [x] REST endpoints: CRUD for incidents, add timeline entry, update status
- [x] Basic React UI: login, incident list, incident detail with timeline
- [x] Role-based UI gating (Responder can post updates, Read-only cannot)

**Demo at end of phase:** Log in, create an incident, post timeline updates, resolve it — all in the browser, no real-time yet.

## Phase 2 — Real-time + status page + postmortems (Week 2)

**Goal:** The features that make this more than a CRUD app.

- [x] Integrate Socket.io: timeline updates broadcast live to all viewers of an incident
- [x] Public status page route (no auth) listing open incidents + recent history
- [x] Postmortem generator: on resolve, compile timeline into a markdown document, store and display it
- [x] Notification worker: separate Node process/service that sends email (Nodemailer + free SMTP) / Slack webhook on incident create/resolve

**Demo at end of phase:** Two browser windows show live timeline sync; resolving an incident produces a postmortem and triggers a Slack/email notification.

## Phase 3 — Dockerize everything (Week 2-3)

**Goal:** The full app runs via one `docker-compose up` command.

- [x] Write multi-stage `Dockerfile` for `client/`, `server/`, `worker/`
- [x] Write `docker-compose.yml` wiring frontend, API, worker together (MongoDB stays on Atlas, not containerized)
- [x] Confirm environment variables flow correctly through Compose
- [x] Add health-check endpoints (`/healthz`) to API and worker for later use in Kubernetes probes

**Demo at end of phase:** Fresh clone of the repo, `docker-compose up --build`, full app works with no local Node install required.

## Phase 4 — CI pipeline (Week 3)

**Goal:** Every PR is automatically linted, tested, and build-checked — for free.

- [ ] Make the GitHub repo **public** — this gives you unlimited free GitHub Actions minutes and free GitHub Container Registry storage (both are limited on private repos)
- [x] GitHub Actions workflow: on PR — install deps, lint, run tests
- [x] Add Docker build step to the same workflow (build only, no push yet)
- [ ] Branch protection on `main`: PRs required, CI must pass before merge

**Demo at end of phase:** Open a PR with a deliberate lint error, watch CI fail; fix it, watch CI pass.

## Phase 5 — Kubernetes locally (Week 3-4)

**Goal:** Understand Kubernetes fundamentals hands-on before touching a real server. This is the phase to slow down on.

- [ ] Install `kind` or `minikube` for a local cluster
- [ ] Write Deployment + Service manifests for `client`, `server`, `worker`, one at a time — deploy and verify each before adding the next, don't write all three blind
- [ ] Write ConfigMap/Secret manifests for environment variables
- [ ] Deploy manually with `kubectl apply -f`, verify pods run and app is reachable
- [ ] Add readiness/liveness probes pointing at `/healthz`
- [ ] Manually kill a pod (`kubectl delete pod <name>`) and watch Kubernetes recreate it — this is your first self-healing demo, and the moment Kubernetes "clicks"
- [ ] Practice basic debugging: `kubectl get pods`, `kubectl describe pod`, `kubectl logs` — you'll use these constantly later

**Demo at end of phase:** App running on a local cluster, screenshot/GIF of a killed pod automatically recovering. You should be comfortable enough with `kubectl` that Phase 7 doesn't feel scary.

## Phase 6 — Free-tier server + k3s (Week 4)

**Goal:** A real Kubernetes cluster running on a real cloud server — for $0.

- [ ] Launch a free-tier `t3.micro` (or `t2.micro`) EC2 instance on AWS — confirm it's tagged "Free tier eligible" in the console before launching
- [ ] SSH into the instance, install **k3s** (a single install script — much simpler than setting up full Kubernetes by hand)
- [ ] Copy the kubeconfig off the server so you can run `kubectl` against it from your laptop
- [ ] Set up a GitHub Container Registry (ghcr.io) repository and confirm you can push an image to it from GitHub Actions
- [ ] Install the Nginx Ingress Controller on the k3s cluster
- [ ] Install **cert-manager** and point it at Let's Encrypt for automatic TLS certificates
- [ ] Use **sslip.io** to get a working hostname pointed at your EC2 instance's public IP (no domain purchase, no Route53) — e.g. `app.<your-ec2-ip>.sslip.io`
- [ ] Deploy the manifests from Phase 5 to this real cluster manually, confirm the app is reachable over HTTPS

**Demo at end of phase:** App live on a real URL with a valid HTTPS certificate, running on your own AWS server — for $0/month.

## Phase 7 — Full CD pipeline (Week 5)

**Goal:** Merging to `main` deploys automatically, with a safety gate before production.

- [ ] Extend GitHub Actions: on merge to `main` — build, push images to GHCR, deploy to a `staging` namespace on the k3s cluster automatically
- [ ] Add a manual approval step (GitHub Environments) before deploying to `production` namespace
- [ ] Add a rollback workflow (redeploy previous image tag on demand)
- [ ] Document the full pipeline flow in `README.md`

**Demo at end of phase:** Merge a small change, watch it auto-deploy to staging, manually approve, watch it roll out to production.

## Phase 8 — Scaling, monitoring, and chaos test (Week 5-6)

**Goal:** Prove the system is resilient, not just "deployed." This is the portfolio centerpiece.

- [ ] Configure Horizontal Pod Autoscaler on the API deployment
- [ ] Deploy Prometheus + Grafana into the cluster (self-hosted, free) for basic dashboards
- [ ] Load-test the API (e.g., `k6` or `autocannon`) and record the HPA scaling pods up
- [ ] Run a chaos test: delete a running pod mid-demo and record the cluster self-healing
- [ ] Record a short demo video (60-90 seconds) showing: the app, a live incident being resolved, the CI/CD pipeline running, and the chaos test recovering

**Demo at end of phase:** A recorded video and a couple of GIFs for the README showing resilience, not just functionality.

---

## Stretch goals (post-MVP, optional)

- [ ] Terraform for infrastructure-as-code (replace manual EC2/k3s provisioning)
- [ ] Migrate the cluster to Oracle Cloud's Always Free tier before your AWS 12-month free tier expires, so the project stays live for free indefinitely
- [ ] Slack slash-command to declare incidents directly from Slack
- [ ] Integration with a real monitoring tool (e.g., UptimeRobot webhook) to auto-create incidents

## Definition of done (MVP)

- [ ] All functional requirements in `PRD.md` section 4 implemented
- [ ] CI/CD pipeline fully automated with a production approval gate
- [ ] App deployed and reachable on a real URL with HTTPS, at $0 cost
- [ ] Autoscaling and self-healing demonstrated and recorded
- [ ] `README.md`, `PRD.md`, `TECH_STACK.md` all accurate and up to date
- [ ] Demo video recorded and linked in `README.md`

## If you get stuck

This is normal — Phases 5-7 are genuinely the hardest part of DevOps to learn, even for experienced developers. If a step isn't working:
1. Read the actual error message in full before searching — `kubectl describe pod <name>` and `kubectl logs <name>` answer 90% of "why isn't this working"
2. Isolate the failure to one layer (is it the container, the manifest, the network, or the cluster itself?) before changing multiple things at once
3. It's fine to fall back to Phase 5's local cluster to debug a manifest issue before re-testing against the real server
