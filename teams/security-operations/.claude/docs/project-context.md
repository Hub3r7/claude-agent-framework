# Project Context

*Quick-load context for new sessions. Full operational rules: `CLAUDE.md`. This file is generated during bootstrap — do not edit manually unless you know what you're doing.*

## What and Why

<!-- [PROJECT-SPECIFIC] Describe the security operations scope, what is protected, and primary security goals. -->

## Monitored Environment

<!-- [PROJECT-SPECIFIC] Table of monitored systems/services with status. Replace the example row. -->

| System | Status | Coverage |
|--------|--------|----------|
| _example_ | _monitored_ | _Example system_ |

## Agent Team

| Agent | Role | When |
|-------|------|------|
| `triager` | Alert triage, classification, escalation | Incident Tier 0-4 (entry point) |
| `analyst` | Deep analysis, correlation, IoC identification | Incident Tier 2-4, Proactive Tier 1-4 |
| `hunter` | Proactive threat hunting | Incident Tier 4, Proactive Tier 2-4 |
| `responder` | Containment, eradication, recovery | Incident Tier 1-4, Proactive Tier 4 |
| `forensic` | Evidence preservation, timeline reconstruction | Incident Tier 3-4, Proactive Tier 3-4 |
| `compliance` | Policy audit, regulatory review | Proactive Tier 1-4 |
| `docs` | Reports, playbooks, procedures | Always last |

Two workflows: Incident Response (reactive, triggered by alerts) and Proactive Security (planned, triggered by hunts/audits). Full tables: `CLAUDE.md`.

## Key Decisions

<!-- [PROJECT-SPECIFIC] List key decisions (e.g., SIEM choice, compliance priorities, detection philosophy, evidence handling). -->

## Current Phase

<!-- [PROJECT-SPECIFIC] Describe current security operations maturity and focus areas. -->

## If Context Was Lost

New session or after compaction: read this file first, then `CLAUDE.md`. The two together restore full orientation. Agent instructions are in `.claude/agents/`.
