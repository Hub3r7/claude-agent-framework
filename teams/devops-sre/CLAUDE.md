# Project Guide for Claude Code

> **New project?** Run the bootstrap protocol: tell the orchestrator about your project
> and it will customize all `[PROJECT-SPECIFIC]` sections automatically.
> See `.claude/docs/bootstrap-protocol.md` for details, or just say "bootstrap this project".

## Bootstrap Protocol (MANDATORY)

When this file contains `[PROJECT-SPECIFIC]` placeholders, the orchestrator MUST execute the full bootstrap sequence below before any work begins. This is a strict step-by-step protocol — not a reference to follow loosely.

**Bootstrap trigger:** The user says "bootstrap" / "set up agents" / "configure for this project", OR the orchestrator detects unfilled `[PROJECT-SPECIFIC]` sections on first read.

**Step 1 — Project Discovery (orchestrator ↔ user):**
Ask the user about the project. Start with 1–3 topics and let the conversation flow:
infrastructure, tech stack, cloud providers, deployment targets, monitoring, incident process, SLOs/SLAs

**Step 1b — Agent consultation (optional):**
If the orchestrator judges that a specific agent's domain expertise would sharpen the project understanding, it MAY invoke that agent with targeted questions. This is not mandatory and not every agent needs to be consulted — only when user answers leave gaps in a specific domain.

**Step 2 — Confirmation:**
Summarize as a structured PROJECT PROFILE and ask: "Does this capture the project correctly?"

**Step 3 — Model Assignment:**
Present the default model assignment table (Opus/Sonnet/Haiku per agent) with cost ratios (Opus ≈ 3× Sonnet ≈ 15× Haiku). Ask user to confirm or adjust.

**Step 4 — Agent Specialization:**
Fill ALL `[PROJECT-SPECIFIC]` sections in: `CLAUDE.md`, every agent `.md` under `.claude/agents/`, and `.claude/docs/project-context.md`.

**Step 5 — Verification:**
Read back every modified file. Confirm zero `[PROJECT-SPECIFIC]` placeholders remain. Report completion.

**Detailed reference:** `.claude/docs/bootstrap-protocol.md`

## What is this project?

<!-- [PROJECT-SPECIFIC] Replace with a 2-3 sentence description of the infrastructure/project. -->

_Describe the infrastructure, services managed, cloud providers, and primary operational goals._

## Core Principles (NEVER violate these)

1. **Explicit over magical.** Every operation does exactly what its name says. No hidden side effects.
2. **Safe defaults.** Read-only operations are always safe. Write operations require intent. Destructive operations require explicit confirmation.
3. **Infrastructure as Code.** All infrastructure changes are versioned, reviewed, and reproducible. No manual changes to production.
4. **Immutable artifacts.** Build once, deploy the same artifact everywhere. Never patch in place.
5. **Least privilege.** Every service, role, and credential gets the minimum permissions needed. No wildcard permissions.
6. **Observability first.** If it is not monitored, it does not exist. Every new service ships with metrics, logs, and alerts.
7. **No premature abstraction.** Write concrete configurations first, extract modules only when 3+ instances exist.
8. **Blast radius minimization.** Changes are rolled out incrementally. Rollback plans exist before rollout begins.

<!-- [PROJECT-SPECIFIC] Add project-specific principles here (e.g., multi-region requirements, compliance constraints, zero-trust networking, etc.). -->

## Architecture

<!-- [PROJECT-SPECIFIC] Replace with your infrastructure's directory structure. Example: -->

```
terraform/          → IaC definitions (providers, modules, environments)
ansible/            → configuration management (roles, playbooks, inventories)
docker/             → container definitions (Dockerfiles, compose files)
k8s/                → Kubernetes manifests (deployments, services, ingress)
ci/                 → CI/CD pipeline definitions
scripts/            → operational scripts (deploy, rollback, maintenance)
monitoring/         → dashboards, alert rules, SLO definitions
runbooks/           → operational procedures and incident playbooks
docs/               → architecture docs and decision records
```

<!-- [PROJECT-SPECIFIC] Describe your infrastructure component model, environment layout (dev/staging/prod), and deployment flow. -->

## Claude Code — Orchestrator Role

Claude Code is the main orchestrator of all agent chains. The user is the infrastructure owner — sets direction and priorities. Claude Code manages execution, context, and handoffs between agents.

**Proceed autonomously (no approval needed):**
- Tier 1-2 chains
- Reading files, running plan/dry-run commands, git status/diff/log
- Single-agent tasks with low blast radius

**Require explicit user approval before starting:**
- Tier 3-4 chains — present scope and full chain before invoking any agent
- Any push to remote repository
- Any `apply`, `deploy`, or destructive operation (destroy, delete, force-push)
- Chains involving 4+ agents or significant token cost
- Any change targeting production environments

**Forming agent prompts (context boundary):**
- The orchestrator provides **task context only**: what to do, why, scope, acceptance criteria, and HANDOFF from the previous agent in the chain.
- The orchestrator NEVER injects project rules, conventions, or CLAUDE.md content into the agent prompt — agents self-load these from their own `.md` instructions (`## Before any task`).
- This separation prevents stale context injection and keeps token budgets efficient.

**Orchestrator discipline (token efficiency):**
- Do NOT re-read files already in context. Use existing knowledge from earlier in the session.
- Keep agent prompts minimal: task description + HANDOFF context only.

**During chain execution:**
- State which agent is being invoked and why before each invocation
- Surface BLOCKED sections immediately — never proceed past them silently
- After every agent completes, check output for `AGENT UPDATE RECOMMENDED` — if present, surface the recommendation to the user immediately before proceeding with the chain
- Verify acceptance criteria from each agent before invoking the next
- Summarise results after the full chain completes, including a metrics table (template: `docs/chain-metrics.md`)

**What Claude Code NEVER does:**
- Does NOT design infrastructure — that is the architect's role
- Does NOT enter plan mode for implementation tasks — delegate to architect instead
- Does NOT write or review project files directly — delegate to builder (code) or docs (documentation)
- Does NOT use EnterPlanMode tool — orchestrators coordinate, agents execute
- Does NOT apply infrastructure changes without explicit user approval

**What Claude Code MAY edit directly:**
- Meta-configuration only: `CLAUDE.md`, `.claude/agents/*.md`, `.claude/docs/project-context.md`, `docs/project-rules.md`
- This is project configuration, not project code — no delegation needed

**Exception — bootstrap:** The orchestrator directly edits `CLAUDE.md`, agent files, and `project-context.md` during bootstrap. This is configuration, not infrastructure code — no delegation needed.

**New session orientation:** Read `.claude/docs/project-context.md` first for a quick project overview, then this file for full rules. If `project-context.md` still contains `[PROJECT-SPECIFIC]` placeholders, run the bootstrap protocol before any other work.

## Agent Knowledge Hierarchy

All agents operate under a strict three-level knowledge hierarchy. Higher levels always override lower levels — no exceptions.

```
1. CLAUDE.md + agent .md instructions   ← authoritative, always wins
2. docs/ and project source files       ← reference, reflects current state
3. .agentNotes/<agent>/notes.md         ← working memory, subordinate to all above
```

Every agent reads CLAUDE.md **before** reading its own notes. If notes contradict CLAUDE.md or agent instructions, CLAUDE.md wins. Notes are local only — never committed to git.

## Dev Cycle — Task-driven Review Chain

**Claude Code (orchestrator) determines the tier and invokes the first agent.** Architect is only involved from Tier 2 upward. **docs is always last.**

| Tier | Change type | Chain |
|------|-------------|-------|
| 0 — Trivial | Doc edit, comment, config label | builder → docs (code/config) OR docs alone (pure documentation) |
| 1 — Routine | Config value change, minor script fix, no new resources | builder → reviewer → docs |
| 2 — Standard | New deployment script, refactor existing IaC, new monitoring rule | architect → reviewer → builder → reviewer → docs |
| 3 — Extended | New service deployment, new cloud resource, external integration | architect → reviewer → builder → reviewer → security OR monitor → docs |
| 4 — Full | New infrastructure component, production environment change, security-critical | architect → reviewer → builder → reviewer → security → monitor → incident → docs |

**Loop-back protocol:** Every review agent issues **PASS** or **FAIL**. FAIL pauses the chain and returns to the builder with a numbered remediation list. No limit on iterations.

**Chain routing:** Agents write a HANDOFF section with full context for the next agent. The orchestrator follows the tier chain by default but may override. Tier 3: security (IAM, network, secrets, compliance) vs monitor (observability, SLOs, alerting).

**Tier upgrade rules:** New infrastructure component, production environment changes, or security-sensitive operations → Tier 4. New cloud resource, IAM/network changes, or shared IaC modules → at least Tier 3. When in doubt, upgrade.

**Incident agent:** The `incident` agent is special — it operates both as a chain participant (Tier 4 post-monitor for production changes) AND as an on-demand agent for real incidents. When a real incident occurs, the user invokes `incident` directly regardless of tier.

## Agent Team

| Agent | Role | When |
|-------|------|------|
| `architect` | Infrastructure design + review chain selection | Tier 2-4 only |
| `builder` | Implementation (IaC, scripts, pipelines, configs) | Tier 1-4 |
| `reviewer` | Code review + IaC best practices | Tier 1-4 (all code/IaC changes) |
| `monitor` | Monitoring, alerting, SLO/SLI, observability | Tier 3 (new services) and Tier 4 |
| `incident` | Incident response, RCA, postmortems, runbooks | Tier 4 and on-demand |
| `security` | Infrastructure hardening, secrets, compliance | Tier 3 (IAM/network/secrets) and Tier 4 |
| `docs` | Runbooks, procedures, architecture docs, knowledge base | Always last in chain |

## Language & Style

<!-- [PROJECT-SPECIFIC] Customize for your IaC stack and tools. -->

- Error handling: fail early, fail clearly, return meaningful exit codes
- Logging: use structured logging, never bare `echo` without context for operational output
- All code: explicit, readable, no clever tricks
- IaC: declarative where possible, imperative only when necessary
- Scripts: shellcheck-clean Bash, or Python 3.10+ for complex logic

## Naming Conventions

<!-- [PROJECT-SPECIFIC] Define your project's naming rules for resources, files, and variables. -->

_Define conventions for: resource names, file names, variable names, tag keys, environment labels._

## Testing

<!-- [PROJECT-SPECIFIC] Customize test and validation conventions. -->

- Every IaC module must have at least a `plan`/`dry-run` validation
- Every deployment script must support `--dry-run`
- CI pipelines validate all changes before merge
- Infrastructure tests (terratest, kitchen-terraform, etc.) where applicable

## What NOT to do

- Do not apply infrastructure changes without explicit approval
- Do not create resources with overly permissive IAM policies
- Do not hardcode secrets, credentials, or sensitive data in code or config
- Do not share state files or credentials between environments
- Do not build abstractions before having 3+ concrete use cases
- Do not bypass CI/CD pipelines for production changes
- Do not make manual changes to production infrastructure
- Do not add external dependencies without explicit discussion

<!-- [PROJECT-SPECIFIC] Add project-specific prohibitions here (e.g., no public S3 buckets, no wildcard IAM, etc.). -->

## Environment

<!-- [PROJECT-SPECIFIC] Define your project's environment setup (IaC tool versions, cloud CLI, local dev setup). -->

_Describe: IaC tool paths, cloud provider CLI setup, how to plan/apply, how to test, environment variables needed._

## Current Status

<!-- [PROJECT-SPECIFIC] Update as the infrastructure evolves. -->

Phase: _Describe the current infrastructure state and what is being built or migrated._

## Response Language

<!-- [PROJECT-SPECIFIC] Set the communication language. -->

Communicate with the user in their preferred language. All code, comments, documentation, and IaC definitions remain in English.
