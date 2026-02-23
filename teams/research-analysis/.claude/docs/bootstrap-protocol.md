# Bootstrap Protocol — From Generic to Project-Specific

## Purpose

Replace all `[PROJECT-SPECIFIC]` placeholder sections with concrete, project-specific rules through a structured conversation.

## When to run

Run bootstrap when `CLAUDE.md` still contains `[PROJECT-SPECIFIC]` placeholders or the user says "bootstrap".

## Bootstrap phases

### Phase 1 — Research Context Discovery

1. **Domain** — What field/industry? Academic, market, competitive, policy, technical?
2. **Research type** — Qualitative, quantitative, mixed methods? Exploratory vs. confirmatory?
3. **Sources** — What data sources are available? Databases, APIs, documents, interviews?
4. **Output format** — Report, paper, presentation, brief, dashboard?
5. **Audience** — Who reads the output? Executives, academics, policymakers, general public?
6. **Citation style** — APA, MLA, Chicago, custom?
7. **Quality standards** — Peer-reviewed only? Gray literature acceptable? Minimum source count?
8. **Ethics** — IRB/ethics board requirements? Data privacy constraints?
9. **Tools** — Statistical software, data analysis tools, visualization tools?

Start with 1-3 and let the conversation flow naturally.

### Phase 2 — Confirmation

```
RESEARCH PROFILE
================
Domain:         <field and type>
Methods:        <preferred methodologies>
Sources:        <available data sources>
Output:         <expected deliverable format>
Audience:       <target readers>
Citations:      <citation style>
Quality:        <minimum standards>
Ethics:         <constraints and requirements>
Tools:          <analysis and visualization>
```

Ask: "Does this capture your research context correctly?"

### Phase 3 — Agent Specialization

Update all files by replacing `[PROJECT-SPECIFIC]` sections:

1. `CLAUDE.md` — All sections
2. `.claude/agents/planner.md` — Research domain, data sources, methodologies
3. `.claude/agents/researcher.md` — Databases, citation style, source quality criteria
4. `.claude/agents/analyst.md` — Analysis tools, statistical methods, frameworks
5. `.claude/agents/critic.md` — Quality criteria, methodological standards
6. `.claude/agents/visualizer.md` — Visualization tools, style guide, output formats
7. `.claude/agents/docs.md` — Report templates, citation style, documentation structure
8. `.claude/docs/project-context.md` — All sections

### Phase 4 — Verification

Read back all files, verify no `[PROJECT-SPECIFIC]` placeholders remain, report completion.

## Bootstrap principles

- Listen first, configure second
- Minimal viable specificity
- Consistency across files
- User approves before writing
- Iterative refinement
