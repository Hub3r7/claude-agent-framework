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
strategist      Opus      (content strategy requires creative reasoning)
writer          Opus      (original content creation, brand voice)
editor          Sonnet    (structured editorial review with style guide)
seo             Sonnet    (SEO optimization with defined patterns)
reviewer        Sonnet    (fact-checking and compliance verification)
publisher       Haiku     (formatting and scheduling, well-defined tasks)
docs            Haiku     (style guide updates, calendar, reports)
```

**Present this table to the user and ask:**
1. "Here is the recommended model assignment. Do you want to adjust any agent's model?"
2. If the user wants to minimize costs: suggest downgrading strategist to Sonnet
   (if content types are well-established) and writer to Sonnet (for shorter-form content).
3. If the user wants maximum quality: suggest upgrading editor to Opus for high-stakes content.

**After confirmation**, record the final assignment in `CLAUDE.md` under the Agent Team table
and in each agent's `.md` file header.

**Cost awareness rule:** The orchestrator should mention approximate relative cost:
Opus ≈ 3× Sonnet ≈ 15× Haiku. This helps users make informed trade-offs.

### Phase 4 — Agent Specialization

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

### Phase 5 — Verification

Read back all files, verify no `[PROJECT-SPECIFIC]` placeholders remain, report completion.

## Bootstrap principles

- Listen first, configure second
- Minimal viable specificity
- Consistency across files
- User approves before writing
- Iterative refinement — doesn't have to be perfect first pass
