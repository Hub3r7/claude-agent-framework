# Bootstrap Protocol — From Generic to Project-Specific

This document defines the bootstrap conversation that the orchestrator (Claude Code) runs
when first setting up the agent framework for a new project.

**CRITICAL:** The orchestrator MUST execute every phase in sequence. This is a strict protocol,
not a reference to consult loosely. Skipping phases or reordering produces unstable results.

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

### Phase 1 — Project Discovery (orchestrator ↔ user)

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

### Phase 1b — Agent Consultation (optional)

If the orchestrator judges that a specific agent's domain expertise would sharpen project
understanding, it MAY invoke that agent with targeted questions.

**Rules:**
- This is NOT mandatory — only use when user answers leave gaps in a specific domain.
- Not every agent needs to be consulted — only the ones relevant to the gap.
- The agent provides domain-specific follow-up questions; the orchestrator relays them to the user.
- The orchestrator remains the single point of contact with the user throughout.

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

### Phase 3 — Model Assignment

Discuss model selection for each agent with the user. The goal is to balance capability
against cost — not every agent needs the most powerful (and expensive) model.

**Available models (ordered by capability and cost):**
- **Opus** — Most capable, highest cost. Best for complex reasoning, design, and implementation.
- **Sonnet** — Strong balance of capability and cost. Good for review, analysis, and structured tasks.
- **Haiku** — Fast and cheapest. Suitable for straightforward, well-defined tasks.

**Default recommendation for this team:**

```
MODEL ASSIGNMENT (default)
==========================
architect       Opus      (schema design, pipeline architecture)
builder         Opus      (ETL implementation requires deep understanding)
quality         Sonnet    (data quality checks with defined rules)
analyst         Sonnet    (exploratory analysis, SQL review)
security        Sonnet    (PII detection, compliance verification)
optimizer       Sonnet    (performance tuning with defined patterns)
docs            Haiku     (documentation with clear templates)
```

**Present this table to the user and ask:**
1. "Here is the recommended model assignment. Do you want to adjust any agent's model?"
2. If the user wants to minimize costs: suggest downgrading architect to Sonnet (if pipelines
   are straightforward) and builder to Sonnet (if transformations are simple SQL).
3. If the user wants maximum quality: suggest upgrading security to Opus for PII-heavy workloads.

**After confirmation**, record the final assignment in `CLAUDE.md` under the Agent Team table
and in each agent's `.md` file header.

**Cost awareness rule:** The orchestrator should mention approximate relative cost:
Opus ≈ 3× Sonnet ≈ 15× Haiku. This helps users make informed trade-offs.

### Phase 4 — Agent Specialization

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

### Phase 5 — Verification

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
