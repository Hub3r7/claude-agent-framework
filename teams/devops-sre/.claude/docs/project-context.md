# Project Context

*Quick-load context for new sessions. Full operational rules: `CLAUDE.md`. This file is generated during bootstrap — do not edit manually unless you know what you're doing.*

## What and Why

<!-- [PROJECT-SPECIFIC] Describe the infrastructure managed, who operates it, and primary operational goals. -->

## Infrastructure

<!-- [PROJECT-SPECIFIC] Table of managed services/environments with status and purpose. Replace the example row. -->

| Component | Status | Purpose |
|-----------|--------|---------|
| _example_ | _planned_ | _Example service_ |

## Agent Team

| Agent | Role | When |
|-------|------|------|
| `architect` | Infrastructure design + chain routing | Tier 2-4 only |
| `builder` | IaC implementation | Tier 1-4 |
| `reviewer` | IaC code review + best practices | Tier 1-4 (all changes) |
| `monitor` | Observability, SLOs, alerting | Tier 3 (new services) and Tier 4 |
| `incident` | Incident response, RCA, postmortem | Tier 4 and on-demand |
| `security` | Hardening, compliance, secrets | Tier 3 (IAM/network) and Tier 4 |
| `docs` | Runbooks, procedures, architecture docs | Always last in chain |

Review chains Tier 0-4. Architect enters from Tier 2. Reviewer mandatory from Tier 1. Tier 3 adds security OR monitor depending on task type; Tier 4 adds both. Every review agent issues PASS or FAIL — FAIL loops back to builder, chain paused until PASS. Full table: `CLAUDE.md` → Dev Cycle.

## Key Architectural Decisions

<!-- [PROJECT-SPECIFIC] List decisions that shape the infrastructure design (e.g., cloud provider choices, deployment strategy, multi-region, DR approach). -->

## Current Phase

<!-- [PROJECT-SPECIFIC] Describe what has been built so far and what is next. -->

## If Context Was Lost

New session or after compaction: read this file first, then `CLAUDE.md`. The two together restore full orientation without re-reading all configuration files. Agent instructions are in `.claude/agents/`.
