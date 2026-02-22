# Project Context

*Quick-load context for new sessions. Full operational rules: `CLAUDE.md`. This file is generated during bootstrap — do not edit manually unless you know what you're doing.*

## What and Why

<!-- Populated by bootstrap. Describe what the project does, who it is for, and primary design goals. -->

## Components

<!-- Populated by bootstrap. Table of modules/components with status and purpose. -->

| Component | Status | Purpose |
|-----------|--------|---------|
| _example_ | _planned_ | _Example component_ |

## Agent Team

| Agent | Role | When |
|-------|------|------|
| `architect` | Design + review chain selection | Tier 2-4 only |
| `developer` | Implementation | Tier 1-4 |
| `quality-gate` | Security + architecture review | Tier 1-4 (all code changes) |
| `hunter` | Attack surface / input analysis | Tier 3 (external I/O) and Tier 4 |
| `defender` | Defensive / artifact analysis | Tier 3 (data/artifacts) and Tier 4 |
| `test-runner` | Test execution and coverage | On user request only |
| `ops-automation` | Workflow automation | On request |
| `docs` | Documentation | Always last in chain |

Review chains Tier 0-4. Architect enters from Tier 2. quality-gate mandatory from Tier 1. Tier 3 adds hunter OR defender depending on task type; Tier 4 adds both. Every review agent issues PASS or FAIL — FAIL loops back to developer, chain paused until PASS. Full table: `CLAUDE.md` → Dev Cycle.

## Key Architectural Decisions

<!-- Populated by bootstrap. List decisions that shape the project's design. -->

## Current Phase

<!-- Populated by bootstrap. Describe what has been built and what's next. -->

## If Context Was Lost

New session or after compaction: read this file first, then `CLAUDE.md`. The two together restore full orientation without re-reading source files. Agent instructions are in `.claude/agents/`.
