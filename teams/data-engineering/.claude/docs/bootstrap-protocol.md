# Bootstrap Protocol — From Generic to Project-Specific

This document defines the bootstrap conversation that the orchestrator (Claude Code) runs
when first setting up the agent framework for a new project.

## Purpose

The framework ships with generic agent instructions containing `[PROJECT-SPECIFIC]`
placeholder sections. The bootstrap protocol replaces those placeholders with concrete,
project-specific rules through a structured conversation with the user.

## When to run

Run bootstrap when:
- Starting a new project with this framework
- `CLAUDE.md` still contains `[PROJECT-SPECIFIC]` placeholders
- The user says "bootstrap", "set up agents", or "configure for this project"

## Bootstrap phases

### Phase 1 — Project Discovery

Ask the user about the project. Cover these topics (adapt phrasing naturally):

1. **What is the project?** — Name, purpose, what data is processed, who consumes it.
2. **Data sources** — What systems feed data in? APIs, databases, files, streams?
3. **Data warehouse/lake** — Where does processed data land? BigQuery, Snowflake, Redshift, S3, Databricks?
4. **Orchestration** — Airflow, Dagster, Prefect, dbt, custom? Scheduling patterns?
5. **Data quality** — Existing quality checks? SLAs for data freshness/completeness?
6. **Processing** — Batch vs streaming? Spark, pandas, SQL-only? Data volumes?
7. **Governance** — Data classification policy? PII handling? Compliance requirements (GDPR, HIPAA)?
8. **Environment** — Local dev setup, staging, production. CI/CD for pipelines.
9. **Conventions** — Naming rules for tables, columns, pipelines, schemas.

Do NOT ask all 9 at once. Start with 1-3 and let the conversation flow.

### Phase 2 — Confirmation

Summarize what you learned in a structured format:

```
PROJECT PROFILE
===============
Name:           <name>
Type:           <data platform / ETL pipeline / analytics infrastructure / etc.>
Sources:        <input data sources>
Warehouse:      <target data platform>
Orchestration:  <pipeline orchestration tool>
Processing:     <batch/stream, tools, volumes>
Quality:        <quality framework, SLAs>
Governance:     <classification, compliance>
Environment:    <dev/staging/prod setup>
Conventions:    <naming/structure rules>
```

Ask: "Does this capture the project correctly? Anything to add or change?"

### Phase 3 — Agent Specialization

Once confirmed, update the following files by replacing `[PROJECT-SPECIFIC]` sections:

1. **`CLAUDE.md`** — Fill in all project-specific sections
2. **`.claude/agents/architect.md`** — Add pipeline design review criteria
3. **`.claude/agents/builder.md`** — Add ETL conventions, tool-specific patterns
4. **`.claude/agents/quality.md`** — Add data quality check conventions, validation rules
5. **`.claude/agents/analyst.md`** — Add data access conventions, approved analysis tools
6. **`.claude/agents/security.md`** — Add data classification, compliance frameworks, PII handling
7. **`.claude/agents/optimizer.md`** — Add platform-specific optimization patterns, cost targets
8. **`.claude/agents/docs.md`** — Add data dictionary template, documentation conventions
9. **`.claude/docs/project-context.md`** — Fill in all sections

### Phase 4 — Verification

After updating all files:
1. Read back each modified file to verify no `[PROJECT-SPECIFIC]` placeholders remain
2. Verify consistency across files
3. Report to the user:

```
BOOTSTRAP COMPLETE
==================
Updated: CLAUDE.md, 7 agent files, project-context.md
Remaining placeholders: 0
Ready to start work.
```

## Bootstrap principles

- **Listen first, configure second.** Never assume — always ask.
- **Minimal viable specificity.** Don't over-specify.
- **Consistency is king.** The same fact must not be described differently in two files.
- **User approves.** Show the profile before writing.
- **Iterative refinement.** Bootstrap doesn't have to be perfect on the first pass.

## Re-bootstrap

If the project evolves significantly (new data source, new warehouse, major pipeline redesign):
- The user can say "re-bootstrap" to run the protocol again
- Only changed sections are updated (preserve what still applies)
