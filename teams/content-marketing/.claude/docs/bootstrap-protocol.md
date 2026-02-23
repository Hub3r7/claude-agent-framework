# Bootstrap Protocol — From Generic to Project-Specific

## Purpose

Replace all `[PROJECT-SPECIFIC]` placeholder sections with concrete, project-specific rules through a structured conversation.

## When to run

Run bootstrap when `CLAUDE.md` still contains `[PROJECT-SPECIFIC]` placeholders or the user says "bootstrap".

## Bootstrap phases

### Phase 1 — Content Operations Discovery

1. **Brand** — Name, industry, mission, values, positioning.
2. **Audience** — Target personas, pain points, information needs, content consumption habits.
3. **Voice and tone** — Formal/casual, authoritative/friendly, personality traits, words to use/avoid.
4. **Content types** — Blog, social, newsletter, email, whitepapers, case studies, video scripts?
5. **Channels** — Website/blog, social platforms, email, syndication, paid distribution?
6. **SEO** — Target keywords/topics, domain authority, organic traffic goals?
7. **Competition** — Key competitors, differentiation angle, content gaps to exploit?
8. **Process** — Current workflow, approval chain, stakeholders, publishing cadence?
9. **Compliance** — Regulated industry? Legal review needed? Disclosure requirements?

Start with 1-3 and let the conversation flow naturally.

### Phase 2 — Confirmation

```
CONTENT OPERATIONS PROFILE
===========================
Brand:          <name and positioning>
Audience:       <primary personas>
Voice:          <tone and personality>
Content types:  <formats produced>
Channels:       <distribution platforms>
SEO:            <goals and targets>
Competition:    <key competitors and differentiation>
Process:        <workflow and cadence>
Compliance:     <regulatory requirements>
```

Ask: "Does this capture your content operation correctly?"

### Phase 3 — Agent Specialization

Update all files by replacing `[PROJECT-SPECIFIC]` sections:

1. `CLAUDE.md` — All sections
2. `.claude/agents/strategist.md` — Brand voice, content pillars, audience personas
3. `.claude/agents/writer.md` — Brand voice details, format templates, style references
4. `.claude/agents/editor.md` — Style guide, readability targets, editorial standards
5. `.claude/agents/seo.md` — Target keywords, SEO tools, performance benchmarks
6. `.claude/agents/reviewer.md` — Brand guidelines, compliance requirements, source criteria
7. `.claude/agents/publisher.md` — CMS details, platforms, scheduling conventions
8. `.claude/agents/docs.md` — Style guide location, calendar format, documentation structure
9. `.claude/docs/project-context.md` — All sections

### Phase 4 — Verification

Read back all files, verify no `[PROJECT-SPECIFIC]` placeholders remain, report completion.

## Bootstrap principles

- Listen first, configure second
- Minimal viable specificity
- Consistency across files
- User approves before writing
- Iterative refinement — doesn't have to be perfect first pass
