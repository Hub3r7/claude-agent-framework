# Claude Agent Framework

Most AI-assisted development is ad hoc: you ask Claude to write something, review it yourself, and hope nothing slips through. This framework replaces that with a structured, repeatable process.

It defines a team of 8 specialized agents, a 5-tier review system that scales depth with risk, and a loop-back protocol that enforces quality gates before any change advances. Everything is defined in markdown — no code to maintain, no tooling to integrate.

> **Requires Claude Code.** This framework uses Claude Code's sub-agent system
> (`.claude/agents/*.md` and `CLAUDE.md`). It does not work with other AI tools or IDEs.

## The problem it solves

When you ask Claude Code to implement something, a single context does everything: design, implementation, security review, documentation. That works for simple tasks. For anything with real complexity — external integrations, security-sensitive changes, shared code — a single pass is not enough. Blind spots compound.

This framework separates those concerns into specialized agents with defined responsibilities, explicit handoff protocols, and mandatory review gates. A security reviewer is not also the implementer. A doc agent is not also the architect. The orchestrator (Claude Code itself) routes work through the correct chain based on the tier of the change.

## Quick start

1. Clone this repo into your project root:
   ```
   git clone https://github.com/Hub3r7/claude-agent-framework.git
   ```

2. Open Claude Code and say:
   ```
   bootstrap this project
   ```

3. Answer the orchestrator's questions about your project. It will:
   - Learn your stack, architecture, conventions, and security posture
   - Fill all `[PROJECT-SPECIFIC]` sections in `CLAUDE.md` and all agent files
   - Generate your `.claude/docs/project-context.md` for fast session orientation

4. Start working normally. The orchestrator automatically:
   - Classifies each change by tier (0-4)
   - Routes to the correct agent chain
   - Enforces PASS/FAIL quality gates with loop-back on failure

## Agent team

| Agent | Role | Tier |
|-------|------|------|
| `architect` | Design + chain routing | 2-4 |
| `developer` | Implementation | 1-4 |
| `quality-gate` | Security + architecture review | 1-4 (all code changes) |
| `hunter` | Offensive security / attack surface analysis | 3-4 |
| `defender` | Defensive security / hardening | 3-4 |
| `test-runner` | Test execution and coverage | On request |
| `ops-automation` | Workflow automation | On request |
| `docs` | Documentation (always last) | 0-4 |

## Dev cycle tiers

| Tier | Change type | Chain |
|------|-------------|-------|
| 0 | Typo, doc edit, config label | Direct edit → docs |
| 1 | Bug fix, small tweak, no new files | developer → quality-gate → docs |
| 2 | New feature, refactor | architect → quality-gate → developer → quality-gate → docs |
| 3 | External I/O, integrations, new attack surface | + hunter OR defender |
| 4 | New major component, security-critical, shared code | + hunter AND defender |

The tier system exists to avoid two failure modes: under-reviewing risky changes, and over-reviewing trivial ones. A typo fix does not need 7 agents. A new authentication module does.

**Loop-back protocol:** Every review agent (quality-gate, hunter, defender) issues an explicit PASS or FAIL verdict. FAIL pauses the chain and returns to developer with a numbered remediation list. The chain does not advance until PASS is issued. There is no limit on iterations.

## Key design decisions

**Why markdown instructions instead of programmatic enforcement?**
Text instructions interpreted by an LLM cover edge cases that rigid code cannot anticipate. The model understands the intent behind a rule, not just its literal form. The PASS/FAIL loop-back protocol provides the reliability that pure instruction-following lacks on its own.

**Why a tiered system instead of always running all agents?**
A Tier 4 chain costs 7 agent invocations. That is the right cost for a security-critical change to shared infrastructure. It is the wrong cost for a one-line bug fix. Tiering ensures the depth of review matches the blast radius of the change.

**Why agent notes?**
Agents accumulate project-specific knowledge across sessions through `.agentNotes/` — patterns they have seen, decisions they have made, gotchas they have encountered. Notes are subordinate to `CLAUDE.md` and agent instructions (never override authoritative rules), but they provide working memory that makes agents more effective over time.

**Why a bootstrap protocol?**
Generic agent instructions produce generic results. The bootstrap protocol replaces every `[PROJECT-SPECIFIC]` placeholder with real knowledge about your stack, architecture, and conventions — through a conversation, not a config file. The agents become specialists in your project, not generalists.

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
  bootstrap-protocol.md            → Full bootstrap conversation protocol
```

## Re-bootstrap

If your project evolves significantly — new language, architecture pivot, major new component area — say "re-bootstrap" and the orchestrator will update the project-specific sections while preserving what still applies.

## Origin

This framework was not designed upfront. It emerged through iterative, real-world development over several intensive days of building production software with Claude Code. Every agent role, every tier boundary, every loop-back rule was shaped by actual failures and fixes — not theory.

The framework was validated on opsbox, a Python CLI tool for IT and security operations, where it ran hundreds of review cycles including full Tier 4 security chains with offensive and defensive coverage. What survived that process is what is here.

## License

MIT — see [LICENSE](LICENSE).

## Contact

Questions, feedback, or want to contribute? Reach out at **hub3r7@pm.me**.
