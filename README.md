# Claude Agent Framework

A reusable agent infrastructure for [Claude Code](https://claude.com/claude-code)
(Anthropic's CLI for Claude) that provides structured, tiered review chains with
quality gates, offensive/defensive security review, and iterative loop-back protocols.

> **Requires Claude Code.** This framework uses Claude Code's agent system
> (`.claude/agents/*.md` and `CLAUDE.md`). It does not work with other tools.

## What is this?

This is a generalized framework extracted from real-world production use. It defines:

- **8 specialized agents** with clear roles, constraints, and collaboration protocols
- **5-tier dev cycle** (Tier 0-4) that scales review depth with change complexity
- **Loop-back protocol** where review agents issue PASS/FAIL verdicts — FAIL pauses the chain
- **Knowledge hierarchy** (CLAUDE.md > docs > agent notes) preventing instruction drift
- **Bootstrap protocol** that configures agents for your specific project through conversation

## Quick start

1. Clone this repo into your project:
   ```
   git clone https://github.com/Hub3r7/claude-agent-framework.git
   ```

2. Open Claude Code and say:
   ```
   bootstrap this project
   ```

3. Answer the orchestrator's questions about your project. It will:
   - Learn your stack, architecture, and conventions
   - Fill all `[PROJECT-SPECIFIC]` sections in CLAUDE.md and agent files
   - Generate your `.claude/docs/project-context.md`

4. Start working. The orchestrator will automatically:
   - Classify changes by tier (0-4)
   - Route to the correct agent chain
   - Enforce quality gates with PASS/FAIL loop-back

## Agent team

| Agent | Role | Model | Tier |
|-------|------|-------|------|
| `architect` | Design + chain routing | opus | 2-4 |
| `developer` | Implementation | opus | 1-4 |
| `quality-gate` | Security + architecture review | sonnet | 1-4 |
| `hunter` | Offensive security analysis | sonnet | 3-4 |
| `defender` | Defensive security / hardening | sonnet | 3-4 |
| `test-runner` | Test execution (on-demand) | haiku | user request |
| `ops-automation` | Workflow automation | sonnet | on request |
| `docs` | Documentation (always last) | sonnet | 0-4 |

## Dev cycle tiers

| Tier | Change type | Agents involved |
|------|-------------|-----------------|
| 0 | Typo, doc edit, config label | Direct edit → docs |
| 1 | Bug fix, small tweak | developer → quality-gate → docs |
| 2 | New feature, refactor | architect → quality-gate → developer → quality-gate → docs |
| 3 | External I/O, integrations | + hunter OR defender |
| 4 | New component, security-critical | + hunter AND defender |

## Key design decisions

**Why text instructions instead of programmatic enforcement?**
Text instructions interpreted by LLMs cover edge cases that rigid code cannot anticipate.
The model understands the *intent* behind a rule, not just its literal expression.
Combined with the PASS/FAIL loop-back protocol, this provides both flexibility and reliability.

**Why quality over cost?**
A Tier 4 chain is 7 agents. But one missed vulnerability costs more than 7 review passes.
The tier system ensures you only pay the full cost when the blast radius justifies it.

**Why agent notes?**
Agents accumulate project-specific knowledge through `.agentNotes/` — patterns they've seen,
decisions they've made, gotchas they've encountered. This knowledge persists across sessions
without polluting the authoritative instruction files.

## Structure

```
CLAUDE.md                          → Project rules + orchestrator instructions
.claude/agents/
  architect.md                     → Design + chain routing
  developer.md                     → Implementation
  quality-gate.md                  → Security + architecture review
  hunter.md                        → Offensive security
  defender.md                      → Defensive security
  docs.md                          → Documentation
  ops-automation.md                → Workflow automation
  test-runner.md                   → Test execution
.claude/docs/
  project-context.md               → Quick session orientation (template)
  bootstrap-protocol.md            → How bootstrap works
```

## Re-bootstrap

If your project evolves significantly (new language, architecture pivot), say
"re-bootstrap" and the orchestrator will update the project-specific sections
while preserving what still applies.

## Origin

This framework was not designed upfront — it emerged through iterative,
real-world development over several intensive days of building production
software with Claude Code. Every agent role, every tier boundary, every
loop-back rule was shaped by actual failures and fixes, not theory.

The result is an agent infrastructure that works in practice — not because
a committee designed it, but because it was pressure-tested through hundreds
of review cycles including full Tier 4 security chains with offensive and
defensive coverage.
