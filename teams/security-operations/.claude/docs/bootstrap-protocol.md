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

### Phase 1 — Operations Discovery

Ask the user about the security operations scope. Cover these topics (adapt phrasing naturally):

1. **What are you protecting?** — Organization type, critical assets, threat landscape.
2. **SIEM and log sources** — What SIEM? What logs are ingested? Retention periods?
3. **Detection stack** — EDR, NDR, SOAR tools? Detection rule format (Sigma, YARA, Suricata)?
4. **Compliance frameworks** — SOC2, ISO 27001, PCI-DSS, HIPAA, GDPR? Which are mandatory?
5. **Incident classification** — How are incidents classified? Severity levels? SLAs?
6. **Notification requirements** — Who must be notified? When? Legal/regulatory requirements?
7. **Forensic capabilities** — What tools are available? Evidence storage? Chain of custody process?
8. **On-call and escalation** — On-call rotation? Escalation paths? External IR retainer?
9. **Threat intelligence** — Feeds, sharing groups, industry-specific threat actors?

Do NOT ask all 9 at once. Start with 1-3 and let the conversation flow.

### Phase 2 — Confirmation

Summarize what you learned in a structured format:

```
OPERATIONS PROFILE
==================
Organization:   <type and size>
Assets:         <critical assets and systems>
SIEM:           <SIEM tool and log sources>
Detection:      <EDR, NDR, SOAR, rule formats>
Compliance:     <applicable frameworks>
Classification: <incident severity levels>
Notification:   <requirements and contacts>
Forensics:      <tools and evidence procedures>
Escalation:     <on-call and escalation paths>
Threat Intel:   <feeds and focus areas>
```

Ask: "Does this capture the operations scope correctly? Anything to add or change?"

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
triager         Sonnet    (fast triage with structured classification)
analyst         Opus      (deep investigation, log correlation, attack chain reconstruction)
hunter          Opus      (threat hunting requires creative reasoning)
responder       Sonnet    (containment planning with structured playbooks)
forensic        Opus      (evidence analysis requires meticulous reasoning)
compliance      Sonnet    (regulatory verification with defined frameworks)
docs            Haiku     (reports and postmortems with clear templates)
```

**Present this table to the user and ask:**
1. "Here is the recommended model assignment. Do you want to adjust any agent's model?"
2. If the user wants to minimize costs: suggest downgrading analyst and forensic to Sonnet
   (if incidents are typically routine) and hunter to Sonnet (if proactive hunts are rare).
3. If the user wants maximum quality: suggest upgrading triager to Opus for complex alert landscapes.

**After confirmation**, record the final assignment in `CLAUDE.md` under the Agent Team table
and in each agent's `.md` file header.

**Cost awareness rule:** The orchestrator should mention approximate relative cost:
Opus ≈ 3× Sonnet ≈ 15× Haiku. This helps users make informed trade-offs.

### Phase 4 — Agent Specialization

Once confirmed, update the following files by replacing `[PROJECT-SPECIFIC]` sections:

1. **`CLAUDE.md`** — Fill in all project-specific sections
2. **`.claude/agents/triager.md`** — Add alert sources, false positive patterns, classification criteria
3. **`.claude/agents/analyst.md`** — Add SIEM query patterns, log sources, MITRE ATT&CK focus
4. **`.claude/agents/hunter.md`** — Add hunting playbooks, data sources, TTP focus areas
5. **`.claude/agents/responder.md`** — Add containment playbooks, escalation contacts, approved tools
6. **`.claude/agents/forensic.md`** — Add forensic tools, evidence storage, chain of custody template
7. **`.claude/agents/compliance.md`** — Add compliance frameworks, control mapping, audit schedule
8. **`.claude/agents/docs.md`** — Add report templates, classification rules
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

If the operations scope evolves significantly:
- The user can say "re-bootstrap" to run the protocol again
- Only changed sections are updated (preserve what still applies)
