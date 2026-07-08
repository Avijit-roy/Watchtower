# Rules

Non-negotiable rules for this project. These apply to every contributor — human or AI — and to every part of the stack.

## 1. Security

1. Never commit secrets, API keys, database URIs, or credentials — real or realistic-looking — to source control, including in comments or example files.
2. All secrets are managed via `.env` files locally (gitignored) and Kubernetes Secrets in deployed environments.
3. `.env.example` must always reflect every environment variable currently in use, with placeholder values only.
4. Every API endpoint that mutates data must be authenticated. Read-only public endpoints (status page) are the only exception, and must be explicitly documented as public.
5. Role checks (Responder / Admin / Read-only) are enforced server-side, never trusted from the client alone.
6. Dependencies are kept up to date; known-vulnerable packages are not knowingly introduced.

## 2. Git & version control

1. No direct commits to `main` — all changes go through a pull request, even for solo development, to keep the CI pipeline and history clean.
2. Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
3. Each PR should represent one coherent change — avoid bundling unrelated fixes into a single PR.
4. No commented-out code, `console.log` debugging statements, or TODO comments without a linked issue merged into `main`.
5. Branch naming: `feature/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.

## 3. Code quality

1. All code must pass lint and tests before merge — enforced by the CI pipeline, not by manual discipline alone.
2. New functionality that has a clear happy path (create incident, post update, resolve incident, generate postmortem) requires at least one test.
3. Prefer readability over cleverness. This is a project reviewers and interviewers will read — code should explain itself.
4. Keep functions and components small and single-purpose. If you're scrolling to understand one function, it's too big.
5. Follow the conventions in `FRONTEND_GUIDELINES.md` for client code and standard REST/Express conventions for server code (routes → controllers → services → models).

## 4. Infrastructure & deployment

1. No manual `kubectl apply` or manual image pushes to production once the CI/CD pipeline exists — the pipeline is the only path to production. Manual steps are for local/staging debugging only.
2. Every Kubernetes Deployment must define resource `requests` and `limits`, and readiness/liveness probes. No exceptions — this is what makes self-healing and autoscaling actually work.
3. Infrastructure changes (new services, new AWS resources) are documented in `TECH_STACK.md` and reflected in the architecture diagram in `README.md`.
4. Production deploys always require the manual approval gate in GitHub Actions. This gate is never removed or bypassed, even under time pressure.
5. Any change to a GitHub Actions workflow must be validated against staging before it can affect the production deploy job.

## 5. Budget & cost control

1. **This project must run at $0.** Every infrastructure decision is checked against `TECH_STACK.md`'s free-tier strategy before being adopted.
2. Never provision an AWS (or other cloud) resource that isn't explicitly marked "Free Tier eligible" in the console, without first pausing to confirm the cost.
3. An AWS Billing Budget/Alert at $1 must be set up before any AWS resource is created (see `plan.md` Phase 0). This is not optional — it's the safety net for every other rule in this section.
4. No managed services that replace the free self-hosted equivalents already chosen (e.g., don't swap self-managed k3s for EKS, or Prometheus/Grafana for a paid SaaS monitoring tool) without an explicit decision to accept the cost.
5. If a free tier has a time limit (e.g., AWS's 12-month EC2 free tier), the migration path (Oracle Cloud Always Free) must be documented and planned for before the limit is reached, not discovered after a bill arrives.

## 6. Scope discipline

1. `PRD.md` is the source of truth for what's in scope. Features not listed there (on-call scheduling, multi-tenancy, mobile app, automated incident detection) are out of scope for MVP and should not be started without first updating the PRD.
2. If a "quick addition" would take more than an hour or touch more than one service, it's not quick — pause and evaluate against the roadmap in `plan.md`.
3. Prefer finishing and polishing the MVP feature set over partially building stretch goals.

## 7. Documentation

1. Any new environment variable, API endpoint, or infrastructure component must be reflected in the relevant doc (`README.md`, `TECH_STACK.md`, or `PRD.md`) in the same PR that introduces it — not as a follow-up.
2. Any new frontend convention or pattern change must be reflected in `FRONTEND_GUIDELINES.md` in the same PR.
3. `CLAUDE.md` should be updated if project conventions change, so AI-assisted contributions stay consistent.
4. Keep `plan.md` current — check off completed phases as they're finished, don't let it drift out of sync with actual progress. `plan.md` is the single source of truth for build progress; don't track it separately elsewhere.

## 8. AI-assisted development

1. AI tools (including Claude) must follow `CLAUDE.md` in addition to this file.
2. AI-generated code is reviewed with the same scrutiny as human-written code before merging — it is not exempt from lint, tests, or PR review.
3. AI should not introduce new libraries, infrastructure tools, or architectural patterns beyond what's defined in `TECH_STACK.md` without explicitly flagging the change for review.
