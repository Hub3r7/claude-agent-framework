# Bootstrap Protocol — From Generic to Project-Specific

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

### Phase 1 — Restaurant Discovery (orchestrator ↔ user)

Ask the user about the restaurant. Cover these topics (adapt phrasing naturally):

1. **What restaurant?** — Name, type (fine dining, casual, fast food, cafe, bar), cuisine, concept.
2. **Scale** — Number of covers per day, seats, average check, annual revenue (if willing to share).
3. **Current costs** — Food cost %, labor cost %, overhead %, target margins. Biggest cost pain points.
4. **Menu** — Size (number of items), structure (appetizers/mains/desserts), seasonal rotation, specials frequency.
5. **Suppliers** — Single vs multi-source, key relationships, contract types, ordering frequency.
6. **Staff** — Kitchen size, FOH size, management structure, scheduling approach, cross-training level.
7. **Systems** — POS system, inventory management, recipe costing software, scheduling tools.
8. **Waste** — Current waste tracking? Known problem areas? Donation/compost programs?
9. **Seasonality** — Seasonal demand patterns, tourist vs. local, event-driven peaks.

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

Summarize what you learned:

```
RESTAURANT PROFILE
==================
Name:           <name>
Type:           <restaurant type and cuisine>
Scale:          <covers/day, seats, avg check>
Food cost:      <current % and target>
Labor cost:     <current % and target>
Menu:           <size, structure, rotation>
Suppliers:      <key suppliers and model>
Staff:          <size and structure>
Systems:        <POS, inventory, scheduling>
Pain points:    <top cost concerns>
Seasonality:    <key patterns>
```

Ask: "Does this capture your restaurant correctly? Anything to add or change?"

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
analyst         Opus      (financial analysis, trend identification, KPI tracking)
sourcing        Sonnet    (supplier evaluation with defined criteria)
menu-engineer   Sonnet    (menu mix analysis, contribution margin calculations)
waste           Sonnet    (waste analysis with defined metrics)
operations      Sonnet    (labor and workflow optimization)
quality-gate    Sonnet    (quality and safety verification)
docs            Haiku     (reports and action plans with clear templates)
```

**Present this table to the user and ask:**
1. "Here is the recommended model assignment. Do you want to adjust any agent's model?"
2. If the user wants to minimize costs: suggest downgrading analyst to Sonnet
   (if analyses are straightforward) and all specialists to Haiku (for simple operations).
3. If the user wants maximum quality: suggest upgrading menu-engineer to Opus
   (if menu optimization is the primary goal).

**After confirmation**, record the final assignment in `CLAUDE.md` under the Agent Team table
and in each agent's `.md` file header.

**Cost awareness rule:** The orchestrator should mention approximate relative cost:
Opus ≈ 3× Sonnet ≈ 15× Haiku. This helps users make informed trade-offs.

### Phase 4 — Agent Specialization

Once confirmed, update the following files by replacing `[PROJECT-SPECIFIC]` sections:

1. **`CLAUDE.md`** — Fill in all project-specific sections
2. **`.claude/agents/analyst.md`** — Add financial data sources, KPI targets, benchmarks
3. **`.claude/agents/sourcing.md`** — Add supplier list, procurement tools, quality standards
4. **`.claude/agents/menu-engineer.md`** — Add menu structure, POS data format, pricing philosophy
5. **`.claude/agents/waste.md`** — Add waste tracking details, portion standards, food safety protocols
6. **`.claude/agents/operations.md`** — Add scheduling tools, labor law constraints, staffing model
7. **`.claude/agents/quality-gate.md`** — Add food quality standards, HACCP protocols, service standards
8. **`.claude/agents/docs.md`** — Add report templates, action plan format
9. **`.claude/docs/project-context.md`** — Fill in all sections

### Phase 5 — Verification

After updating all files:
1. Read back each modified file to verify no `[PROJECT-SPECIFIC]` placeholders remain
2. Verify consistency across files
3. Report completion

## Bootstrap principles

- **Listen first, configure second.** Never assume — always ask.
- **Minimal viable specificity.** Don't over-specify.
- **Consistency is king.** The same fact must not be described differently in two files.
- **User approves.** Show the profile before writing.
- **Iterative refinement.** Bootstrap doesn't have to be perfect on the first pass.

## Re-bootstrap

If the restaurant evolves significantly (new concept, major menu overhaul, new location):
- The user can say "re-bootstrap" to run the protocol again
- Only changed sections are updated
