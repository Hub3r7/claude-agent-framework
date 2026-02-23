# Bootstrap Protocol — From Generic to Project-Specific

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

### Phase 1 — Restaurant Discovery

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

### Phase 3 — Agent Specialization

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

### Phase 4 — Verification

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
