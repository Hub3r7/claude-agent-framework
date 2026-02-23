# Project Context

*Quick-load context for new sessions. Full operational rules: `CLAUDE.md`. This file is generated during bootstrap — do not edit manually unless you know what you're doing.*

## What and Why

<!-- [PROJECT-SPECIFIC] Describe what data is processed, who consumes it, and primary data goals. -->

## Pipelines

<!-- [PROJECT-SPECIFIC] Table of pipelines/data domains with status and purpose. Replace the example row. -->

| Pipeline | Status | Purpose |
|----------|--------|---------|
| _example_ | _planned_ | _Example pipeline_ |

## Agent Team

| Agent | Role | When |
|-------|------|------|
| `architect` | Pipeline design + chain routing | Tier 2-4 only |
| `builder` | ETL/ELT implementation | Tier 1-4 |
| `quality` | Data quality + code review | Tier 1-4 (all changes) |
| `analyst` | Exploratory analysis, SQL review | On user request only |
| `security` | PII, compliance, access control | Tier 3 (PII/compliance) and Tier 4 |
| `optimizer` | Performance, cost optimization | Tier 3 (perf-critical) and Tier 4 |
| `docs` | Data dictionary, pipeline docs | Always last in chain |

Review chains Tier 0-4. Architect enters from Tier 2. Quality mandatory from Tier 1. Tier 3 adds security OR optimizer depending on task type; Tier 4 adds both. Every review agent issues PASS or FAIL — FAIL loops back to builder. Full table: `CLAUDE.md` → Dev Cycle.

## Key Architectural Decisions

<!-- [PROJECT-SPECIFIC] List decisions that shape the data architecture (e.g., batch vs stream, warehouse choice, partitioning strategy, data modeling approach). -->

## Current Phase

<!-- [PROJECT-SPECIFIC] Describe what has been built so far and what is next. -->

## If Context Was Lost

New session or after compaction: read this file first, then `CLAUDE.md`. The two together restore full orientation without re-reading all source files. Agent instructions are in `.claude/agents/`.
